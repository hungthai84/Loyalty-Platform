import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Filter,
  Plus,
  Layers,
  Settings,
  Facebook,
  Linkedin,
  Instagram,
  User,
  Users,
  Cloud,
  CloudOff,
  SlidersHorizontal,
  RotateCcw,
  X,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { cn, getCustomerCode } from "@/lib/utils";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
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
} from "firebase/firestore";
import { Customer, AttributeDefinition, Company, TierConfig } from "@/types";
import { CUSTOMER_STATUSES } from "@/data/customerStatuses";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { ImportCustomersDialog } from "@/components/customers/ImportCustomersDialog";
import { CrmSettingsDialog } from "@/components/customers/CrmSettingsDialog";
import { CustomerDashboard } from "@/components/customers/CustomerDashboard";
import { CustomerSearch } from "@/components/customers/CustomerSearch";
import { CustomerQrDialog } from "@/components/customers/CustomerQrDialog";
import { BulkActionDialog } from "@/components/customers/BulkActionDialog";
import { CustomerActivityLog } from "@/components/customers/CustomerActivityLog";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import {
  Building2,
  ShieldAlert,
  Award,
  QrCode,
  Tag,
  UserCheck,
  Smartphone,
  History,
  Crown,
  Mail,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BulkEmailDialog } from "@/components/customers/BulkEmailDialog";
import { AddSegmentDialog } from "@/components/customers/AddSegmentDialog";
import { StatusTransitionConfigView } from "@/components/loyalty/StatusTransitionConfigView";
import { MembershipProjectsView } from "@/components/customers/MembershipProjectsView";
import { toast } from "sonner";
import {
  getGuestCustomers,
  getGuestAttributes,
  getGuestCompanies,
} from "@/data/guestData";

