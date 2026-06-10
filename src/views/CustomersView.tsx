import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  Plus,
  Layers,
  Settings,
  Facebook,
  Linkedin,
  Instagram,
  ArrowRight,
  User,
  Upload,
  SlidersHorizontal,
  RotateCcw,
  FileText,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Customer, AttributeDefinition, Company, TierConfig } from "@/types";
import { CUSTOMER_STATUSES } from "@/data/customerStatuses";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { ImportCustomersDialog } from "@/components/customers/ImportCustomersDialog";
import { AttributeManager } from "@/components/customers/AttributeManager";
import { CrmSettingsDialog } from "@/components/customers/CrmSettingsDialog";
import { CustomerDashboard } from "@/components/customers/CustomerDashboard";
import { CustomerSearch } from "@/components/customers/CustomerSearch";
import { CustomerQrDialog } from "@/components/customers/CustomerQrDialog";
import { BulkActionDialog } from "@/components/customers/BulkActionDialog";
import { CustomerActivityLog } from "@/components/customers/CustomerActivityLog";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import {
  Building2,
  Cloud,
  CloudOff,
  ShieldAlert,
  Award,
  QrCode,
  Tag,
  UserCheck,
  Smartphone,
  History,
  Crown,
  Mail,
  Info,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BulkEmailDialog } from "@/components/customers/BulkEmailDialog";
import { toast } from "sonner";
import {
  getGuestCustomers,
  getGuestAttributes,
  getGuestCompanies,
} from "@/data/guestData";

const COLOR_PRESET_MAP_SHORT: Record<string, string> = {
  gold: "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20",
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  sky: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  slate: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const COLUMN_LABELS: Record<string, string> = {
  id: "Mã KH",
  nameEmail: "Họ tên & Email",
  social: "Mạng xã hội",
  company: "Công ty / Chi nhánh",
  status: "Trạng thái",
  points: "Điểm CRM",
  customAttributes: "Trường bổ sung",
  actions: "Hành động",
};

export function CustomersView() {
  const { user, hasPermission, loading: authLoading, signIn } = useFirebase();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCrmSettings, setShowCrmSettings] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "tag" | "status" | "points" | "tier"
  >("tag");
  const [search, setSearch] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Segment tab navigation states
  const [activeViewTab, setActiveViewTab] = useState<"list" | "segments">("list");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("seg_whales");
  const [segmentBuilderName, setSegmentBuilderName] = useState("");
  const [segmentBuilderMinSpend, setSegmentBuilderMinSpend] = useState<number>(10000000);
  const [segmentBuilderMinFrequency, setSegmentBuilderMinFrequency] = useState<number>(2);
  const [segmentBuilderColor, setSegmentBuilderColor] = useState<"emerald" | "blue" | "amber" | "rose" | "violet">("blue");

  // Load custom segments from local storage if available, default to pre-populated cohorts
  const [customSegments, setCustomSegments] = useState<Array<{
    id: string;
    name: string;
    minSpend: number;
    minFrequency: number;
    color: "emerald" | "blue" | "amber" | "rose" | "violet";
    isCustom?: boolean;
  }>>(() => {
    const saved = localStorage.getItem("crm_custom_segments_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "seg_whales",
        name: "VIP Đại Gia (LTV Cao, Tần suất lớn)",
        minSpend: 50000000,
        minFrequency: 3,
        color: "emerald",
      },
      {
        id: "seg_loyal",
        name: "Hội viên Thường Xuyên (Mua Sắm Đều Đặn)",
        minSpend: 20000000,
        minFrequency: 2,
        color: "blue",
      },
      {
        id: "seg_promising",
        name: "Hội viên Thường Thức (Casual Shoppers)",
        minSpend: 5000000,
        minFrequency: 1,
        color: "amber",
      },
      {
        id: "seg_at_risk",
        name: "Nhóm Có Rủi ro Rời bỏ (Churn Potential)",
        minSpend: 0,
        minFrequency: 0,
        color: "rose",
      },
    ];
  });
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [logCustomer, setLogCustomer] = useState<Customer | null>(null);

  const handleBulkUpdate = async (updateData: Partial<Customer>) => {
    if (!user || selectedCustomerIds.length === 0) return;

    setIsBulkUpdating(true);
    const toastId = toast.loading(
      `Đang cập nhật ${selectedCustomerIds.length} khách hàng...`,
    );

    try {
      if (user.isLocal || forceOffline) {
        const localCustomersStr = localStorage.getItem("crm_guest_customers");
        if (localCustomersStr) {
          let list: Customer[] = JSON.parse(localCustomersStr);
          list = list.map((c) => {
            if (selectedCustomerIds.includes(c.id)) {
              return {
                ...c,
                ...updateData,
                updatedAt: new Date().toISOString() as any,
              };
            }
            return c;
          });
          localStorage.setItem("crm_guest_customers", JSON.stringify(list));
          window.dispatchEvent(new Event("crm_guest_data_changed"));
        }
      } else {
        const batch = writeBatch(db);
        const customersCol = collection(db, "customers");

        selectedCustomerIds.forEach((id) => {
          const docRef = doc(customersCol, id);
          batch.update(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      toast.success(
        `Đã cập nhật ${selectedCustomerIds.length} khách hàng thành công!`,
        { id: toastId },
      );
      setSelectedCustomerIds([]);
      setShowBulkActionDialog(false);
    } catch (err: any) {
      console.error("Bulk update error:", err);
      toast.error(`Cập nhật thất bại: ${err.message}`, { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Custom column toggle configuration
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      id: true,
      nameEmail: true,
      social: false,
      company: true,
      status: true,
      points: false,
      churnRisk: true,
      customAttributes: false,
      actions: true,
    },
  );

  // Advanced filters toggle state & custom criteria values
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPoints, setMinPoints] = useState<string>("");
  const [maxPoints, setMaxPoints] = useState<string>("");
  const [selectedSocialType, setSelectedSocialType] = useState<string>("all"); // 'all', 'facebook', 'zalo', 'linkedin', 'instagram', 'tiktok'
  const [selectedHasCompany, setSelectedHasCompany] = useState<string>("all"); // 'all', 'yes', 'no'
  const [selectedTag, setSelectedTag] = useState<string>("all"); // specific segment card tag
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt_desc"); // sorting option

  // New state to view a single customer details dashboard
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedQrCustomer, setSelectedQrCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [forceOffline, setForceOffline] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!user || user.isLocal || forceOffline) {
      const loadGuestData = () => {
        setCustomers(getGuestCustomers());
        setAttributes(getGuestAttributes());
        setCompanies(getGuestCompanies());
        setLoading(false);
      };

      loadGuestData();
      window.addEventListener("crm_guest_data_changed", loadGuestData);
      return () => {
        window.removeEventListener("crm_guest_data_changed", loadGuestData);
      };
    }

    const customersPath = "customers";
    const attrsPath = "attribute_definitions";

    const isSuperAdmin =
      user.email?.toLowerCase() === "guest@localhost.internal" ||
      user.email?.toLowerCase() === "hungthai84@gmail.com";

    const qCustomers = query(
      collection(db, customersPath),
      orderBy("createdAt", "desc"),
    );

    const unsubCustomers = onSnapshot(
      qCustomers,
      (snapshot) => {
        if (snapshot.empty) {
          setCustomers(getGuestCustomers());
        } else {
          setCustomers(
            snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as Customer,
            ),
          );
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error for customers list:", error);
        setCustomers(getGuestCustomers());
        try {
          handleFirestoreError(error, OperationType.LIST, customersPath);
        } catch (e) {
          // Suppress throwing to avoid app freeze
        }
        setLoading(false);
      },
    );

    const qAttrs = query(
      collection(db, attrsPath),
      orderBy("createdAt", "asc"),
    );
    const unsubAttrs = onSnapshot(
      qAttrs,
      (snapshot) => {
        if (snapshot.empty) {
          setAttributes(getGuestAttributes());
        } else {
          setAttributes(
            snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as AttributeDefinition,
            ),
          );
        }
      },
      (error) => {
        console.error("Firestore error for custom attributes:", error);
        setAttributes(getGuestAttributes());
        try {
          handleFirestoreError(error, OperationType.LIST, attrsPath);
        } catch (e) {}
      },
    );

    const qCompanies = query(
      collection(db, "companies"),
      orderBy("name", "asc"),
    );
    const unsubCompanies = onSnapshot(
      qCompanies,
      (snapshot) => {
        if (snapshot.empty) {
          setCompanies(getGuestCompanies());
        } else {
          setCompanies(
            snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as Company,
            ),
          );
        }
      },
      (error) => {
        console.error("Firestore error for companies:", error);
        setCompanies(getGuestCompanies());
      },
    );

    const qTiers = query(
      collection(db, "tier_configs"),
      orderBy("threshold", "asc"),
    );
    const unsubTiers = onSnapshot(
      qTiers,
      (snapshot) => {
        if (!snapshot.empty) {
          setTierConfigs(
            snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as TierConfig,
            ),
          );
        }
      },
      (error) => {
        console.error("Firestore error for tiers:", error);
      },
    );

    return () => {
      unsubCustomers();
      unsubAttrs();
      unsubCompanies();
      unsubTiers();
    };
  }, [user, forceOffline]);

  const handleQuickSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const b1Id = "branch_cao_thang";
      const b2Id = "branch_trang_tien";

      const batchComp = writeBatch(db);

      const compB1Ref = doc(db, "companies", b1Id);
      const compB2Ref = doc(db, "companies", b2Id);

      batchComp.set(
        compB1Ref,
        {
          id: b1Id,
          name: "Chi nhánh HEART LOCK",
          type: "branch",
          address: "15-17 Cao Thắng, Phường 2, Quận 3, TP. Hồ Chí Minh",
          userId: user.uid,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      batchComp.set(
        compB2Ref,
        {
          id: b2Id,
          name: "Chi nhánh MEMORIENT",
          type: "branch",
          address: "86 Tràng Tiền, Hoàn Kiếm, Hà Nội",
          userId: user.uid,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      await batchComp.commit();

      const NAMES = [
        "Thái Hồng Hưng",
        "Nguyễn Minh Anh",
        "Trần Khánh Nhung",
        "Lê Gia Bảo",
        "Phạm Triệu Nam",
        "Hoàng Thu Thảo",
        "Huỳnh Quốc Kiệt",
        "Võ Quỳnh Chi",
        "Đặng Trà My",
        "Bùi Chí Đăng",
        "Đỗ Hà Vy",
      ];
      const GEMS = ["Diamond", "Ruby", "Sapphire", "Emerald", "Jade", "Pearl"];

      const batchCust = writeBatch(db);
      for (let i = 0; i < NAMES.length; i++) {
        const name = NAMES[i];
        const custRef = doc(collection(db, "customers"));
        const phone = "090" + Math.floor(1000000 + Math.random() * 9000000);
        const email =
          name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/\s+/g, ".") + `${i}@sevago.vip`;
        const points = Math.floor(100 + Math.random() * 15000);

        batchCust.set(custRef, {
          id: custRef.id,
          name,
          email,
          phone,
          avatarUrl: "",
          facebook: `facebook.com/user.${i}`,
          zalo: phone,
          points,
          activityStatus: Math.random() > 0.3 ? "active" : "inactive",
          companyId: Math.random() > 0.5 ? b1Id : b2Id,
          userId: user.uid,
          customFields: {
            clv: Math.floor(10000000 + Math.random() * 900000000),
            repeat_rate: Math.floor(65 + Math.random() * 30),
            last_purchase: "2026-05-25",
            region: Math.random() > 0.5 ? "TP.HCM" : "Hà Nội",
            collection: GEMS[Math.floor(Math.random() * GEMS.length)],
            autoTags: [
              {
                tag:
                  points >= 10000
                    ? "Atelier"
                    : points >= 2500
                      ? "Icon"
                      : points >= 500
                        ? "Essential"
                        : "Member",
                color:
                  points >= 2500 ? "gold" : points >= 500 ? "emerald" : "slate",
              },
            ],
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batchCust.commit();
      toast.success(
        "Đã hoàn tất nạp 11 khách hàng đặc quyền (VIP) mẫu lên Cloud!",
      );
    } catch (err: any) {
      console.error("Lỗi nạp mẫu:", err);
      toast.error(`Nạp dữ liệu không thành công: ${err.message || err}`);
    } finally {
      setSeeding(false);
    }
  };

  // Keep selectedCustomer updated if background data updates
  const currentCustomerData = selectedCustomer
    ? customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
    : null;

  const computeDynamicSegments = (c: Customer) => {
    const segments: { tag: string; color: string }[] = [];
    const points = c.points || 0;

    // Base tier mapping based on points
    if (points >= 10000) {
      segments.push({ tag: "Atelier", color: "purple" });
    } else if (points >= 2500) {
      segments.push({ tag: "Icon", color: "gold" });
    } else if (points >= 500) {
      segments.push({ tag: "Essential", color: "emerald" });
    } else {
      segments.push({ tag: "Member", color: "slate" });
    }

    // Value-based segmentation (Customer Lifetime Value)
    const clv = Number(c.customFields?.clv) || 0;
    if (clv >= 50000000) {
      segments.push({ tag: "Big Spender", color: "rose" });
    }

    // Activeness / Transaction History
    if (c.activityStatus && c.activityStatus.toLowerCase() === "churn_risk") {
      segments.push({ tag: "At Risk", color: "rose" });
    }

    if (points > 0 && clv === 0) {
      segments.push({ tag: "Newcomer", color: "sky" });
    }

    return segments;
  };

  const customersWithSegments = customers.map((c) => ({
    ...c,
    dynamicSegments: computeDynamicSegments(c),
  }));

  // Extract all unique dynamic tags from customers for filter dropdown
  const allTags = Array.from(
    new Set(
      customersWithSegments.flatMap((c) =>
        c.dynamicSegments.map((t: any) => t.tag),
      ),
    ),
  ) as string[];

  const resetFilters = () => {
    setSearch("");
    setSelectedCompanyId("all");
    setSelectedStatus("all");
    setSelectedTier("all");
    setMinPoints("");
    setMaxPoints("");
    setStartDate("");
    setEndDate("");
    setSelectedSocialType("all");
    setSelectedHasCompany("all");
    setSelectedTag("all");
    setSortBy("createdAt_desc");
    setVisibleColumns({
      id: true,
      nameEmail: true,
      social: false,
      company: true,
      status: true,
      points: false,
      customAttributes: false,
      actions: true,
    });
  };

  const handleExportIndividualPDF = (customer: Customer) => {
    const doc = new jsPDF() as any;
    const primaryColor = [47, 108, 245];
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("CUSTOMER LOYALTY REPORT", 105, 20, { align: "center" });
    doc.autoTable({
      startY: 60,
      head: [["Truong", "Gia tri"]],
      body: [
        ["Ho ten", customer.name],
        ["Email", customer.email],
        ["So dien thoai", customer.phone],
        ["Diem tich luy", (customer.points || 0).toLocaleString() + " pts"],
      ],
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    });
    doc.save(`SEVA_Report_${customer.name.replace(/\s+/g, "_")}.pdf`);
    toast.success(`Đã xuất báo cáo PDF cho ${customer.name}`);
  };

  const handleExportCSV = () => {
    try {
      if (sortedAndFilteredCustomers.length === 0) {
        toast.error("Không có dữ liệu khách hàng để xuất!");
        return;
      }

      // Headers for CSV
      const headers = [
        "Mã KH",
        "Họ và Tên",
        "Email",
        "Số điện thoại",
        "Chi nhánh",
        "Trạng thái",
        "Điểm tích lũy",
      ];

      const csvRows = [headers.join(",")];

      sortedAndFilteredCustomers.forEach((c) => {
        const companyName =
          companies.find((comp) => comp.id === c.companyId)?.name || "Cá nhân";
        const statusObj = CUSTOMER_STATUSES.find(
          (s) => s.code.toUpperCase() === c.activityStatus?.toUpperCase(),
        );
        const statusLabel = statusObj
          ? statusObj.classification
          : c.activityStatus || "Mới";

        const row = [
          c.id || "",
          c.name || "",
          c.email || "",
          c.phone || "",
          companyName,
          statusLabel,
          c.points || 0,
        ].map((val) => {
          // Escape quotes and wrap in quotes if has comma or quote
          const strVal = String(val).replace(/"/g, '""');
          return strVal.includes(",") ||
            strVal.includes("\n") ||
            strVal.includes('"')
            ? `"${strVal}"`
            : strVal;
        });

        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 Vietnamese support
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Danh-sach-khach-hang-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Xuất CSV thành công! Đã tải xuống ${sortedAndFilteredCustomers.length} khách hàng.`,
      );
    } catch (error: any) {
      console.error("CSV Export error:", error);
      toast.error(`Xuất dữ liệu thất bại: ${error.message || error}`);
    }
  };

  const handleSaveCustomSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentBuilderName.trim()) {
      toast.error("Vui lòng nhập tên phân khúc!");
      return;
    }

    const newSegment = {
      id: `seg_${Date.now()}`,
      name: segmentBuilderName.trim(),
      minSpend: Number(segmentBuilderMinSpend),
      minFrequency: Number(segmentBuilderMinFrequency),
      color: segmentBuilderColor,
      isCustom: true
    };

    const updated = [...customSegments, newSegment];
    setCustomSegments(updated);
    localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
    setSelectedSegmentId(newSegment.id);
    
    // Reset Form
    setSegmentBuilderName("");
    setSegmentBuilderMinSpend(10000000);
    setSegmentBuilderMinFrequency(2);
    setSegmentBuilderColor("blue");
    toast.success(`Đã tạo thành công phân khúc ${newSegment.name}!`);
  };

  const handleDeleteCustomSegment = (segId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa phân khúc khách hàng tự định nghĩa này?")) {
      const updated = customSegments.filter(s => s.id !== segId);
      setCustomSegments(updated);
      localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
      
      // If we deleted the active one, redirect to first standard cohort
      if (selectedSegmentId === segId) {
        setSelectedSegmentId("seg_whales");
      }
      toast.success("Đã xóa phân khúc thành công!");
    }
  };

  const currentSegmentData = customSegments.find(s => s.id === selectedSegmentId) || customSegments[0];

  const matchedCustomersInSegment = useMemo(() => {
    if (!currentSegmentData) return [];
    
    return customers.filter(c => {
      const spend = c.customFields?.spend || 0;
      const freq = c.orders?.length || 0;
      
      // At Risk Churn special criteria logic
      if (currentSegmentData.id === "seg_at_risk") {
        return c.activityStatus === "churn_risk" || c.customFields?.risk_score >= 70;
      }
      
      return spend >= currentSegmentData.minSpend && freq >= currentSegmentData.minFrequency;
    });
  }, [customers, currentSegmentData]);

  const handleExportSegmentCSV = () => {
    try {
      if (matchedCustomersInSegment.length === 0) {
        toast.error("Phân khúc này hiện chưa có khách hàng để xuất!");
        return;
      }

      const headers = [
        "Mã KH",
        "Họ và Tên",
        "Email",
        "Số điện thoại",
        "Giá trị trọn đời (VND)",
        "Tần suất mua hàng",
        "Điểm tích lũy"
      ];

      const csvRows = [headers.join(",")];
      matchedCustomersInSegment.forEach((c) => {
        const spend = c.customFields?.spend || 0;
        const freq = c.orders?.length || 0;
        const row = [
          c.id || "",
          c.name || "",
          c.email || "",
          c.phone || "",
          spend,
          freq,
          c.points || 0
        ].map((val) => {
          const strVal = String(val).replace(/"/g, '""');
          return strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')
            ? `"${strVal}"`
            : strVal;
        });
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Phan-khuc-${currentSegmentData.name.replace(/\s+/g, "-")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Đã xuất phân khúc ${currentSegmentData.name} với ${matchedCustomersInSegment.length} hội viên!`);
    } catch (e: any) {
      toast.error(`Xuất dữ liệu thất bại: ${e.message}`);
    }
  };

  const handleExportPDF = () => {
    try {
      if (sortedAndFilteredCustomers.length === 0) {
        toast.error("Không có dữ liệu khách hàng để xuất!");
        return;
      }

      const doc = new jsPDF() as any;
      doc.setFillColor(47, 108, 245);
      doc.rect(0, 0, 210, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("DANH SÁCH KHÁCH HÀNG - SEVA CRM", 105, 13, { align: "center" });

      const body = sortedAndFilteredCustomers.map((c) => [
        c.id || "",
        c.name || "",
        c.email || "",
        (c.points || 0).toLocaleString(),
        c.activityStatus || "ACTIVE",
      ]);

      doc.autoTable({
        startY: 25,
        head: [["ID", "Họ tên", "Email", "Điểm", "Trạng thái"]],
        body: body,
        theme: "grid",
        headStyles: { fillColor: [47, 108, 245] },
        styles: { fontSize: 8 },
      });

      doc.save(`Customer_Directory_${new Date().getTime()}.pdf`);
      toast.success("Xuất PDF thành công!");
    } catch (e) {
      toast.error("Xuất PDF thất bại.");
    }
  };

  const hasActiveFilters =
    search !== "" ||
    selectedCompanyId !== "all" ||
    selectedStatus !== "all" ||
    selectedTier !== "all" ||
    minPoints !== "" ||
    maxPoints !== "" ||
    startDate !== "" ||
    endDate !== "" ||
    selectedSocialType !== "all" ||
    selectedHasCompany !== "all" ||
    selectedTag !== "all" ||
    sortBy !== "createdAt_desc";

  const filteredCustomers = customersWithSegments.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toLowerCase().includes(search.toLowerCase());

    const matchesCompany =
      selectedCompanyId === "all" || c.companyId === selectedCompanyId;
    const ptsForTier = c.points || 0;
    let customTier = "Member";
    if (ptsForTier >= 10000) {
      customTier = "Atelier";
    } else if (ptsForTier >= 2500) {
      customTier = "Icon";
    } else if (ptsForTier >= 500) {
      customTier = "Essential";
    }
    const matchesTier =
      selectedTier === "all" ||
      customTier.toUpperCase() === selectedTier.toUpperCase();
    const matchesStatus =
      selectedStatus === "all" ||
      (c.activityStatus &&
        c.activityStatus.toUpperCase() === selectedStatus.toUpperCase());

    // Min Points
    const matchesMinPoints =
      minPoints === "" || (c.points || 0) >= Number(minPoints);

    // Max Points
    const matchesMaxPoints =
      maxPoints === "" || (c.points || 0) <= Number(maxPoints);

    // Social
    let matchesSocial = true;
    if (selectedSocialType !== "all") {
      if (selectedSocialType === "facebook") matchesSocial = !!c.facebook;
      else if (selectedSocialType === "zalo") matchesSocial = !!c.zalo;
      else if (selectedSocialType === "linkedin") matchesSocial = !!c.linkedin;
      else if (selectedSocialType === "instagram")
        matchesSocial = !!c.instagram;
      else if (selectedSocialType === "tiktok") matchesSocial = !!c.tiktok;
    }

    // Has Company
    let matchesHasCompany = true;
    if (selectedHasCompany === "yes") matchesHasCompany = !!c.companyId;
    else if (selectedHasCompany === "no") matchesHasCompany = !c.companyId;

    // Tag
    let matchesTag = true;
    if (selectedTag !== "all") {
      const tags = c.dynamicSegments || [];
      matchesTag = tags.some((t: any) => t.tag === selectedTag);
    }

    const parseSafeDate = (val: any): Date => {
      if (!val) return new Date(0);
      if (typeof val.toDate === "function") return val.toDate();
      if (val.seconds !== undefined) return new Date(val.seconds * 1000);
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    let matchesDate = true;
    const createdAtFormatted = parseSafeDate(c.createdAt);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && createdAtFormatted >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && createdAtFormatted <= end;
    }

    return (
      matchesSearch &&
      matchesCompany &&
      matchesStatus &&
      matchesTier &&
      matchesMinPoints &&
      matchesMaxPoints &&
      matchesDate &&
      matchesSocial &&
      matchesHasCompany &&
      matchesTag
    );
  });

  const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    const parseSafeDate = (val: any): Date => {
      if (!val) return new Date(0);
      if (typeof val.toDate === "function") {
        return val.toDate();
      }
      if (val.seconds !== undefined) {
        return new Date(val.seconds * 1000);
      }
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return new Date(0);
    };
    if (sortBy === "createdAt_desc") {
      const dateA = a.createdAt ? parseSafeDate(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? parseSafeDate(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    if (sortBy === "createdAt_asc") {
      const dateA = a.createdAt ? parseSafeDate(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? parseSafeDate(b.createdAt).getTime() : 0;
      return dateA - dateB;
    }
    if (sortBy === "points_desc") {
      return (b.points || 0) - (a.points || 0);
    }
    if (sortBy === "points_asc") {
      return (a.points || 0) - (b.points || 0);
    }
    if (sortBy === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name_desc") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  const getChurnRisk = (cust: Customer) => {
    // Advanced dynamic Churn Risk calculation engine
    let purchaseDates: Date[] = [];
    if (cust.orders && cust.orders.length > 0) {
      purchaseDates = cust.orders
        .map((o: any) => o.createdAt ? new Date(o.createdAt) : (o.date ? new Date(o.date) : null))
        .filter(Boolean) as Date[];
    } else {
      // Deterministic order generation based on points, clv and createdAt to formulate the "existing history"
      const rawCreated = cust.createdAt || "2026-01-01";
      const joinDate = new Date(rawCreated);
      let seedPoints = cust.points || 120;
      
      const orderCount = Math.max(2, Math.min(10, Math.floor(seedPoints / 250) + 2));
      const rawLast = cust.customFields?.last_purchase;
      const lastDate = rawLast ? new Date(rawLast) : new Date(new Date("2026-06-10T09:07:08Z").getTime() - (seedPoints % 45) * 24 * 3600 * 1000);
      
      const spanMs = lastDate.getTime() - joinDate.getTime();
      if (spanMs > 0 && orderCount > 1) {
        const step = spanMs / (orderCount - 1);
        for (let i = 0; i < orderCount; i++) {
          purchaseDates.push(new Date(joinDate.getTime() + step * i));
        }
      } else {
        purchaseDates = [new Date(new Date("2026-06-10T09:07:08Z").getTime() - 75 * 24 * 3600 * 1000), lastDate];
      }
    }

    purchaseDates.sort((a, b) => a.getTime() - b.getTime());
    const currentDate = new Date("2026-06-10T09:07:08Z");
    const lastPurchase = purchaseDates[purchaseDates.length - 1] || currentDate;
    const daysSinceLast = Math.floor((currentDate.getTime() - lastPurchase.getTime()) / (1000 * 3600 * 24));

    // Calculate average days between purchases
    let avgIntervalDays = 30;
    if (purchaseDates.length >= 2) {
      let totalGapDays = 0;
      for (let i = 1; i < purchaseDates.length; i++) {
        const gapMs = purchaseDates[i].getTime() - purchaseDates[i - 1].getTime();
        totalGapDays += gapMs / (1000 * 3600 * 24);
      }
      avgIntervalDays = Math.max(1, totalGapDays / (purchaseDates.length - 1));
    }

    const declineRatio = daysSinceLast / avgIntervalDays;
    let scoreNum = 0;
    if (declineRatio <= 0.8) {
      scoreNum = Math.round(declineRatio * 20);
    } else if (declineRatio <= 1.5) {
      scoreNum = Math.round(16 + (declineRatio - 0.8) * 40);
    } else {
      scoreNum = Math.round(Math.min(99, 44 + (declineRatio - 1.5) * 15));
    }

    let isDeclining = declineRatio > 1.25 && daysSinceLast > avgIntervalDays;

    if (daysSinceLast > 60 || (declineRatio > 1.8 && isDeclining)) {
      return {
        label: "Cực kỳ cao",
        score: Math.max(75, scoreNum),
        color: "text-rose-500 border-rose-500/20",
        bg: "bg-rose-500/10",
        icon: AlertCircle,
        reason: `Mua hàng giảm sút nghiêm trọng. Chu kỳ TB ${Math.round(avgIntervalDays)} ngày, hiện đã quá ${daysSinceLast} ngày vắng mặt.`,
      };
    } else if (daysSinceLast > 30 || (declineRatio > 1.15 && isDeclining)) {
      return {
        label: "Trung bình",
        score: Math.max(35, scoreNum),
        color: "text-amber-500 border-amber-500/20",
        bg: "bg-amber-500/10",
        icon: AlertCircle,
        reason: `Có dấu hiệu giãn cách nhẹ. Chu kỳ TB ${Math.round(avgIntervalDays)} ngày, hiện đã trễ ${daysSinceLast} ngày.`,
      };
    } else {
      return {
        label: "Mức thấp",
        score: Math.max(2, scoreNum),
        color: "text-emerald-500 border-emerald-500/20",
        bg: "bg-emerald-500/10",
        icon: UserCheck,
        reason: `Tần suất mua sắm lý tưởng. Chu kỳ TB ${Math.round(avgIntervalDays)} ngày, gần nhất ${daysSinceLast} ngày trước.`,
      };
    }
  };

  const getNextTierInfo = (points: number) => {
    if (points >= 10000) return "Cấp cao nhất (Atelier)";
    if (points >= 2500)
      return `Cần ${(10000 - points).toLocaleString()}đ nữa để lên Atelier`;
    if (points >= 500)
      return `Cần ${(2500 - points).toLocaleString()}đ nữa để lên Icon`;
    return `Cần ${(500 - points).toLocaleString()}đ nữa để lên Essential`;
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          Mới
        </Badge>
      );
    }

    const normStatus = status.toLowerCase();

    if (normStatus === "active" || normStatus === "hoạt động") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          Active
        </Badge>
      );
    }
    
    if (normStatus === "inactive" || normStatus === "không hoạt động" || normStatus === "ít tương tác") {
      return (
        <Badge className="bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 text-xs font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          Inactive
        </Badge>
      );
    }

    if (normStatus === "pending" || normStatus === "chờ xác minh" || normStatus === "pending_verification") {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          Pending
        </Badge>
      );
    }

    if (normStatus === "churn_risk" || normStatus === "nguy cơ rời bỏ" || normStatus === "rủi ro rời bỏ") {
      return (
        <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Churn Risk
        </Badge>
      );
    }

    const matched = CUSTOMER_STATUSES.find(
      (s) =>
        s.code.toUpperCase() === status.toUpperCase() ||
        s.classification.toLowerCase() === normStatus,
    );

    if (matched) {
      let dotColor = "bg-primary";
      if (matched.code.includes("ACTIVE") || matched.code.includes("VERIFIED") || matched.code === "VIP") {
        dotColor = "bg-emerald-500 animate-pulse";
      } else if (matched.code.includes("PENDING") || matched.code.includes("TEMP_LOCK") || matched.code === "DORMANT") {
        dotColor = "bg-amber-500";
      } else if (matched.code.includes("BLACK") || matched.code.includes("DELETE") || matched.code === "SUSPENDED" || matched.code === "DEACTIVATED") {
        dotColor = "bg-rose-500";
      }

      const customBg = matched.color?.bg || "bg-muted/40";
      const customText = matched.color?.text || "text-foreground";
      const customBorder = matched.color?.border || "border-border";

      return (
        <Badge className={cn("text-[11px] font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1.5 shadow-none select-none whitespace-nowrap", customBg, customText, customBorder)}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
          {matched.classification}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs font-semibold py-1 px-2.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
        {status}
      </Badge>
    );
  };

  if (authLoading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {currentCustomerData ? (
        <CustomerDashboard
          customer={currentCustomerData}
          userId={user?.uid || "guest"}
          companies={companies}
          attributes={attributes}
          tierConfigs={tierConfigs}
          onBack={() => setSelectedCustomer(null)}
        />
      ) : (
        <>
          <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs transition-all flex flex-col gap-5 relative z-30 backdrop-blur-md w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center relative bg-primary/10 shadow-xs shrink-0">
                  <User className="w-8 h-8 text-[#2f6cf5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                      Danh sách Khách hàng
                    </h2>
                    {forceOffline && (
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CloudOff className="w-3 h-3" /> Chế độ Offline
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Quản lý hồ sơ cá nhân, liên kết mạng xã hội đa điểm và điểm
                    số.
                  </p>

                  <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border/40 mt-4 max-w-fit select-none shrink-0">
                    <button
                      onClick={() => setActiveViewTab("list")}
                      className={cn(
                        "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        activeViewTab === "list"
                          ? "bg-white dark:bg-zinc-800 text-[#2f6cf5] shadow-xs border border-border/20 font-black"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      )}
                    >
                      <User className="w-3.5 h-3.5" /> Danh sách Hội viên
                    </button>
                    <button
                      onClick={() => setActiveViewTab("segments")}
                      className={cn(
                        "px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        activeViewTab === "segments"
                          ? "bg-white dark:bg-zinc-800 text-[#2f6cf5] shadow-xs border border-border/20 font-black"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      )}
                    >
                      <Layers className="w-3.5 h-3.5" /> Phân khúc (Segments)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {forceOffline && (
                  <button
                    onClick={() => {
                      setForceOffline(false);
                      setLoading(true);
                      toast.success("Đang kết nối lại Cloud Firestore...");
                    }}
                    className="flex items-center justify-center px-4 py-2 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl text-sm font-medium bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 mr-2" /> Kết nối Cloud
                  </button>
                )}
                <button
                  onClick={() => setShowCrmSettings(true)}
                  className="flex items-center justify-center px-4 py-2 border border-[#6366f1]/20 bg-[#6366f1]/5 text-[#6366f1] hover:bg-[#6366f1]/10 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2 text-[#6366f1]" /> Cài đặt
                  khách hàng
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center px-4 py-2 border border-[#2f6cf5]/20 rounded-xl text-sm font-bold bg-[#2f6cf5]/10 text-[#2f6cf5] hover:bg-[#2f6cf5]/20 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" /> Xuất CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center justify-center px-4 py-2 border border-blue-500/20 rounded-xl text-sm font-bold bg-blue-500/5 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" /> Xuất PDF
                </button>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="flex items-center justify-center px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  <Upload className="w-4 h-4 mr-2 text-[#2f6cf5]" /> Nhập CSV
                </button>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center shadow-lg shadow-primary/25 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
                </button>
              </div>
            </div>
            {/* Divider line separating upper actions and filters inside the banner */}
            <div className="border-t border-border/50 w-full mt-2" />

            {/* Row 2: Deep nested search and query filters inside the banner */}
            <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-start md:items-center mt-2">
              <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                <CustomerSearch
                  customers={customers}
                  value={search}
                  onChange={setSearch}
                  onSelectCustomer={(customer) => {
                    // In a real app we might open their profile or filter specifically to them
                    setSearch(customer.name);
                  }}
                />

                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="all">Tất cả chi nhánh</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {CUSTOMER_STATUSES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.classification}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
                  <Award className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                  >
                    <option value="all">Tất cả thứ hạng (Tier)</option>
                    <option value="Atelier">Thành viên Atelier</option>
                    <option value="Icon">Thành viên Icon</option>
                    <option value="Essential">Thành viên Essential</option>
                    <option value="Member">Thành viên Member</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Column Visibility Configuration dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold bg-card hover:bg-muted/70 cursor-pointer text-foreground select-none transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Cột hiển thị</span>
                  </button>
                  {showColumnSettings && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border hover:border-primary/20 shadow-xl rounded-xl p-3.5 z-50 text-left backdrop-blur-xl">
                      <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                        Ẩn/hiện cột bảng
                      </div>
                      <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                        {Object.keys(visibleColumns).map((colKey) => (
                          <label
                            key={colKey}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer text-xs font-semibold select-none"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                              checked={visibleColumns[colKey]}
                              onChange={() =>
                                setVisibleColumns((prev) => ({
                                  ...prev,
                                  [colKey]: !prev[colKey],
                                }))
                              }
                            />
                            <span>{COLUMN_LABELS[colKey]}</span>
                          </label>
                        ))}
                      </div>
                      <div className="border-t border-border mt-3 pt-2.5 flex justify-between gap-1">
                        <button
                          onClick={() =>
                            setVisibleColumns({
                              id: true,
                              nameEmail: true,
                              social: false,
                              company: true,
                              status: true,
                              points: false,
                              customAttributes: false,
                              actions: true,
                            })
                          }
                          className="text-xs text-[#2f6cf5] hover:underline font-extrabold"
                        >
                          Mặc định
                        </button>
                        <button
                          onClick={() => setShowColumnSettings(false)}
                          className="text-xs text-muted-foreground hover:text-foreground font-extrabold"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Toggle Advanced Filters */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold bg-card hover:bg-muted/70 cursor-pointer text-foreground select-none transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-[#2f6cf5]" />
                  <span>Smart Filter</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-dashed border-border p-4 rounded-xl mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left w-full h-full"
              >
                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Phân khúc khách hàng
                  </label>
                  <select
                    className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                  >
                    <option value="all">Tất cả phân khúc</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Khoảng điểm CRM
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="Từ"
                      className="bg-background h-8 text-xs font-semibold"
                      value={minPoints}
                      onChange={(e) => setMinPoints(e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground font-bold">
                      -
                    </span>
                    <Input
                      type="number"
                      placeholder="Đến"
                      className="bg-background h-8 text-xs font-semibold"
                      value={maxPoints}
                      onChange={(e) => setMaxPoints(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Ngày tham gia
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      className="bg-background h-8 text-xs font-semibold px-1"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground font-bold">
                      -
                    </span>
                    <Input
                      type="date"
                      className="bg-background h-8 text-xs font-semibold px-1"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Liên kết Mạng xã hội
                  </label>
                  <select
                    className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                    value={selectedSocialType}
                    onChange={(e) => setSelectedSocialType(e.target.value)}
                  >
                    <option value="all">Tất cả liên kết</option>
                    <option value="facebook">Đã kết nối Facebook</option>
                    <option value="zalo">Đã kết nối Zalo</option>
                    <option value="linkedin">Đã kết nối LinkedIn</option>
                    <option value="instagram">Đã kết nối Instagram</option>
                    <option value="tiktok">Đã kết nối TikTok</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Loại khách hàng
                  </label>
                  <select
                    className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                    value={selectedHasCompany}
                    onChange={(e) => setSelectedHasCompany(e.target.value)}
                  >
                    <option value="all">Toàn bộ</option>
                    <option value="yes">Thuộc doanh nghiệp / Công ty</option>
                    <option value="no">Cá nhân tự do</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 md:col-span-3">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Thứ tự sắp xếp
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "createdAt_desc", label: "Mới nhất" },
                      { id: "createdAt_asc", label: "Cũ nhất" },
                      { id: "points_desc", label: "Điểm CRM: Cao → Thấp" },
                      { id: "points_asc", label: "Điểm CRM: Thấp → Cao" },
                      { id: "name_asc", label: "Họ tên (A-Z)" },
                      { id: "name_desc", label: "Họ tên (Z-A)" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortBy === opt.id ? "bg-primary/10 text-primary border-primary/30" : "bg-background hover:bg-muted border-border"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg font-bold transition-all shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Đặt lại tất cả
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {activeViewTab === "list" ? (
            <Card className="border border-border/50 bg-background/55 shadow-xs relative">
            {/* Bulk Action Floating Banner */}
            {selectedCustomerIds.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-50 bg-[#2f6cf5] text-white px-6 py-3 rounded-t-xl shadow-md flex items-center justify-between border-b border-[#2f6cf5]/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs">
                    {selectedCustomerIds.length} đã chọn
                  </span>
                  <span className="text-sm font-bold">Thao tác hàng loạt</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBulkActionType("tag");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> Gắn thẻ
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("tier");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" /> Hạng (Tier)
                  </button>
                  <button
                    onClick={() => setShowBulkEmailDialog(true)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Gửi Email
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("status");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" /> Trạng thái
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("points");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" /> Điểm số
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Bạn có chắc chắn muốn xóa những khách hàng đã chọn?",
                        )
                      )
                        return;
                      const toastId = toast.loading("Đang xóa...");
                      try {
                        const { writeBatch, doc } =
                          await import("firebase/firestore");
                        const batch = writeBatch(db);
                        selectedCustomerIds.forEach((id) => {
                          batch.delete(doc(db, "customers", id));
                        });
                        await batch.commit();
                        toast.success("Đã xóa xong!", { id: toastId });
                        setSelectedCustomerIds([]);
                      } catch (err: any) {
                        toast.error("Lỗi xóa dữ liệu", { id: toastId });
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" /> Xóa
                  </button>
                  <button
                    onClick={() => setSelectedCustomerIds([])}
                    className="px-3 py-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
            <CardHeader className="pb-3 hidden">
              <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-start md:items-center">
                <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
                  <CustomerSearch
                    customers={customers}
                    value={search}
                    onChange={setSearch}
                    onSelectCustomer={(customer) => {
                      setSearch(customer.name);
                    }}
                  />

                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                    >
                      <option value="all">Tất cả chi nhánh</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      {CUSTOMER_STATUSES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.classification}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Column Visibility Configuration dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnSettings(!showColumnSettings)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors select-none ${showColumnSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-card text-foreground"}`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Cột hiển thị</span>
                    </button>
                    {showColumnSettings && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border hover:border-primary/20 shadow-xl rounded-xl p-3.5 z-50 text-left backdrop-blur-xl">
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                          Ẩn/hiện cột bảng
                        </div>
                        <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                          {Object.keys(visibleColumns).map((colKey) => (
                            <label
                              key={colKey}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer text-xs font-semibold select-none"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                checked={visibleColumns[colKey]}
                                onChange={() =>
                                  setVisibleColumns((prev) => ({
                                    ...prev,
                                    [colKey]: !prev[colKey],
                                  }))
                                }
                              />
                              <span>{COLUMN_LABELS[colKey]}</span>
                            </label>
                          ))}
                        </div>
                        <div className="border-t border-border mt-3 pt-2.5 flex justify-between gap-1">
                          <button
                            onClick={() =>
                              setVisibleColumns({
                                id: true,
                                nameEmail: true,
                                social: false,
                                company: true,
                                status: true,
                                points: false,
                                customAttributes: false,
                                actions: true,
                              })
                            }
                            className="text-xs text-[#2f6cf5] hover:underline font-extrabold"
                          >
                            Mặc định
                          </button>
                          <button
                            onClick={() => setShowColumnSettings(false)}
                            className="text-xs text-muted-foreground hover:text-foreground font-extrabold"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Advanced Filters */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all duration-200 select-none ${showAdvancedFilters || hasActiveFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-card text-foreground"}`}
                  >
                    <Filter
                      className={`w-3.5 h-3.5 ${hasActiveFilters ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span>Smart Filter</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-dashed border-border p-4 rounded-xl mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left"
                >
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Phân khúc khách hàng
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                    >
                      <option value="all">Tất cả phân khúc</option>
                      {allTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Khoảng điểm CRM
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        placeholder="Từ"
                        className="bg-background h-8 text-xs font-semibold"
                        value={minPoints}
                        onChange={(e) => setMinPoints(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground font-bold">
                        -
                      </span>
                      <Input
                        type="number"
                        placeholder="Đến"
                        className="bg-background h-8 text-xs font-semibold"
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Liên kết Mạng xã hội
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                      value={selectedSocialType}
                      onChange={(e) => setSelectedSocialType(e.target.value)}
                    >
                      <option value="all">Tất cả liên kết</option>
                      <option value="facebook">Đã kết nối Facebook</option>
                      <option value="zalo">Đã kết nối Zalo</option>
                      <option value="linkedin">Đã kết nối LinkedIn</option>
                      <option value="instagram">Đã kết nối Instagram</option>
                      <option value="tiktok">Đã kết nối TikTok</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Loại khách hàng
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                      value={selectedHasCompany}
                      onChange={(e) => setSelectedHasCompany(e.target.value)}
                    >
                      <option value="all">Toàn bộ</option>
                      <option value="yes">Thuộc doanh nghiệp / Công ty</option>
                      <option value="no">Cá nhân tự do</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2 md:col-span-3">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Thứ tự sắp xếp
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "createdAt_desc", label: "Mới nhất" },
                        { id: "createdAt_asc", label: "Cũ nhất" },
                        { id: "points_desc", label: "Điểm CRM: Cao → Thấp" },
                        { id: "points_asc", label: "Điểm CRM: Thấp → Cao" },
                        { id: "name_asc", label: "Họ tên (A-Z)" },
                        { id: "name_desc", label: "Họ tên (Z-A)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSortBy(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortBy === opt.id ? "bg-primary/10 text-primary border-primary/30" : "bg-background hover:bg-muted border-border"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg font-bold transition-all shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Đặt lại tất cả
                    </button>
                  </div>
                </motion.div>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-border text-[#2f6cf5] focus:ring-[#2f6cf5] h-4 w-4 cursor-pointer"
                        checked={
                          sortedAndFilteredCustomers.length > 0 &&
                          selectedCustomerIds.length ===
                            sortedAndFilteredCustomers.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomerIds(
                              sortedAndFilteredCustomers.map((c) => c.id),
                            );
                          } else {
                            setSelectedCustomerIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    {visibleColumns.id && <TableHead>Mã KH</TableHead>}
                    {visibleColumns.nameEmail && (
                      <TableHead>Họ tên / Email</TableHead>
                    )}
                    {visibleColumns.social && (
                      <TableHead>Mạng xã hội</TableHead>
                    )}
                    {visibleColumns.company && <TableHead>Công ty</TableHead>}
                    {visibleColumns.status && <TableHead>Trạng thái</TableHead>}
                    {visibleColumns.churnRisk && (
                      <TableHead>Rủi ro rời bỏ</TableHead>
                    )}
                    {visibleColumns.points && <TableHead>Điểm CRM</TableHead>}
                    {visibleColumns.customAttributes &&
                      attributes
                        .slice(0, 1)
                        .map((attr) => (
                          <TableHead key={attr.id}>{attr.label}</TableHead>
                        ))}
                    {visibleColumns.actions && <TableHead>Hành động</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean).length +
                          1
                        }
                        className="text-center py-8 text-muted-foreground"
                      >
                        Đang tải dữ liệu khách hàng...
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean).length +
                          1
                        }
                        className="text-center py-12"
                      >
                        <div className="flex flex-col items-center justify-center max-w-lg mx-auto p-8 rounded-2xl border border-dashed border-border bg-card shadow-xs text-center space-y-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-full">
                            <User className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              Không tìm thấy khách hàng nào
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                              {customers.length > 0
                                ? "Không tìm thấy khách hàng nào khớp với các bộ lọc tìm kiếm được áp dụng hiện tại."
                                : "Cơ sở dữ liệu Firestore hiện chưa có khách hàng, hoặc tài khoản quản trị chưa nạp dữ liệu mẫu."}
                            </p>
                          </div>

                          {customers.length === 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
                              <button
                                onClick={handleQuickSeed}
                                disabled={seeding}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                              >
                                {seeding ? (
                                  <span className="flex items-center gap-1.5 justify-center">
                                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang nạp dữ liệu...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 justify-center">
                                    <Cloud className="w-3.5 h-3.5" />
                                    Nạp 11 KH VIP lên Firestore
                                  </span>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setForceOffline(true);
                                  toast.success(
                                    "Đã kích hoạt chế độ mô phỏng! Xem ngay 200 khách hàng mẫu.",
                                  );
                                }}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl cursor-pointer transition-all"
                              >
                                <CloudOff className="w-3.5 h-3.5" />
                                Xem offline sandbox (200 KH)
                              </button>
                            </div>
                          )}

                          {customers.length > 0 && (
                            <button
                              onClick={resetFilters}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl cursor-pointer transition-all"
                            >
                              Đặt lại tất cả bộ lọc
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        onClick={() => {
                          if (false) {
                            toast.error(
                              "Tài khoản của bạn không có quyền xem thông tin chi tiết khách hàng!",
                            );
                            return;
                          }
                          setSelectedCustomer(customer);
                        }}
                        className={`cursor-pointer transition-all duration-200 group/row border-b ${selectedCustomerIds.includes(customer.id) ? "bg-[#2f6cf5]/5 border-[#2f6cf5]/20" : "hover:bg-muted/40 active:bg-muted/60 border-border/50"}`}
                      >
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 text-center"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-[#2f6cf5] focus:ring-[#2f6cf5] h-4 w-4 cursor-pointer"
                            checked={selectedCustomerIds.includes(customer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomerIds((prev) => [
                                  ...prev,
                                  customer.id,
                                ]);
                              } else {
                                setSelectedCustomerIds((prev) =>
                                  prev.filter((id) => id !== customer.id),
                                );
                              }
                            }}
                          />
                        </TableCell>
                        {/* ID */}
                        {visibleColumns.id && (
                          <TableCell className="text-xs text-muted-foreground">
                            {customer.id}
                          </TableCell>
                        )}

                        {/* AVATAR + NAME */}
                        {visibleColumns.nameEmail && (
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs font-bold text-xs uppercase">
                                {customer.avatarUrl ? (
                                  <img
                                    src={customer.avatarUrl}
                                    className="w-full h-full object-cover"
                                    alt={customer.name}
                                  />
                                ) : (
                                  customer.name.slice(0, 2)
                                )}
                              </div>
                              <div>
                                <div className="font-extrabold text-foreground transition-colors flex items-center gap-1.5 flex-wrap">
                                  {customer.name}
                                  {Number(customer.customFields?.clv) >
                                    100000000 && (
                                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shadow-sm" />
                                  )}
                                  {customer.dynamicSegments?.map(
                                    (t: any, idx: number) => {
                                      const colorClass =
                                        COLOR_PRESET_MAP_SHORT[
                                          t.color || "gold"
                                        ] || COLOR_PRESET_MAP_SHORT.gold;
                                      return (
                                        <span
                                          key={idx}
                                          className={`inline-block px-2 py-0.5 text-xs font-black uppercase rounded border tracking-wide leading-none ${colorClass}`}
                                        >
                                          {t.tag}
                                        </span>
                                      );
                                    },
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground font-normal">
                                  {customer.email || "Không có email"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        )}

                        {/* SOCIAL LINKS CONNECTIVITY */}
                        {visibleColumns.social && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {/* Facebook */}
                              <span
                                title={
                                  customer.facebook || "Chưa liên kết Facebook"
                                }
                                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
                                  customer.facebook
                                    ? "bg-blue-600/10 text-blue-600 border-blue-600/30"
                                    : "bg-muted/10 text-muted-foreground/30 border-dashed border-border/60"
                                }`}
                              >
                                <Facebook className="w-3 h-3" />
                              </span>

                              {/* Zalo */}
                              <span
                                title={customer.zalo || "Chưa liên kết Zalo"}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-extrabold shadow-2xs transition-all ${
                                  customer.zalo
                                    ? "bg-sky-500/10 text-sky-600 border-sky-500/35 font-sans"
                                    : "bg-muted/10 text-muted-foreground/30 border-dashed border-border/60"
                                }`}
                              >
                                Z
                              </span>

                              {/* LinkedIn */}
                              <span
                                title={
                                  customer.linkedin || "Chưa liên kết LinkedIn"
                                }
                                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
                                  customer.linkedin
                                    ? "bg-blue-700/10 text-blue-700 border-blue-700/30"
                                    : "bg-muted/10 text-muted-foreground/30 border-dashed border-border/60"
                                }`}
                              >
                                <Linkedin className="w-3 h-3" />
                              </span>

                              {/* Instagram */}
                              <span
                                title={
                                  customer.instagram ||
                                  "Chưa liên kết Instagram"
                                }
                                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
                                  customer.instagram
                                    ? "bg-pink-600/10 text-pink-600 border-pink-600/30"
                                    : "bg-muted/10 text-muted-foreground/30 border-dashed border-border/60"
                                }`}
                              >
                                <Instagram className="w-3 h-3" />
                              </span>

                              {/* TikTok */}
                              <span
                                title={
                                  customer.tiktok || "Chưa liên kết TikTok"
                                }
                                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold shadow-2xs transition-all ${
                                  customer.tiktok
                                    ? "bg-foreground/10 text-foreground border-foreground/30"
                                    : "bg-muted/10 text-muted-foreground/30 border-dashed border-border/60"
                                }`}
                              >
                                TT
                              </span>
                            </div>
                          </TableCell>
                        )}

                        {/* COMPANY */}
                        {visibleColumns.company && (
                          <TableCell>
                            {customer.companyId ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                                  {companies.find(
                                    (comp) => comp.id === customer.companyId,
                                  )?.logoUrl ? (
                                    <img
                                      src={
                                        companies.find(
                                          (comp) =>
                                            comp.id === customer.companyId,
                                        )?.logoUrl
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Building2 className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-foreground truncate max-w-[120px] inline-block">
                                  {companies.find(
                                    (comp) => comp.id === customer.companyId,
                                  )?.name || "—"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Cá nhân
                              </span>
                            )}
                          </TableCell>
                        )}

                        {/* STATUS */}
                        {visibleColumns.status && (
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                  {renderStatusBadge(customer.activityStatus)}
                                </TooltipTrigger>
                                <TooltipContent className="bg-card border-border shadow-xl p-2 rounded-lg">
                                  <p className="text-xs font-bold text-foreground">
                                    {getNextTierInfo(customer.points || 0)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )}

                        {/* CHURN RISK */}
                        {visibleColumns.churnRisk && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const risk = getChurnRisk(customer);
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-help inline-block">
                                      <div
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border w-fit shadow-2xs ${risk.color} ${risk.bg}`}
                                      >
                                        <risk.icon className="w-3 h-3" />
                                        <span>AI Score: {risk.score}% ({risk.label})</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border border-border shadow-xl p-3 rounded-xl max-w-xs text-left">
                                      <div className="space-y-1.5">
                                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                          🧠 Đánh giá Churn AI
                                        </p>
                                        <p className="text-xs font-semibold text-foreground leading-relaxed">
                                          {risk.reason}
                                        </p>
                                        <div className="text-[10px] font-bold text-muted-foreground border-t border-border/80 pt-1 flex justify-between">
                                          <span>Xếp hạng: {risk.label}</span>
                                          <span className="text-[#2f6cf5]">Tin cậy: 94.6%</span>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}
                          </TableCell>
                        )}

                        {/* POINTS */}
                        {visibleColumns.points && (
                          <TableCell className="font-extrabold text-[#2f6cf5]">
                            {customer.points?.toLocaleString() || 0} pts
                          </TableCell>
                        )}

                        {/* EXTRA ATTRIBUTE */}
                        {visibleColumns.customAttributes &&
                          attributes.slice(0, 1).map((attr) => (
                            <TableCell
                              key={attr.id}
                              className="text-xs text-muted-foreground font-medium"
                            >
                              {customer.customFields?.[attr.key]?.toString() ||
                                "—"}
                            </TableCell>
                          ))}

                        {/* ACTION */}
                        {visibleColumns.actions && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQrCustomer(customer);
                                }}
                                className="p-1 px-2.5 bg-muted/60 group-hover/row:bg-muted rounded-lg text-xs font-bold text-foreground flex items-center gap-1 transition-all duration-200"
                                title="QR Check-in"
                              >
                                <QrCode className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogCustomer(customer);
                                  setShowActivityLog(true);
                                }}
                                className="p-1 px-2.5 bg-muted/60 group-hover/row:bg-muted rounded-lg text-xs font-bold text-foreground flex items-center gap-1 transition-all duration-200"
                                title="Lịch sử hoạt động"
                              >
                                <History className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => setSelectedCustomer(customer)}
                                className="p-1 px-2.5 bg-primary/10 group-hover/row:bg-primary group-hover/row:text-primary-foreground rounded-lg text-xs font-bold text-primary flex items-center gap-1 transition-all duration-200"
                              >
                                Xem Dashboard{" "}
                                <ArrowRight className="w-2.5 h-2.5 transition-transform duration-200 group-hover/row:translate-x-0.5" />
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full text-left">
            {/* LEFT SIDE: Segment management and builder */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-6 border border-border/50 bg-sidebar/40 backdrop-blur-md rounded-2xl shadow-md">
                <h3 className="text-base font-bold font-heading flex items-center gap-2 text-foreground mb-4">
                  <Layers className="w-5 h-5 text-[#2f6cf5]" /> Cấu hình Phân khúc Khách hàng
                </h3>
                
                {/* Form to create segment */}
                <form onSubmit={handleSaveCustomSegment} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Tên Phân khúc</label>
                    <Input
                      type="text"
                      placeholder="Ví dụ: VIP Vàng Thượng Lưu, Khách qua đường..."
                      value={segmentBuilderName}
                      onChange={(e) => setSegmentBuilderName(e.target.value)}
                      className="bg-transparent text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Giá trị trọn đời nhỏ nhất (LTV)</label>
                      <Input
                        type="number"
                        value={segmentBuilderMinSpend === 0 ? "" : segmentBuilderMinSpend}
                        onChange={(e) => setSegmentBuilderMinSpend(Number(e.target.value))}
                        className="bg-transparent text-xs font-semibold"
                        min={0}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Số đơn hàng tối thiểu</label>
                      <Input
                        type="number"
                        value={segmentBuilderMinFrequency === 0 ? "" : segmentBuilderMinFrequency}
                        onChange={(e) => setSegmentBuilderMinFrequency(Number(e.target.value))}
                        className="bg-transparent text-xs font-semibold"
                        min={0}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Nhãn màu nhận diện</label>
                    <div className="flex gap-2">
                      {[
                        { id: "emerald", colorClass: "bg-emerald-500", label: "Emerald" },
                        { id: "blue", colorClass: "bg-blue-500", label: "Blue" },
                        { id: "amber", colorClass: "bg-amber-500", label: "Amber" },
                        { id: "rose", colorClass: "bg-rose-500", label: "Rose" },
                        { id: "violet", colorClass: "bg-violet-500", label: "Violet" },
                      ].map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setSegmentBuilderColor(col.id as any)}
                          title={col.label}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all cursor-pointer",
                            segmentBuilderColor === col.id 
                              ? "border-foreground scale-110 ring-2 ring-primary/20"
                              : "border-transparent opacity-85 hover:opacity-100"
                          )}
                          style={{ backgroundColor: col.id === "violet" ? "#8b5cf6" : col.id === "emerald" ? "#10b981" : col.id === "blue" ? "#3b82f6" : col.id === "amber" ? "#f59e0b" : "#f43f5e" }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full text-xs font-bold py-2.5 bg-[#2f6cf5] text-white rounded-xl hover:bg-[#2f6cf5]/90 transition-all flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Tạo phân khúc mới
                  </button>
                </form>
              </Card>

              {/* Listing of all operational segment cohorts */}
              <Card className="p-6 border border-border/50 bg-sidebar/40 backdrop-blur-md rounded-2xl shadow-md space-y-3">
                <span className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider block">
                  Danh Sách Phân Khúc Đang Hoạt Động
                </span>
                
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {customSegments.map((seg) => {
                    // Count matched in each segment dynamically
                    const count = customers.filter(c => {
                      const spend = c.customFields?.spend || 0;
                      const freq = c.orders?.length || 0;
                      if (seg.id === "seg_at_risk") {
                        return c.activityStatus === "churn_risk" || c.customFields?.risk_score >= 70;
                      }
                      return spend >= seg.minSpend && freq >= seg.minFrequency;
                    }).length;

                    const isSelected = selectedSegmentId === seg.id;
                    const badgeBg = seg.color === "emerald" ? "bg-emerald-500" : seg.color === "blue" ? "bg-blue-500" : seg.color === "amber" ? "bg-amber-500" : seg.color === "rose" ? "bg-rose-500" : "bg-violet-500";

                    return (
                      <div
                        key={seg.id}
                        onClick={() => setSelectedSegmentId(seg.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left",
                          isSelected 
                            ? "bg-[#2f6cf5]/10 border-[#2f6cf5]/30 text-foreground" 
                            : "bg-background/40 hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", badgeBg)} />
                          <div className="overflow-hidden">
                            <p className={cn("text-xs font-black truncate text-foreground", isSelected && "text-[#2f6cf5]")}>{seg.name}</p>
                            {seg.id !== "seg_at_risk" ? (
                              <p className="text-[10px] text-muted-foreground truncate">
                                LTV ≥ {(seg.minSpend / 1000000).toFixed(1)}M VND, ≥ {seg.minFrequency} đơn
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground truncate">KH có cảnh báo rời bỏ / ngủ đông</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="secondary" className="text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                            {count} KH
                          </Badge>
                          {seg.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomSegment(seg.id);
                              }}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                              title="Xóa phân khúc"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* RIGHT SIDE: Cohort summary & matched customer list */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 border border-border/50 bg-background/55 rounded-2xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4 mb-4">
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest block font-sans">Thông tin Cohort đang lựa chọn</span>
                    <h4 className="text-base font-black text-[#2f6cf5] flex items-center gap-1.5 mt-1">
                      {currentSegmentData.name}
                    </h4>
                  </div>

                  <button
                    onClick={handleExportSegmentCSV}
                    disabled={matchedCustomersInSegment.length === 0}
                    className="px-3 py-1.5 text-xs font-black bg-[#2f6cf5]/10 text-[#2f6cf5] hover:bg-[#2f6cf5]/20 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Xuất dữ liệu Cohort
                  </button>
                </div>

                {/* Customer display table */}
                {matchedCustomersInSegment.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
                    <p className="font-extrabold text-foreground">Chưa tìm thấy khách hàng nào thỏa mãn điều kiện.</p>
                    <p>Hãy điều chỉnh lại ngưỡng LTV hoặc Tần Số đơn hàng ở bộ cấu hình bên trái.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-bold uppercase">Hội viên</TableHead>
                          <TableHead className="text-xs font-bold uppercase">LTV (Spend)</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Số Đơn Hàng</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Điểm thưởng</TableHead>
                          <TableHead className="text-xs font-bold uppercase text-right">Chi tiết</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchedCustomersInSegment.map((mem) => {
                          const spend = mem.customFields?.spend || 0;
                          const freq = mem.orders?.length || 0;
                          return (
                            <TableRow key={mem.id} className="group/cohort-row hover:bg-muted/40 transition-colors">
                              <TableCell>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-foreground">{mem.name}</p>
                                  <p className="text-[10.5px] text-muted-foreground/80">{mem.phone || mem.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-extrabold text-foreground">
                                {spend.toLocaleString()} VND
                              </TableCell>
                              <TableCell className="font-extrabold text-muted-foreground">
                                {freq} đơn
                              </TableCell>
                              <TableCell className="font-black text-[#2f6cf5]">
                                {(mem.points || 0).toLocaleString()} pts
                              </TableCell>
                              <TableCell className="text-right">
                                <button
                                  onClick={() => setSelectedCustomer(mem)}
                                  className="p-1 text-[#2f6cf5] hover:bg-primary/10 rounded-lg text-xs font-extrabold"
                                >
                                  Xem thông tin ➜
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </>
      )}

      {showAddDialog && (
        <AddCustomerDialog
          onClose={() => setShowAddDialog(false)}
          attributes={attributes}
        />
      )}

      {showCrmSettings && (
        <CrmSettingsDialog
          onClose={() => setShowCrmSettings(false)}
          attributes={attributes}
        />
      )}

      {showImportDialog && (
        <ImportCustomersDialog
          onClose={() => setShowImportDialog(false)}
          attributes={attributes}
          companies={companies}
          userId={user?.uid || "guest"}
        />
      )}

      <BulkActionDialog
        isOpen={showBulkActionDialog}
        onClose={() => setShowBulkActionDialog(false)}
        selectedCount={selectedCustomerIds.length}
        onConfirm={handleBulkUpdate}
        actionType={bulkActionType}
      />

      <CustomerQrDialog
        customer={selectedQrCustomer}
        onClose={() => setSelectedQrCustomer(null)}
      />

      <CustomerActivityLog
        customer={logCustomer}
        isOpen={showActivityLog}
        onClose={() => {
          setShowActivityLog(false);
          setLogCustomer(null);
        }}
      />

      <BulkEmailDialog
        isOpen={showBulkEmailDialog}
        onClose={() => setShowBulkEmailDialog(false)}
        selectedCount={selectedCustomerIds.length}
        sampleCustomerName={
          sortedAndFilteredCustomers.find((c) =>
            selectedCustomerIds.includes(c.id),
          )?.name
        }
        onSend={async (template) => {
          // In a real app, this would call a backend service to send emails
          await new Promise((resolve) => setTimeout(resolve, 1500));
          toast.success(
            `Đã cá nhân hóa và gửi thành công ${selectedCustomerIds.length} email!`,
          );
        }}
      />
    </div>
  );
}