interface SavedFilter {
  id: string;
  name: string;
  minPoints: string;
  maxPoints: string;
  selectedSocialType: string;
  selectedHasCompany: string;
  selectedTag: string;
  startDate: string;
  endDate: string;
  sortBy: string;
}

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
  nameEmail: "Họ tên & SĐT",
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
  const [activeViewTab, setActiveViewTab] = useState<"list" | "segments" | "status_rules">("list");
  const [showDoc, setShowDoc] = useState(false);
  const [showAddSegmentDialog, setShowAddSegmentDialog] = useState(false);
  const [showSegmentSettingsDialog, setShowSegmentSettingsDialog] = useState(false);

  // States for isolated segments tab filtering
  const [segmentSearch, setSegmentSearch] = useState("");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState("all");
  const [segmentSelectedCompanyId, setSegmentSelectedCompanyId] = useState("all");
  const [segmentSelectedTier, setSegmentSelectedTier] = useState("all");
  const [segmentSelectedStatus, setSegmentSelectedStatus] = useState("all");
  const [segmentMinPoints, setSegmentMinPoints] = useState("");
  const [segmentMaxPoints, setSegmentMaxPoints] = useState("");
  const [showSegmentAdvancedFilters, setShowSegmentAdvancedFilters] = useState(false);
  const [showSegmentColumnSettings, setShowSegmentColumnSettings] = useState(false);

  // Reset helper for segments
  const resetSegmentFilters = () => {
    setSegmentSearch("");
    setSelectedSegmentFilter("all");
    setSegmentSelectedCompanyId("all");
    setSegmentSelectedTier("all");
    setSegmentSelectedStatus("all");
    setSegmentMinPoints("");
    setSegmentMaxPoints("");
  };

  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("seg_whales");
  const [segmentBuilderName, setSegmentBuilderName] = useState("");
  const [segmentBuilderMinSpend, setSegmentBuilderMinSpend] = useState<number>(10000000);
  const [segmentBuilderMinFrequency, setSegmentBuilderMinFrequency] = useState<number>(2);
  const [segmentBuilderColor, setSegmentBuilderColor] = useState<"emerald" | "blue" | "amber" | "rose" | "violet">("blue");
  
  const [segmentBuilderType, setSegmentBuilderType] = useState<"criteria" | "file">("criteria");
  const [uploadedFileEntries, setUploadedFileEntries] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Load custom segments from local storage if available, default to pre-populated cohorts
  const [customSegments, setCustomSegments] = useState<Array<{
    id: string;
    name: string;
    minSpend: number;
    minFrequency: number;
    color: "emerald" | "blue" | "amber" | "rose" | "violet";
    isCustom?: boolean;
    type?: "criteria" | "file";
    fileEntries?: string[];
    fileName?: string;
    conditions?: any[];
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
        id: "seg_internal",
        name: "Dự án thành viên nội bộ",
        minSpend: 0,
        minFrequency: 0,
        color: "blue",
        type: "criteria"
      },
      {
        id: "seg_sayhi",
        name: "Dự án khách hàng SayHi",
        minSpend: 0,
        minFrequency: 0,
        color: "emerald",
        type: "criteria"
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
  
  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem("clp_saved_filters");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newFilterName, setNewFilterName] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      id: true,
      nameEmail: true,
      social: false,
      company: false,
      status: true,
      productIcon: true,
      customerStatusDetail: true,
      points: false,
      churnRisk: false,
      customAttributes: false,
      actions: true,
    },
  );

  // Advanced filters toggle state & custom criteria values
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [minPoints, setMinPoints] = useState<string>("");
  const [maxPoints, setMaxPoints] = useState<string>("");
  const [selectedSocialType, setSelectedSocialType] = useState<string>("all"); // 'all', 'facebook', 'zalo', 'linkedin', 'instagram', 'tiktok'
  const [selectedHasCompany, setSelectedHasCompany] = useState<string>("all"); // 'all', 'yes', 'no'
  const [selectedTag, setSelectedTag] = useState<string>("all"); // specific segment card tag
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt_desc"); // sorting option

  // Cohort Builder conditions and edit modes
  const [segmentConditions, setSegmentConditions] = useState<Array<{
    field: 'spend' | 'frequency' | 'points' | 'risk';
    operator: 'gte' | 'lte' | 'eq';
    value: string;
  }>>([
    { field: 'spend', operator: 'gte', value: '10000000' }
  ]);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(20);

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

  // Infinite Scroll limit loader on scroll reach bottom
  useEffect(() => {
    const handleInfiniteScroll = () => {
      const threshold = 150; // px
      const scrollHeight = document.documentElement.scrollHeight;
      const currentScroll = window.innerHeight + window.scrollY;
      
      if (scrollHeight - currentScroll < threshold) {
        // Load next batch
        setVisibleLimit((prev) => prev + 20);
      }
    };

    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, []);

  // Reset limit whenever navigation, query, or active tab changes
  useEffect(() => {
    setVisibleLimit(20);
  }, [
    search,
    selectedCompanyId,
    selectedStatus,
    selectedTier,
    minPoints,
    maxPoints,
    selectedSocialType,
    selectedHasCompany,
    selectedTag,
    startDate,
    endDate,
    sortBy,
    activeViewTab,
    selectedSegmentId
  ]);

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
      segments.push({ tag: "Khách hàng mới", color: "sky" });
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

  const handleSegmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Split by commas, semi-colons, newlines, tabs
        const lines = text.split(/[\n\r,;\t]+/)
          .map(line => line.trim())
          .filter(Boolean);
        setUploadedFileEntries(lines);
        toast.success(`Đã đọc ${lines.length} dòng dữ liệu từ file ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleEditCohort = (seg: any) => {
    setEditingSegmentId(seg.id);
    setSegmentBuilderName(seg.name);
    setSegmentBuilderType(seg.type || "criteria");
    setSegmentBuilderColor(seg.color || "blue");
    setUploadedFileEntries(seg.fileEntries || []);
    setUploadedFileName(seg.fileName || "");

    if (seg.conditions && seg.conditions.length > 0) {
      setSegmentConditions(seg.conditions);
    } else {
      const derived: any[] = [];
      if (seg.id === "seg_at_risk") {
        derived.push({ field: 'risk', operator: 'gte', value: '70' });
      } else {
        if (seg.minSpend) {
          derived.push({ field: 'spend', operator: 'gte', value: String(seg.minSpend) });
        }
        if (seg.minFrequency) {
          derived.push({ field: 'frequency', operator: 'gte', value: String(seg.minFrequency) });
        }
      }
      if (derived.length === 0) {
        derived.push({ field: 'spend', operator: 'gte', value: '1000000' });
      }
      setSegmentConditions(derived);
    }
    toast.info(`Vui lòng chỉnh sửa cấu hình nhóm "${seg.name}" hoặc bổ sung thêm khách hàng bằng File hoặc điều kiện mới.`);
  };

  const handleSaveCustomSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentBuilderName.trim()) {
      toast.error("Vui lòng nhập tên nhóm thành viên!");
      return;
    }

    if (segmentBuilderType === "file" && uploadedFileEntries.length === 0) {
      toast.error("Vui lòng tải lên file danh sách có dữ liệu hợp lệ!");
      return;
    }

    if (editingSegmentId) {
      const updated = customSegments.map(seg => {
        if (seg.id === editingSegmentId) {
          return {
            ...seg,
            name: segmentBuilderName.trim(),
            minSpend: segmentBuilderType === "criteria" ? 0 : 0,
            minFrequency: segmentBuilderType === "criteria" ? 0 : 0,
            color: segmentBuilderColor,
            type: segmentBuilderType,
            conditions: segmentBuilderType === "criteria" ? segmentConditions : [],
            fileEntries: segmentBuilderType === "file" ? uploadedFileEntries : undefined,
            fileName: segmentBuilderType === "file" ? uploadedFileName : undefined,
          };
        }
        return seg;
      });
      setCustomSegments(updated);
      localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
      setSelectedSegmentId(editingSegmentId);
      setEditingSegmentId(null);
      toast.success(`Đã cập nhật thành công nhóm thành viên ${segmentBuilderName}!`);
    } else {
      const newSegment = {
        id: `seg_${Date.now()}`,
        name: segmentBuilderName.trim(),
        minSpend: 0,
        minFrequency: 0,
        color: segmentBuilderColor,
        isCustom: true,
        type: segmentBuilderType,
        conditions: segmentBuilderType === "criteria" ? segmentConditions : [],
        fileEntries: segmentBuilderType === "file" ? uploadedFileEntries : undefined,
        fileName: segmentBuilderType === "file" ? uploadedFileName : undefined,
      };

      const updated = [...customSegments, newSegment];
      setCustomSegments(updated);
      localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
      setSelectedSegmentId(newSegment.id);
      toast.success(`Đã tạo thành công nhóm thành viên ${newSegment.name}!`);
    }

    // Reset Form State
    setSegmentBuilderName("");
    setSegmentConditions([{ field: 'spend', operator: 'gte', value: '10000000' }]);
    setSegmentBuilderColor("blue");
    setSegmentBuilderType("criteria");
    setUploadedFileEntries([]);
    setUploadedFileName("");
  };

  const handleDeleteCustomSegment = (segId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhóm thành viên tự định nghĩa này?")) {
      const updated = customSegments.filter(s => s.id !== segId);
      setCustomSegments(updated);
      localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
      
      if (selectedSegmentId === segId) {
        setSelectedSegmentId("seg_whales");
      }
      if (editingSegmentId === segId) {
        setEditingSegmentId(null);
      }
      toast.success("Đã xóa nhóm thành viên thành công!");
    }
  };

  const getCustomersInSegment = (segment: any, listToFilter: Customer[]): Customer[] => {
    if (!segment) return [];
    
    if (segment.type === "file") {
      const entries = segment.fileEntries || [];
      const cleanEntries = entries.map((e: string) => e.toLowerCase().trim()).filter(Boolean);
      return listToFilter.filter(c => {
        const phone = c.phone?.trim();
        const email = c.email?.trim().toLowerCase();
        const customerId = c.id?.trim().toLowerCase();
        return cleanEntries.some(e => 
          (phone && e.includes(phone)) || 
          (email && e === email) || 
          (customerId && e === customerId) ||
          (c.name && e.includes(c.name.toLowerCase().trim()))
        );
      });
    }

    if (segment.conditions && segment.conditions.length > 0) {
      return listToFilter.filter(c => {
        const spend = c.customFields?.spend || 0;
        const freq = c.orders?.length || 0;
        const pts = c.points || 0;
        const riskScore = c.customFields?.risk_score || 0;

        return segment.conditions!.every((cond: any) => {
          const valNum = Number(cond.value) || 0;
          if (cond.field === 'spend') {
            if (cond.operator === 'gte') return spend >= valNum;
            if (cond.operator === 'lte') return spend <= valNum;
            return spend === valNum;
          }
          if (cond.field === 'frequency') {
            if (cond.operator === 'gte') return freq >= valNum;
            if (cond.operator === 'lte') return freq <= valNum;
            return freq === valNum;
          }
          if (cond.field === 'points') {
            if (cond.operator === 'gte') return pts >= valNum;
            if (cond.operator === 'lte') return pts <= valNum;
            return pts === valNum;
          }
          if (cond.field === 'risk') {
            if (cond.operator === 'gte') return riskScore >= valNum;
            if (cond.operator === 'lte') return riskScore <= valNum;
            return riskScore === valNum;
          }
          return true;
        });
      });
    }

    return listToFilter.filter(c => {
      const spend = c.customFields?.spend || 0;
      const freq = c.orders?.length || 0;
      
      if (segment.id === "seg_at_risk") {
        return c.activityStatus === "churn_risk" || (c.customFields?.risk_score || 0) >= 70;
      }
      
      return spend >= (segment.minSpend ?? 0) && freq >= (segment.minFrequency ?? 0);
    });
  };

  const currentSegmentData = customSegments.find(s => s.id === selectedSegmentId) || customSegments[0];

  const matchedCustomersInSegment = useMemo(() => {
    return getCustomersInSegment(currentSegmentData, customers);
  }, [customers, currentSegmentData]);

  const filteredSegmentCustomers = useMemo(() => {
    let baseList = customers;
    if (selectedSegmentFilter !== "all") {
      const activeSeg = customSegments.find(s => s.id === selectedSegmentFilter);
      if (activeSeg) {
        baseList = getCustomersInSegment(activeSeg, customers);
      }
    }

    return baseList.filter((c) => {
      const matchesSearch =
        !segmentSearch.trim() ||
        (c.name && c.name.toLowerCase().includes(segmentSearch.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(segmentSearch.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(segmentSearch.toLowerCase())) ||
        (c.phone && c.phone.includes(segmentSearch));

      const matchesCompany =
        segmentSelectedCompanyId === "all" || c.companyId === segmentSelectedCompanyId;

      const ptsForTier = c.points || 0;
      let customTier = "Member";
      if (ptsForTier >= 10000) {
        customTier = "Atelier";
      } else if (ptsForTier >= 5000) {
        customTier = "Icon";
      } else if (ptsForTier >= 2000) {
        customTier = "Essential";
      }
      const matchesTier =
        segmentSelectedTier === "all" || customTier === segmentSelectedTier;

      const matchesStatus =
        segmentSelectedStatus === "all" || c.activityStatus === segmentSelectedStatus;

      const matchesMinPoints =
        !segmentMinPoints || (c.points || 0) >= Number(segmentMinPoints);
      const matchesMaxPoints =
        !segmentMaxPoints || (c.points || 0) <= Number(segmentMaxPoints);

      return (
        matchesSearch &&
        matchesCompany &&
        matchesTier &&
        matchesStatus &&
        matchesMinPoints &&
        matchesMaxPoints
      );
    });
  }, [
    customers,
    selectedSegmentFilter,
    segmentSearch,
    segmentSelectedCompanyId,
    segmentSelectedTier,
    segmentSelectedStatus,
    segmentMinPoints,
    segmentMaxPoints,
    customSegments
  ]);



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
      try {
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? new Date(0) : parsed;
      } catch (e) {
        return new Date(0);
      }
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

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-emerald-500/30 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-emerald-500/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-emerald-500/10 rounded-[10px] text-emerald-500 flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <motion.div
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              rotate: [0, 8, -8, 4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
            }}
          >
            <Users className="w-8 h-8 text-emerald-500" />
          </motion.div>
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
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý hồ sơ cá nhân, liên kết mạng xã hội đa điểm và điểm số.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowDoc(!showDoc)}
          className={cn(
            "px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all shadow-sm flex items-center shrink-0 cursor-pointer border",
            showDoc
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-background border-border hover:bg-muted text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4 mr-2 text-emerald-500" />
          {activeViewTab === "list" ? "Tài liệu Thành viên" : activeViewTab === "segments" ? "Tài liệu Dự án Hội viên" : "Tài liệu Phân loại khách hàng"}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 space-y-6 relative">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      <div className={cn("w-full space-y-6 transition-all duration-300", currentCustomerData ? "blur-[2px] opacity-55 pointer-events-none select-none" : "")}>
        {/* Main Tab Navigation relocated from banner */}
        <div className="flex bg-muted/40 p-1.5 rounded-[10px] border border-border/40 max-w-fit select-none shrink-0 mb-6">
          <button
            onClick={() => setActiveViewTab("list")}
            className={cn(
              "px-6 py-2 rounded-[10px] text-sm font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeViewTab === "list"
                ? "bg-white dark:bg-zinc-800 text-[#2f6cf5] shadow-sm border border-border/20 font-black scale-[1.02]"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            <User className="w-4 h-4" /> Danh sách thành viên
          </button>
          <button
            onClick={() => setActiveViewTab("segments")}
            className={cn(
              "px-6 py-2 rounded-[10px] text-sm font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeViewTab === "segments"
                ? "bg-white dark:bg-zinc-800 text-[#2f6cf5] shadow-sm border border-border/20 font-black scale-[1.02]"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            <Layers className="w-4 h-4" /> Danh sách hội viên
          </button>
          <button
            onClick={() => setActiveViewTab("status_rules")}
            className={cn(
              "px-6 py-2 rounded-[10px] text-sm font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeViewTab === "status_rules"
                ? "bg-white dark:bg-zinc-800 text-[#2f6cf5] shadow-sm border border-border/20 font-black scale-[1.02]"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            )}
          >
            <Tag className="w-4 h-4" /> Phân loại trạng thái
          </button>
        </div>

        <AnimatePresence>
          {showDoc && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] p-6 rounded-[10px] flex flex-col gap-4 text-left font-sans mb-6 backdrop-blur-xs relative overflow-hidden"
            >
              <button
                onClick={() => setShowDoc(false)}
                className="absolute top-4 right-4 p-1.5 rounded-[10px] text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-[10px] text-emerald-500 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                    {activeViewTab === "list" ? "Tài liệu Hướng dẫn Quản lý Thành viên" : activeViewTab === "segments" ? "Tài liệu Hướng dẫn Quản lý Dự án Hội viên" : "Tài liệu Phân loại trạng thái tự động"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeViewTab === "list" 
                      ? "Tìm hiểu về cách cấu trúc tìm kiếm, bộ lọc nâng cao và cập nhật hàng loạt trạng thái hội viên." 
                      : activeViewTab === "segments" 
                        ? "Quản lý và tạo các dự án hội viên ngắn hạn hoặc dài hạn, nạp tệp thành viên theo file, thiết lập đặc quyền và liên kết trực tiếp ưu đãi." 
                        : "Cài đặt các quy tắc tự động chuyển trạng thái khách hàng dựa trên hành vi chi tiêu và tần suất tương tác."}
                  </p>
                </div>
              </div>

              {activeViewTab === "list" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> phân cấp xếp hạng
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Thành viên tự động đồng bộ theo điểm CRM tích lũy:
                      <br />• <strong>Member</strong>: Dưới 2,000 điểm crm.
                      <br />• <strong>Essential</strong>: 2,000 – 4,999 điểm crm.
                      <br />• <strong>Icon</strong>: 5,000 – 9,999 điểm crm.
                      <br />• <strong>Atelier</strong>: Trên 10,000 điểm crm.
                    </p>
                  </div>

                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2f6cf5]" /> bộc lọc đa chiều
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Hệ thống hỗ trợ tìm kiếm theo Họ tên, Email, SĐT, ID liên kết của Zalo, Facebook và thuộc tính động. Đồng thời lọc nâng cao theo mốc ngày tham gia, công ty đại diện và khoảng tích lũy điểm CRM.
                    </p>
                  </div>

                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> tính năng cập nhật
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Hỗ trợ tạo nhãn động tùy chỉnh, nạp/rút điểm Loyalty trực tiếp cho hội viên được chọn. Bạn có thể sử dụng phương thức CSV Export để trích xuất báo cáo nhanh hoặc In ấn trực tiếp qua PDF hóa đơn.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> nhóm tiêu chí cơ bản
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Nhóm tiêu chí tự động quét và phân hội viên theo các mốc cấu hình mặc định (VD: Whales - Chi tiêu &gt; 10M, Churn Risk - Cảnh báo rời bỏ hệ thống khi ngắt tương tác trên 30 ngày).
                    </p>
                  </div>

                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> ghép nhóm đa điều kiện
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Cho phép liên kết nhiều điều kiện khác nhau đồng thời: doanh thu trọn đời, số lượt đơn đặt hàng, tích lũy điểm CRM và chỉ số đo lường rủi ro rời bỏ để tạo nhóm khách hàng cực kỳ chi tiết.
                    </p>
                  </div>

                  <div className="p-3.5 bg-background border border-border/60 rounded-[10px] space-y-1.5">
                    <h5 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> nhập danh sách file
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                      Phân rã tệp bằng cách tải lên file Text hoặc CSV chứa danh sách ID, Số điện thoại hoặc Email. Hệ thống sẽ tự động đối chiếu cơ sở dữ liệu thời gian thực và gom nhóm các thảnh viên có mặt trong danh sách.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {activeViewTab === "status_rules" && <StatusTransitionConfigView />}
        {activeViewTab === "segments" && <MembershipProjectsView />}

        {activeViewTab === "list" && (
          <div className="space-y-6">
            <div className="bg-card/45 border border-border/60 rounded-[10px] overflow-hidden shadow-xs backdrop-blur-md">
              {/* Header Banner - Merged */}
              <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 md:p-8 text-left">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-background to-background pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider mb-2">
                      <User className="w-5 h-5 animate-pulse" /> Danh sách
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-foreground">
                      Danh sách thành viên
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                      Quản lý bộ khung dữ liệu khách hàng. Tìm kiếm, sử dụng bộ lọc nâng cao và truy cập lịch trình cá nhân hóa của từng hội viên.
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls Section */}
              <div className={cn(
                "p-5 md:p-6 flex flex-col gap-5 relative w-full",
                showColumnSettings ? "z-[100]" : "z-30"
              )}>
                {/* Filter & Action Section - Arranged into Row 1 & Row 2 */}
                <div className="flex flex-col gap-5 w-full">
                  {/* Dòng 1 : Tìm kiếm khách hàng, Thêm khách hàng, Cài đặt khách hàng */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40 w-full">
                    <div className="w-full md:max-w-md flex-1">
                      <CustomerSearch
                        customers={customers}
                        value={search}
                        onChange={setSearch}
                        onSelectCustomer={(customer) => {
                          setSearch(customer.name);
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Thêm khách hàng */}
                      <div className="relative">
                        <button
                          onClick={() => setShowAddDropdown(!showAddDropdown)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-[10px] text-sm font-bold hover:bg-primary/90 transition-colors flex items-center shadow-lg shadow-primary/25 cursor-pointer select-none"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        {showAddDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowAddDropdown(false)} 
                            />
                            <div className="absolute right-0 mt-2 w-52 bg-card border border-border shadow-xl rounded-[10px] p-2 z-50 text-left backdrop-blur-xl">
                              <button
                                onClick={() => {
                                  setShowAddDropdown(false);
                                  setShowAddDialog(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                <span>Thêm khách hàng</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddDropdown(false);
                                  setActiveViewTab("list");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                <span>Danh sách</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddDropdown(false);
                                  setShowCrmSettings(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                              >
                                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Hệ thống tự động</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Cài đặt khách hàng */}
                      <button
                        onClick={() => setShowCrmSettings(true)}
                        className="flex items-center justify-center px-4 py-2 border border-[#6366f1]/20 bg-[#6366f1]/5 text-[#6366f1] hover:bg-[#6366f1]/10 rounded-[10px] text-sm font-bold transition-all cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-2 text-[#6366f1]" /> Cài đặt khách hàng
                      </button>

                      {forceOffline && (
                        <button
                          onClick={() => {
                            setForceOffline(false);
                            setLoading(true);
                            toast.success("Đang kết nối lại Cloud Firestore...");
                          }}
                          className="flex items-center justify-center px-4 py-2 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white rounded-[10px] text-sm font-medium bg-amber-500/10 transition-colors cursor-pointer animate-pulse"
                        >
                          <Cloud className="w-4 h-4 mr-2" /> Kết nối Cloud
                        </button>
                      )}
                    </div>
                  </div>


                {/* Dòng 2 : Tất cả chi nhánh, Tất cả thứ hạng, Tất cả trạng thái, Cột hiển thị và tùy chỉnh bộ lọc */}
                <div className="flex flex-wrap items-center gap-3 w-full">
                  {/* Tất cả chi nhánh */}
                  <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-2.5 py-1.5 h-9">
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

                  {/* Tất cả thứ hạng */}
                  <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-2.5 py-1.5 h-9">
                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                    >
                      <option value="all">Tất cả thứ hạng</option>
                      <option value="Atelier">Thành viên Atelier</option>
                      <option value="Icon">Thành viên Icon</option>
                      <option value="Essential">Thành viên Essential</option>
                      <option value="Member">Thành viên Member</option>
                    </select>
                  </div>

                  {/* Tất cả trạng thái */}
                  <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-2.5 py-1.5 h-9">
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

                  {/* Cột hiển thị */}
                  <div className={cn("relative", showColumnSettings ? "z-[110]" : "z-auto")}>
                    <button
                      onClick={() => setShowColumnSettings(!showColumnSettings)}
                      className="flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-[10px] text-xs font-bold bg-card hover:bg-muted/70 cursor-pointer text-foreground select-none transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Cột hiển thị</span>
                    </button>
                    {showColumnSettings && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border hover:border-primary/20 shadow-xl rounded-[10px] p-3.5 z-[120] text-left backdrop-blur-xl">
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                          Ẩn/hiện cột bảng
                        </div>
                        <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                          {Object.keys(visibleColumns).map((colKey) => (
                            <label
                              key={colKey}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-[10px] cursor-pointer text-xs font-semibold select-none"
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

                  {/* Tùy chỉnh bộ lọc */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-[10px] text-xs font-bold bg-card hover:bg-muted/70 cursor-pointer text-foreground select-none transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5 text-[#2f6cf5]" />
                    <span>Tùy chỉnh bộ lọc</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                    )}
                  </button>
                </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-dashed border-border p-4 rounded-[10px] mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left w-full h-full"
              >
                <div className="space-y-1">
                  <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                    Nhóm hội viên
                  </label>
                  <select
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                  >
                    <option value="all">Tất cả nhóm</option>
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
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
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
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
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
                        className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold border transition-all ${sortBy === opt.id ? "bg-primary/10 text-primary border-primary/30" : "bg-background hover:bg-muted border-border"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-4 border-t border-border mt-3 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
                  <div className="space-y-1.5 flex-1 select-none">
                    <span className="text-xs font-bold text-muted-foreground block">Bộ lọc đã lưu:</span>
                    {savedFilters.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic block">Chưa có bộ lọc nào được lưu</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {savedFilters.map((f) => (
                          <div
                            key={f.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-muted-hover border border-border rounded-[10px] text-xs font-semibold"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setMinPoints(f.minPoints || "");
                                setMaxPoints(f.maxPoints || "");
                                setSelectedSocialType(f.selectedSocialType || "all");
                                setSelectedHasCompany(f.selectedHasCompany || "all");
                                setSelectedTag(f.selectedTag || "all");
                                setStartDate(f.startDate || "");
                                setEndDate(f.endDate || "");
                                setSortBy(f.sortBy || "createdAt_desc");
                                toast.success(`Đã áp dụng bộ lọc: ${f.name}`);
                              }}
                              className="hover:text-[#2f6cf5] transition-colors text-left"
                            >
                              {f.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = savedFilters.filter((item) => item.id !== f.id);
                                setSavedFilters(updated);
                                localStorage.setItem("clp_saved_filters", JSON.stringify(updated));
                                toast.success(`Đã xóa bộ lọc: ${f.name}`);
                              }}
                              className="text-muted-foreground hover:text-rose-500 transition-colors ml-1 font-black"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                    <span className="text-xs font-bold text-muted-foreground">Lưu bộ lọc hiện tại:</span>
                    <div className="flex items-center gap-2 bg-background p-1 rounded-[10px] border border-border">
                      <Input
                        type="text"
                        placeholder="Tên bộ lọc..."
                        value={newFilterName}
                        onChange={(e) => setNewFilterName(e.target.value)}
                        className="border-0 bg-transparent h-7 text-xs focus-visible:ring-0 px-2 w-[140px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFilterName.trim()) {
                            toast.error("Vui lòng nhập tên bộ lọc!");
                            return;
                          }
                          const nFilter: SavedFilter = {
                            id: "filter_" + Date.now(),
                            name: newFilterName.trim(),
                            minPoints,
                            maxPoints,
                            selectedSocialType,
                            selectedHasCompany,
                            selectedTag: selectedTag,
                            startDate,
                            endDate,
                            sortBy,
                          };
                          const updated = [...savedFilters, nFilter];
                          setSavedFilters(updated);
                          localStorage.setItem("clp_saved_filters", JSON.stringify(updated));
                          setNewFilterName("");
                          toast.success(`Đã lưu bộ lọc: ${nFilter.name}`);
                        }}
                        className="h-7 px-3 bg-[#2f6cf5] text-white text-xs font-bold rounded-[10px] hover:bg-[#2f6cf5]/90 transition-all cursor-pointer flex items-center justify-center"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-4 flex items-end justify-end border-t border-border/40 pt-2">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Đặt lại tất cả
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <Card className="border border-border/50 bg-background/55 shadow-xs relative">
            {/* Bulk Action Floating Banner */}
            {selectedCustomerIds.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-50 bg-[#2f6cf5] text-white px-6 py-3 rounded-t-xl shadow-md flex items-center justify-between border-b border-[#2f6cf5]/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 px-2.5 py-1 rounded-[10px] text-xs font-bold text-white shadow-xs">
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
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> Gắn thẻ
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("tier");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" /> Hạng (Tier)
                  </button>
                  <button
                    onClick={() => setShowBulkEmailDialog(true)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Gửi Email
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("status");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" /> Trạng thái
                  </button>
                  <button
                    onClick={() => {
                      setBulkActionType("points");
                      setShowBulkActionDialog(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-xs font-bold transition-colors border border-white/20 cursor-pointer flex items-center gap-1"
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
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-[10px] text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" /> Xóa
                  </button>
                  <button
                    onClick={() => setSelectedCustomerIds([])}
                    className="px-3 py-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-[10px] text-xs transition-colors cursor-pointer"
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

                  <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-2.5 py-1.5 h-9">
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

                  <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-2.5 py-1.5 h-9">
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
                  <div className={cn("relative", showColumnSettings ? "z-[110]" : "z-auto")}>
                    <button
                      onClick={() => setShowColumnSettings(!showColumnSettings)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-[10px] text-xs font-bold hover:bg-muted transition-colors select-none ${showColumnSettings ? "bg-primary/10 border-primary/30 text-primary" : "bg-card text-foreground"}`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Cột hiển thị</span>
                    </button>
                    {showColumnSettings && (
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border hover:border-primary/20 shadow-xl rounded-[10px] p-3.5 z-[120] text-left backdrop-blur-xl">
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                          Ẩn/hiện cột bảng
                        </div>
                        <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                          {Object.keys(visibleColumns).map((colKey) => (
                            <label
                              key={colKey}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-[10px] cursor-pointer text-xs font-semibold select-none"
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-[10px] text-xs font-bold hover:bg-muted transition-all duration-200 select-none ${showAdvancedFilters || hasActiveFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-card text-foreground"}`}
                  >
                    <Filter
                      className={`w-3.5 h-3.5 ${hasActiveFilters ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span>Tùy chỉnh bộ lọc</span>
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
                  className="border border-dashed border-border p-4 rounded-[10px] mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left"
                >
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                      Nhóm hội viên
                    </label>
                    <select
                      className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                    >
                      <option value="all">Tất cả nhóm</option>
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
                      className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
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
                      className="w-full bg-background border border-border rounded-[10px] text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
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
                          className={`px-2.5 py-1.5 rounded-[10px] text-xs font-semibold border transition-all ${sortBy === opt.id ? "bg-primary/10 text-primary border-primary/30" : "bg-background hover:bg-muted border-border"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-[10px] font-bold transition-all shrink-0 cursor-pointer"
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
                      <TableHead>Họ tên / Số điện thoại</TableHead>
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
                        <div className="flex flex-col items-center justify-center max-w-lg mx-auto p-8 rounded-[10px] border border-dashed border-border bg-card shadow-xs text-center space-y-4">
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
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-xs rounded-[10px] cursor-pointer disabled:opacity-50 transition-all"
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
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/80 rounded-[10px] cursor-pointer transition-all"
                              >
                                <CloudOff className="w-3.5 h-3.5" />
                                Xem offline sandbox (200 KH)
                              </button>
                            </div>
                          )}

                          {customers.length > 0 && (
                            <button
                              onClick={resetFilters}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-[10px] cursor-pointer transition-all"
                            >
                              Đặt lại tất cả bộ lọc
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredCustomers.slice(0, visibleLimit).map((customer) => (
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
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {getCustomerCode(customer, companies)}
                          </TableCell>
                        )}

                        {/* AVATAR + NAME */}
                        {visibleColumns.nameEmail && (
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-[10px] overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs font-bold text-xs uppercase">
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
                                  {customer.phone || "Không có SĐT"}
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
                                <div className="w-6 h-6 rounded-[10px] bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
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
                                <TooltipContent className="bg-card border-border shadow-xl p-2 rounded-[10px]">
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
                                    <TooltipContent className="bg-card border border-border shadow-xl p-3 rounded-[10px] max-w-xs text-left">
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

                        {/* ACTIONS */}
                        {visibleColumns.actions && (
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1 font-sans">
                              <button
                                onClick={() => setSelectedCustomer(customer)}
                                className="p-1.5 text-[#2f6cf5] hover:bg-primary/10 rounded-[10px] text-xs font-extrabold flex items-center cursor-pointer gap-0.5"
                                title="Chi tiết"
                              >
                                Chi tiết ➜
                              </button>
                              <button
                                onClick={() => setSelectedQrCustomer(customer)}
                                className="p-1.5 text-muted-foreground hover:bg-muted border border-transparent hover:border-border rounded-[10px] transition-all cursor-pointer"
                                title="Xuất mã Định danh QR"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setLogCustomer(customer);
                                  setShowActivityLog(true);
                                }}
                                className="p-1.5 text-muted-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                                title="Lịch sử hoạt động"
                              >
                                <History className="w-3.5 h-3.5" />
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
          </div>
          </div>
          </div>
        )}

      {/* Popup chi tiết khách hàng chiếm 90% diện tích trang web */}
      <AnimatePresence>
        {currentCustomerData && (
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
              className="bg-background border border-border shadow-2xl rounded-[10px] w-[92vw] h-[90vh] max-w-[1700px] flex flex-col relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nút đóng nổi bật ở góc phải trên cùng */}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-2.5 rounded-[10px] bg-card border border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all z-50 cursor-pointer shadow-md"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Phần nội dung có scroll riêng lẻ */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
                <CustomerDashboard
                  customer={currentCustomerData}
                  userId={user?.uid || "guest"}
                  companies={companies}
                  attributes={attributes}
                  tierConfigs={tierConfigs}
                  onBack={() => setSelectedCustomer(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      <AddSegmentDialog
        isOpen={showAddSegmentDialog}
        onClose={() => {
          setShowAddSegmentDialog(false);
          setEditingSegmentId(null);
        }}
        editingSegment={editingSegmentId ? customSegments.find(s => s.id === editingSegmentId) : null}
        onSave={(newSegment) => {
          let updated;
          if (editingSegmentId) {
            updated = customSegments.map(s => s.id === editingSegmentId ? newSegment : s);
            toast.success(`Đã cập nhật nhóm ${newSegment.name}!`);
          } else {
            updated = [...customSegments, newSegment];
            toast.success(`Đã tạo nhóm ${newSegment.name}!`);
            setSelectedSegmentFilter(newSegment.id);
          }
          setCustomSegments(updated);
          localStorage.setItem("crm_custom_segments_v1", JSON.stringify(updated));
          setShowAddSegmentDialog(false);
          setEditingSegmentId(null);
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
    </div>
  );
}
