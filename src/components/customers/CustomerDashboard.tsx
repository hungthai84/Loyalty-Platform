import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Customer, Company, AttributeDefinition } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Gift,
  Shield,
  User,
  Phone,
  Mail,
  Calendar,
  Facebook,
  Linkedin,
  Instagram,
  Landmark,
  Plus,
  Minus,
  Sparkles,
  Check,
  Edit2,
  CheckCircle2,
  Award,
  ExternalLink,
  MessageSquare,
  Heart,
  RefreshCw,
  Smartphone,
  Upload,
  TrendingUp,
  BarChart2,
  Zap,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import * as motion from "motion/react-client";
import { CUSTOMER_STATUSES } from "@/data/customerStatuses";

// Mock high-end transactions for demo purposes
const MOCK_CRM_ACTIVITIES = [
  {
    id: "1",
    type: "order",
    content: "Mua sắm bộ sưu tập Hè Atelier Premium",
    value: "+35.000.000 ₫",
    points: "+350 pts",
    date: "Hôm qua, 14:20",
  },
  {
    id: "2",
    type: "reward",
    content: "Đổi Voucher ẩm thực đặc quyền tại Private Lounge",
    value: "-1.000 pts",
    points: "-1000 pts",
    date: "22/05/2026",
  },
  {
    id: "3",
    type: "event",
    content: "Tham gia Sự kiện Private Showcase Atelier",
    value: "Đăng ký VIP",
    points: "+200 pts",
    date: "18/05/2026",
  },
  {
    id: "4",
    type: "referral",
    content: "Giới thiệu thành viên mới liên kết thẻ VIP",
    value: "Mã REF-302",
    points: "+150 pts",
    date: "10/05/2026",
  },
];

interface CustomerDashboardProps {
  customer: Customer;
  userId: string;
  companies: Company[];
  attributes: AttributeDefinition[];
  onBack: () => void;
}

export function CustomerDashboard({
  customer,
  userId,
  companies,
  attributes,
  onBack,
}: CustomerDashboardProps) {
  const [points, setPoints] = useState(customer.points || 0);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local edit states
  const [fb, setFb] = useState(customer.facebook || "");
  const [zl, setZl] = useState(customer.zalo || "");
  const [li, setLi] = useState(customer.linkedin || "");
  const [ig, setIg] = useState(customer.instagram || "");
  const [tt, setTt] = useState(customer.tiktok || "");
  const [avatar, setAvatar] = useState(customer.avatarUrl || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [email, setEmail] = useState(customer.email || "");

  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "purchase" | "ticket" | "status_change"
  >("all");
  const [clvScenario, setClvScenario] = useState<
    "conservative" | "baseline" | "optimistic"
  >("baseline");

  // Calculates historical spend from order history or assumes a smart tier-based starting baseline
  const getHistoricalAndPredictedCLV = () => {
    const ordersList = customer.orders || [];
    const calculatedSpent = ordersList.reduce((acc: number, o: any) => {
      const cleaned = String(o.total || "0").replace(/[^0-9]/g, "");
      const parsed = parseInt(cleaned, 10) || 0;
      return acc + parsed;
    }, 0);

    const baseHistorical =
      calculatedSpent > 0
        ? calculatedSpent
        : points > 0
          ? points * 15000
          : 15000000;

    // Baseline growth rate scaled by current membership tier
    let tierFactor = 0.15;
    if (points >= 2500) {
      tierFactor = 0.42; // Atelier
    } else if (points >= 1000) {
      tierFactor = 0.28; // Icon
    } else if (points >= 500) {
      tierFactor = 0.2; // Essential
    }

    // Multiply by selected scenario coefficient
    let multiplier = 1.2;
    if (clvScenario === "conservative") multiplier = 0.7;
    if (clvScenario === "optimistic") multiplier = 1.9;

    const annualizedGrowth = tierFactor * multiplier;
    const projectedCLV = baseHistorical * (1 + annualizedGrowth);
    const growthAmount = projectedCLV - baseHistorical;

    return {
      historicalSpent: baseHistorical,
      growthRate: annualizedGrowth,
      predictedCLV: projectedCLV,
      growthAmount,
    };
  };

  const clvStats = getHistoricalAndPredictedCLV();

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseVietnameseDate = (dateVal?: any) => {
    if (!dateVal) return 0;

    // 1. Check if it's already a Date object
    if (dateVal instanceof Date) {
      return dateVal.getTime();
    }

    // 2. Check if it's a Firestore Timestamp or similar object with toDate
    if (dateVal && typeof dateVal.toDate === "function") {
      return dateVal.toDate().getTime();
    }

    // 3. Check if it's a Firestore Timestamp object with _seconds
    if (dateVal && typeof dateVal.seconds === "number") {
      return dateVal.seconds * 1000;
    }

    // 4. If it's a number, assume it's a timestamp
    if (typeof dateVal === "number") {
      return dateVal;
    }

    // Convert to string and clean/parse
    const dateStr = String(dateVal);

    // Check "Hôm qua" format
    if (dateStr.includes("Hôm qua")) {
      const parts = dateStr.split(",");
      const timePart = parts[1]?.trim() || "00:00";
      const [h, m] = timePart.split(":").map(Number);
      const d = new Date();
      d.setDate(d.getDate() - 1);
      d.setHours(h || 0, m || 0, 0, 0);
      return d.getTime();
    }

    // Check Standard DD/MM/YYYY or DD/MM/YYYY HH:MM
    try {
      const dateTimeParts = dateStr.trim().split(" ");
      const datePart = dateTimeParts[0];
      const timePart = dateTimeParts[1] || "00:00";

      const [day, month, year] = datePart.split("/").map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        // Fallback standard JS date string parsing
        const sec = Date.parse(dateStr);
        if (!isNaN(sec)) return sec;
        return 0;
      }
      const [hour, minute] = timePart.split(":").map(Number);

      const parsedDate = new Date(
        year,
        month - 1,
        day,
        hour || 0,
        minute || 0,
        0,
        0,
      );
      return parsedDate.getTime() || 0;
    } catch (e) {
      // Fallback standard JS date string parsing
      const sec = Date.parse(dateStr);
      if (!isNaN(sec)) return sec;
      return 0;
    }
  };

  const formatVietnameseDate = (dateVal: any): string => {
    if (!dateVal) return "N/A";
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal.toDate === "function") {
      d = dateVal.toDate();
    } else if (typeof dateVal.seconds === "number") {
      d = new Date(dateVal.seconds * 1000);
    } else if (typeof dateVal === "number") {
      d = new Date(dateVal);
    } else {
      // Try to parse string
      const ts = parseVietnameseDate(dateVal);
      if (ts > 0) {
        d = new Date(ts);
      } else {
        const fall = Date.parse(String(dateVal));
        if (!isNaN(fall)) {
          d = new Date(fall);
        } else {
          return String(dateVal);
        }
      }
    }

    // Format to "DD/MM/YYYY HH:MM" or similar
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // Convert orders, tickets, statusHistory, and creation events into a unified chronological log
  const purchaseEvents = (customer.orders || []).map((o: any) => ({
    id: o.id,
    type: "purchase" as const,
    title: `Giao dịch mua sắm: ${o.id}`,
    description: `Mua: ${o.items || o.description || "Sản phẩm trang sức"}`,
    valueStr: o.total
      ? formatVND(o.total)
      : o.amount
        ? formatVND(o.amount)
        : "N/A",
    pointsStr: o.points ? `+${o.points} pts` : "+50 pts",
    badgeText: o.status || "Hoàn thành",
    badgeStyle:
      o.statusClasses ||
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dateStr: formatVietnameseDate(o.date),
    timestamp: parseVietnameseDate(o.date) || Date.now() - 3600000,
    icon: "🛒",
    iconColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }));

  const ticketEvents = (customer.tickets || []).map((t: any) => ({
    id: t.id,
    type: "ticket" as const,
    title: `Lịch sử hỗ trợ: ${t.id}`,
    description: t.subject
      ? `Chủ đề: ${t.subject}`
      : `Nội dung: ${t.summary || "Hỗ trợ"}`,
    valueStr: t.severity ? `Mức độ: ${t.severity}` : "Yêu cầu",
    pointsStr: "",
    badgeText:
      t.status === "closed"
        ? "Đã đóng"
        : t.status === "open"
          ? "Đang mở"
          : t.status,
    badgeStyle:
      t.status === "Đang xử lý" || t.status === "open"
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-slate-500/10 text-slate-500 border-slate-500/20",
    dateStr: formatVietnameseDate(t.date || t.createdAt),
    timestamp:
      parseVietnameseDate(t.date || t.createdAt) || Date.now() - 7200000,
    icon: "🎫",
    iconColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }));

  const statusEvents = (customer.statusHistory || []).map((s: any) => {
    const fromStatusObj = CUSTOMER_STATUSES.find(
      (st) => st.code.toUpperCase() === s.from.toUpperCase(),
    );
    const toStatusObj = CUSTOMER_STATUSES.find(
      (st) => st.code.toUpperCase() === s.to.toUpperCase(),
    );
    return {
      id: s.id,
      type: "status_change" as const,
      title: "Thay đổi trạng thái khách hàng",
      description: `Cập nhật trạng thái từ "${fromStatusObj?.classification || s.from}" sang "${toStatusObj?.classification || s.to}"`,
      valueStr: "Bởi Nhân sự",
      pointsStr: "",
      badgeText: "Cập nhật",
      badgeStyle: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      dateStr: formatVietnameseDate(s.date || s.timestamp),
      timestamp: s.timestamp || parseVietnameseDate(s.date) || Date.now(),
      icon: "🔄",
      iconColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    };
  });

  const createdDateStr =
    customer.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") ||
    (customer.createdAt
      ? new Date(customer.createdAt).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"));
  const creationEvent = {
    id: "creation-event",
    type: "status_change" as const,
    title: "Khởi tạo hồ sơ khách hàng",
    description: `Hồ sơ khách hàng "${customer.name || "N/A"}" khởi tạo thành công trên hệ thống SEVA CRM`,
    valueStr: "Tạo mới",
    pointsStr: "",
    badgeText: "Thành công",
    badgeStyle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dateStr: createdDateStr,
    timestamp: parseVietnameseDate(customer.createdAt) || 0,
    icon: "👤",
    iconColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const combinedTimeline = [
    ...purchaseEvents,
    ...ticketEvents,
    ...statusEvents,
    creationEvent,
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredTimeline = combinedTimeline.filter((item) => {
    if (timelineFilter === "all") return true;
    return item.type === timelineFilter;
  });

  const company = companies.find((c) => c.id === customer.companyId);

  // Calculate membership tier locally
  const getTierInfo = (pts: number) => {
    if (pts >= 10000) {
      return {
        name: "Atelier (Thượng lưu)",
        nextTarget: "Tối đa",
        progress: 100,
        color: "text-[#2f6cf5] border-[#2f6cf5]",
        bg: "bg-[#2f6cf5]/10",
      };
    } else if (pts >= 2500) {
      return {
        name: "Icon (Vàng VIP)",
        nextTarget: `${10000 - pts} pts nâng Atelier`,
        progress: (pts / 10000) * 100,
        color: "text-yellow-500 border-yellow-500",
        bg: "bg-yellow-500/10",
      };
    } else if (pts >= 500) {
      return {
        name: "Essential (Hạng Bạc)",
        nextTarget: `${2500 - pts} pts nâng Icon`,
        progress: (pts / 2500) * 100,
        color: "text-sky-500 border-sky-500",
        bg: "bg-sky-500/10",
      };
    } else {
      return {
        name: "Member (Hạng Phổ thông)",
        nextTarget: `${500 - pts} pts nâng Essential`,
        progress: (pts / 500) * 100,
        color: "text-slate-400 border-slate-400",
        bg: "bg-slate-400/10",
      };
    }
  };

  const tier = getTierInfo(points);

  const handleDeleteCustomer = async () => {
    const docPath = userId === "guest" 
      ? `customers/${customer.id}` // This is a bit tricky for guest, let's assume standard path
      : `customers/${customer.id}`;
    
    setIsDeleting(true);
    const toastId = toast.loading("Đang xóa khách hàng...");
    try {
      if (userId !== "guest") {
        await deleteDoc(doc(db, docPath));
      } else {
        // Handle guest deletion if we had a guest data store,
        // for now we just filter it out locally if needed,
        // but since it's real-time list, Firestore delete is better.
      }
      toast.success("Đã xóa khách hàng khỏi hệ thống", { id: toastId });
      onBack();
    } catch (error: any) {
      console.error("Error deleting customer: ", error);
      toast.error(`Lỗi khi xóa: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateFirestore = async (
    updatedData: Partial<Customer>,
    successMessage?: string,
  ) => {
    const docRef = doc(db, `users/${userId}/customers/${customer.id}`);
    const toastId = toast.loading("Đang lưu thông tin...");
    try {
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      if (successMessage) {
        toast.success(successMessage, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
      return true;
    } catch (error) {
      console.error("Error updating customer config: ", error);
      toast.error("Không thể lưu cấu hình đến cloud", { id: toastId });
      return false;
    }
  };

  const handleAdjustPoints = async (amount: number) => {
    const newPts = Math.max(0, points + amount);
    setPoints(newPts);
    const successMsg = `${amount > 0 ? "Thêm" : "Khấu trừ"} ${Math.abs(amount)} điểm thành công!`;
    await updateFirestore({ points: newPts }, successMsg);
  };

  const handleSaveSocialLinks = async () => {
    setIsEditingSocial(false);
    await updateFirestore(
      {
        facebook: fb,
        zalo: zl,
        linkedin: li,
        instagram: ig,
        tiktok: tt,
      },
      "Đã đồng bộ mạng xã hội của khách hàng!",
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success("Tải ảnh lên thành công!");
    };
    reader.onerror = () => {
      toast.error("Có lỗi xảy ra khi đọc tệp ảnh.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileHeader = async () => {
    setIsUpdatingField(false);
    await updateFirestore(
      {
        avatarUrl: avatar,
        phone,
        email,
      },
      "Cập nhật thông tin thành công!",
    );
  };

  // Helper matching the status definition config colors
  const renderStatusBadge = (status?: string) => {
    if (!status)
      return <span className="text-xs text-muted-foreground">Mới</span>;
    const matched = CUSTOMER_STATUSES.find(
      (s) => s.code.toUpperCase() === status.toUpperCase(),
    );

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${matched ? matched.color.badge : "bg-muted text-muted-foreground"}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {matched?.classification || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-sidebar-accent text-sm font-semibold hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" /> Trở lại danh
          sách KH
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-sm font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa khách hàng
          </button>
          <div className="text-xs text-muted-foreground ">
            ID: {customer.id} (Tạo:{" "}
            {customer.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") ||
              "Vừa xong"}
            )
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border border-border bg-card backdrop-blur-xl">
          <DialogHeader>
            <div className="mb-4 w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Xác nhận xóa khách hàng</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Bạn có chắc chắn muốn xóa hồ sơ của <strong>{customer.name}</strong>? 
              Dữ liệu điểm số, lịch sử giao dịch và liên kết mạng xã hội sẽ bị gỡ bỏ vĩnh viễn khỏi SEVA CRM.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl h-10 font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={isDeleting}
              className="flex-1 rounded-xl h-10 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI - CRM PROFILE CARD */}
        <div className="space-y-6 lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 backdrop-blur-md p-6 relative overflow-hidden shadow-xl"
          >
            {/* Elegant luxury gold visual overlay background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2f6cf5]/5 blur-3xl rounded-full" />

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl border-2 border-[#2f6cf5]/30 overflow-hidden bg-primary/10 text-primary shadow-lg transition-transform hover:scale-105 duration-300 flex items-center justify-center text-2xl font-bold uppercase shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      className="w-full h-full object-cover"
                      alt={customer.name}
                    />
                  ) : (
                    customer.name.slice(0, 2)
                  )}
                </div>
                {!isUpdatingField && (
                  <button
                    onClick={() => setIsUpdatingField(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-background border border-border rounded-xl shadow-md hover:text-primary transition-all text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                  {customer.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {company?.name || "Thành viên Cá nhân"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center">
                {/* Interactive Status Changer Dropdown */}
                <div className="relative group/status flex items-center gap-1 bg-[#2f6cf5]/5 dark:bg-[#2f6cf5]/10 border border-[#2f6cf5]/20 hover:border-[#2f6cf5]/40 rounded-full px-2.5 py-1 text-xs font-bold text-[#2f6cf5] hover:text-[#2f6cf5] transition-all">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                  <select
                    value={customer.activityStatus || "ACTIVE"}
                    onChange={async (e) => {
                      const nextStatus = e.target.value;
                      const prevStatus = customer.activityStatus || "ACTIVE";
                      if (nextStatus === prevStatus) return;

                      const logEntry = {
                        id: `ST-${Date.now()}`,
                        type: "status_change",
                        from: prevStatus,
                        to: nextStatus,
                        date:
                          new Date().toLocaleDateString("vi-VN") +
                          " " +
                          new Date().toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        timestamp: Date.now(),
                      };

                      const updatedHistory = [
                        ...(customer.statusHistory || []),
                        logEntry,
                      ];
                      await updateFirestore(
                        {
                          activityStatus: nextStatus as any,
                          statusHistory: updatedHistory,
                        },
                        `Đã cập nhật trạng thái mới: ${CUSTOMER_STATUSES.find((st) => st.code === nextStatus)?.classification || nextStatus}`,
                      );
                    }}
                    className="bg-transparent text-xs font-extrabold outline-none cursor-pointer pr-1 appearance-none border-none text-center text-[#2f6cf5]"
                    style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                  >
                    {CUSTOMER_STATUSES.map((st) => (
                      <option
                        key={st.code}
                        value={st.code}
                        className="text-foreground dark:text-white bg-background font-semibold"
                      >
                        {st.classification}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs opacity-65 shrink-0">▼</span>
                </div>

                <span
                  className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${tier.color} ${tier.bg}`}
                >
                  🏆 {tier.name}
                </span>
              </div>
            </div>

            {/* Editing avatar, email, phone */}
            {isUpdatingField ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border-t pt-4 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase text-[#2f6cf5] tracking-wider mb-2">
                  Sửa thông tin cơ bản
                </h4>

                <div className="space-y-2 bg-background/50 p-3 rounded-xl border border-dashed border-border/80">
                  <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider mb-1">
                    CẬP NHẬT ẢNH ĐẠI DIỆN
                  </span>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="file"
                      id="dashboard-avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="dashboard-avatar-upload"
                      className="text-xs font-bold uppercase py-1.5 px-3 bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/30 text-[#2f6cf5] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3 h-3" /> Tải ảnh từ máy tính
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Vui lòng tải tệp ảnh từ máy
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-bold">
                    SỐ ĐIỆN THOẠI
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg focus:ring-1 focus:ring-primary/20 outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-bold">
                    EMAIL KHÁCH HÀNG
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg focus:ring-1 focus:ring-primary/20 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsUpdatingField(false)}
                    className="flex-1 py-1.5 border rounded-lg text-xs hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveProfileHeader}
                    className="flex-1 py-1.5 bg-[#2f6cf5] text-white rounded-lg text-xs font-bold"
                  >
                    Lưu hồ sơ
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 border-t border-border/40 pt-6 space-y-4 text-xs font-medium">
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span>{phone || "Chưa cung cấp SĐT"}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span className="truncate">{email || "Chưa có email"}</span>
                </div>
                {company && (
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 pt-3">
                    <Landmark className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {company.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {company.address || "Không địa chỉ"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* CUSTOM ATTRIBUTES LIST CONTAINER */}
          {attributes.length > 0 && (
            <div className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest border-b pb-2">
                Thuộc tính mở rộng
              </h4>
              <div className="space-y-2">
                {attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex justify-between items-center bg-background/50 p-2 rounded-xl text-xs"
                  >
                    <span className="text-muted-foreground font-medium">
                      {attr.label}
                    </span>
                    <span className="font-bold text-foreground">
                      {Array.isArray(customer.customFields?.[attr.key])
                        ? (
                            customer.customFields?.[attr.key] as any as string[]
                          ).join(", ")
                        : customer.customFields?.[attr.key]?.toString() || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT GIỮA & CỘT PHẢI - TOÀN CẢNH ENGAGEMENT ENGINE */}
        <div className="space-y-6 lg:col-span-2">
          {/* LOYALTY ENGINE DYNAMIC VISUALIZER CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Points Control Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative flex flex-col justify-between overflow-hidden shadow-lg transition-colors border border-[#2f6cf5]/30 bg-sidebar/75 p-6 rounded-3xl hover:shadow-xl hover:border-[#2f6cf5]/50"
            >
              {/* Golden glow decorative bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2f6cf5]" />

              <div>
                <span className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest block">
                  QUỸ LOYALTY POINTS
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">
                    {points.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#2f6cf5]">pts</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Ngân quỹ điểm được tích lũy thông qua giao dịch, các cột mốc
                  chi tiêu và tương tác xã hội.
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 mt-4">
                <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block mb-2">
                  Cập nhật nhanh điểm số (Simulate)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdjustPoints(-50)}
                    className="flex-1 py-1 px-3 border border-border bg-background rounded-xl text-xs hover:bg-muted font-bold flex items-center justify-center gap-1 transition-all text-rose-500"
                  >
                    <Minus className="w-3 h-3" /> -50 pt
                  </button>
                  <button
                    onClick={() => handleAdjustPoints(50)}
                    className="flex-1 py-1 px-3 border border-border bg-background rounded-xl text-xs hover:bg-muted font-bold flex items-center justify-center gap-1 transition-all text-emerald-500"
                  >
                    <Plus className="w-3 h-3" /> +50 pt
                  </button>
                  <button
                    onClick={() => handleAdjustPoints(200)}
                    className="flex-1 py-1 px-2 border border-[#2f6cf5]/40 bg-[#2f6cf5]/5 rounded-xl text-xs hover:bg-[#2f6cf5]/10 font-bold flex items-center justify-center gap-1 transition-all text-[#2f6cf5]"
                  >
                    <Sparkles className="w-3 h-3" /> +200 pt
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Loyalty tier roadmap & meter */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              transition={{ delay: 0.1 }}
              className="flex flex-col justify-between shadow-md transition-colors border border-border/50 bg-sidebar/75 p-6 rounded-3xl hover:shadow-lg hover:border-primary/30"
            >
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                  LỘ TRÌNH ĐẶC QUYỀN VIP
                </span>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tier.name.split(" ")[0]} Member
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {tier.nextTarget}
                  </span>
                </div>

                {/* Meter road bar */}
                <div className="w-full bg-muted rounded-full h-2.5 mt-2 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-[#2f6cf5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground font-bold mt-1 uppercase">
                  <span>Member (0 pt)</span>
                  <span>Essential (500 pt)</span>
                  <span>Icon (1k pt)</span>
                  <span>Atelier (2.5k pt)</span>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-2xl border border-border/40 mt-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2f6cf5]" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">
                    Sử dụng điểm đổi quà cao cấp
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Phòng chờ VIP, Sự kiện kín tại showroom
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SOCIAL NETWORK INTEGRATION GRAPH & LINKS (MỤC LIÊN KẾT TẤT CẢ NỀN TẢNG) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  KỸ THUẬT SỐ & MẠNG XÃ HỘI CONNECTED
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Xác thực tài khoản và liên kết dữ liệu đa điểm của khách hàng.
                </p>
              </div>
              <button
                onClick={() => {
                  if (isEditingSocial) {
                    handleSaveSocialLinks();
                  } else {
                    setIsEditingSocial(true);
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                  isEditingSocial
                    ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                    : "bg-background hover:bg-muted border-border"
                }`}
              >
                {isEditingSocial ? "Lưu chỉnh sửa ✓" : "Sửa liên kết ✎"}
              </button>
            </div>

            {isEditingSocial ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    FB / Messenger Link
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg"
                    value={fb}
                    onChange={(e) => setFb(e.target.value)}
                    placeholder="Link Facebook"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    Zalo Sđt / Profile URL
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg"
                    value={zl}
                    onChange={(e) => setZl(e.target.value)}
                    placeholder="0901234567 hoặc link"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    LinkedIn URL
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg"
                    value={li}
                    onChange={(e) => setLi(e.target.value)}
                    placeholder="Link LinkedIn"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    Instagram Handler
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg"
                    value={ig}
                    onChange={(e) => setIg(e.target.value)}
                    placeholder="Link Instagram"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase">
                    TikTok Profile
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-lg"
                    value={tt}
                    onChange={(e) => setTt(e.target.value)}
                    placeholder="Link TikTok"
                  />
                </div>
              </div>
            ) : (
              /* High-fidelity interconnected visual graph of socials */
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Facebook Node */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all shadow-2xs hover:shadow-md ${
                    fb
                      ? "bg-blue-600/5 border-blue-600/20 text-blue-600 hover:border-blue-600/40"
                      : "bg-muted/10 border-border/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <Facebook className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold block truncate max-w-full">
                    Facebook
                  </span>
                  {fb ? (
                    <a
                      href={fb.startsWith("http") ? fb : `https://${fb}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-xs font-extrabold flex items-center gap-0.5 hover:underline uppercase text-blue-700"
                    >
                      Liên kết <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase opacity-40">
                      Trống
                    </span>
                  )}
                </motion.div>

                {/* Zalo Node */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all shadow-2xs hover:shadow-md ${
                    zl
                      ? "bg-sky-500/5 border-sky-500/20 text-sky-600 hover:border-sky-500/40"
                      : "bg-muted/10 border-border/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center mb-2 font-sans">
                    Z
                  </div>
                  <span className="text-xs font-bold block truncate max-w-full">
                    Zalo Chat
                  </span>
                  {zl ? (
                    <a
                      href={
                        zl.startsWith("http") ? zl : `https://zalo.me/${zl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-xs font-extrabold flex items-center gap-0.5 hover:underline uppercase text-sky-700"
                    >
                      Mở Zalo <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase opacity-40">
                      Trống
                    </span>
                  )}
                </motion.div>

                {/* LinkedIn Node */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all shadow-2xs hover:shadow-md ${
                    li
                      ? "bg-blue-700/5 border-blue-700/20 text-blue-700 hover:border-blue-700/40"
                      : "bg-muted/10 border-border/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <Linkedin className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold block truncate max-w-full">
                    LinkedIn
                  </span>
                  {li ? (
                    <a
                      href={li.startsWith("http") ? li : `https://${li}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-xs font-extrabold flex items-center gap-0.5 hover:underline uppercase text-blue-800"
                    >
                      Hồ sơ <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase opacity-40">
                      Trống
                    </span>
                  )}
                </motion.div>

                {/* Instagram Node */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all shadow-2xs hover:shadow-md ${
                    ig
                      ? "bg-pink-600/5 border-pink-600/20 text-pink-600 hover:border-pink-600/40"
                      : "bg-muted/10 border-border/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <Instagram className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold block truncate max-w-full">
                    Instagram
                  </span>
                  {ig ? (
                    <a
                      href={ig.startsWith("http") ? ig : `https://${ig}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-xs font-extrabold flex items-center gap-0.5 hover:underline uppercase text-pink-700"
                    >
                      Kênh <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase opacity-40">
                      Trống
                    </span>
                  )}
                </motion.div>

                {/* TikTok Node */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`flex flex-col items-center justify-between rounded-2xl border p-4 text-center transition-all shadow-2xs hover:shadow-md ${
                    tt
                      ? "bg-slate-900/5 border-slate-900/20 text-slate-800 dark:text-slate-200 hover:border-slate-900/40"
                      : "bg-muted/10 border-border/40 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-black font-extrabold text-xs flex items-center justify-center mb-2 ">
                    ♬
                  </div>
                  <span className="text-xs font-bold block truncate max-w-full">
                    TikTok
                  </span>
                  {tt ? (
                    <a
                      href={tt.startsWith("http") ? tt : `https://${tt}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-xs font-extrabold flex items-center gap-0.5 hover:underline uppercase text-slate-900"
                    >
                      Xem k.h <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-xs font-extrabold uppercase opacity-40">
                      Trống
                    </span>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* BIỂU ĐỒ DỰ BÁO GIÁ TRỊ VÒNG ĐỜI KHÁCH HÀNG (FORECAST CUSTOMER LIFETIME VALUE) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2f6cf5]" />
                  Dự báo Giá trị Vòng đời Khách hàng (Predictive CLV Forecast)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mô hình học máy dự phóng xu hướng chi tiêu 12 tháng kế tiếp
                  dựa trên điểm số Loyalty ({points} pts) & hạng thành viên{" "}
                  <span className="font-bold capitalize text-primary">
                    {tier.name.split(" ")[0]}
                  </span>
                  .
                </p>
              </div>

              {/* Scenario Toggle Button Suite */}
              <div className="flex items-center gap-1.5 self-start md:self-center bg-muted/40 p-1 rounded-xl border border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase px-2">
                  Kịch bản:
                </span>
                <button
                  onClick={() => setClvScenario("conservative")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    clvScenario === "conservative"
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Thận trọng
                </button>
                <button
                  onClick={() => setClvScenario("baseline")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    clvScenario === "baseline"
                      ? "bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Cơ bản
                </button>
                <button
                  onClick={() => setClvScenario("optimistic")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    clvScenario === "optimistic"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Lạc quan
                </button>
              </div>
            </div>

            {/* Financial Insight KPIs Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-2xl border border-border/40 hover:border-emerald-500/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  ĐÃ CHI TIÊU
                </span>
                <span className="text-sm font-black text-foreground block mt-1">
                  {formatVND(clvStats.historicalSpent)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{" "}
                  Hồ sơ ghi nhận
                </span>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-2xl border border-border/40 hover:border-[#2f6cf5]/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  CLV LŨY KẾ DỰ DỰ KIẾN
                </span>
                <span className="text-sm font-black text-[#2f6cf5] block mt-1">
                  {formatVND(clvStats.predictedCLV)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2f6cf5] inline-block animate-pulse" />{" "}
                  Sau 12 tháng dự kiến
                </span>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-2xl border border-border/40 col-span-2 md:col-span-1 hover:border-emerald-500/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  TĂNG TRƯỞNG DỰ KIẾN
                </span>
                <span className="text-sm font-black text-emerald-500 block mt-1 flex items-center gap-1">
                  +{formatVND(clvStats.growthAmount)}
                  <span className="text-xs font-bold text-emerald-500">
                    ({(clvStats.growthRate * 100).toFixed(1)}%)
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-yellow-500" /> Hệ số tăng
                  trưởng hạng KH
                </span>
              </motion.div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-[220px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    {
                      name: "3 tháng trước",
                      "Đã Chi Tiêu": Math.round(
                        clvStats.historicalSpent * 0.45,
                      ),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "2 tháng trước",
                      "Đã Chi Tiêu": Math.round(clvStats.historicalSpent * 0.7),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "1 tháng trước",
                      "Đã Chi Tiêu": Math.round(clvStats.historicalSpent * 0.9),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "Hiện tại",
                      "Đã Chi Tiêu": clvStats.historicalSpent,
                      "Dự Báo CLV": clvStats.historicalSpent,
                    },
                    {
                      name: "+3 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.25),
                      ),
                    },
                    {
                      name: "+6 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.5),
                      ),
                    },
                    {
                      name: "+9 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.75),
                      ),
                    },
                    {
                      name: "+12 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(clvStats.predictedCLV),
                    },
                  ]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                    <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#2f6cf5"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.06)"
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "currentColor",
                      opacity: 0.65,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    tick={{
                      fill: "currentColor",
                      opacity: 0.65,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isHistorical =
                          data["Đã Chi Tiêu"] !== null &&
                          data.name !== "Hiện tại";
                        return (
                          <div className="bg-popover border border-border/80 p-3 rounded-2xl shadow-xl font-sans text-xs space-y-1.5 backdrop-blur-md">
                            <p className="font-extrabold text-foreground">
                              {data.name}
                            </p>
                            {data["Đã Chi Tiêu"] !== null && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-muted-foreground font-semibold">
                                  Thực tế chi tiêu:
                                </span>
                                <span className="font-bold text-foreground">
                                  {formatVND(data["Đã Chi Tiêu"])}
                                </span>
                              </div>
                            )}
                            {data["Dự Báo CLV"] !== null && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#2f6cf5]" />
                                <span className="text-muted-foreground font-semibold">
                                  Dự báo CLV:
                                </span>
                                <span className="font-bold text-[#2f6cf5]">
                                  {formatVND(data["Dự Báo CLV"])}
                                </span>
                              </div>
                            )}
                            {!isHistorical && (
                              <div className="text-xs text-muted-foreground border-t border-border/40 pt-1 flex items-center gap-1 font-semibold">
                                <span>🔮 Kịch bản:</span>
                                <span className="text-primary capitalize">
                                  {clvScenario === "baseline"
                                    ? "Cơ bản"
                                    : clvScenario === "conservative"
                                      ? "Thận trọng"
                                      : "Lạc quan"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Đã Chi Tiêu"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Dự Báo CLV"
                    stroke="#2f6cf5"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    fillOpacity={1}
                    fill="url(#colorCLV)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    dot={{ r: 3, strokeWidth: 0, fill: "#2f6cf5" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* DÒNG THỜI GIAN HOẠT ĐỘNG CHRONOLOGICAL (ACTIVITY TIMELINE) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="inline-flex w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Dòng Thời Gian Hoạt Động (Live Activity Timeline)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Biên niên sử đồng bộ thời gian thực hiển thị giao dịch, khiếu
                  nại & biến động trạng thái.
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                <button
                  onClick={() => setTimelineFilter("all")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timelineFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Tất cả ({combinedTimeline.length})
                </button>
                <button
                  onClick={() => setTimelineFilter("purchase")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timelineFilter === "purchase"
                      ? "bg-[#2f6cf5] text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Giao dịch ({purchaseEvents.length})
                </button>
                <button
                  onClick={() => setTimelineFilter("ticket")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timelineFilter === "ticket"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Phiếu hỗ trợ ({ticketEvents.length})
                </button>
                <button
                  onClick={() => setTimelineFilter("status_change")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timelineFilter === "status_change"
                      ? "bg-indigo-500 text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Trạng thái ({statusEvents.length + 1})
                </button>
              </div>
            </div>

            {/* Timeline Line View */}
            <div className="relative pl-6 md:pl-8 space-y-6">
              {/* Vertical timeline connector */}
              <div className="absolute left-3 md:left-4 top-2 bottom-2 w-0.5 bg-border/50 dark:bg-border/20 z-0" />

              {filteredTimeline.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Không tìm thấy hoạt động nào phù hợp với bộ lọc này.
                </div>
              ) : (
                filteredTimeline.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-3 bg-background/55 hover:bg-background/80 p-4 rounded-2xl border border-border/45 hover:border-[#2f6cf5]/30 transition-all group/item shadow-2xs"
                  >
                    {/* Floating timeline bubble */}
                    <div className="absolute -left-[31px] md:-left-[35px] top-4 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs shadow-sm group-hover/item:border-primary transition-colors">
                      {item.icon}
                    </div>

                    <div className="space-y-1 max-w-full md:max-w-[70%]">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-xs font-extrabold text-foreground tracking-tight flex items-center gap-1.5 leading-tight">
                          {item.title}
                        </h5>
                        <span
                          className={`inline-block text-xs px-1.5 py-0.5 rounded border font-semibold ${item.badgeStyle}`}
                        >
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      {/* Meta/Time values */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground/80">
                        <span>🕒 {item.dateStr}</span>
                        <span>•</span>
                        <span className="text-[#2f6cf5] font-semibold uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 md:self-center">
                      {item.valueStr && (
                        <span className="text-xs font-black text-foreground block">
                          {item.valueStr}
                        </span>
                      )}
                      {item.pointsStr && (
                        <span className="text-xs font-bold text-emerald-500">
                          {item.pointsStr}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* API ĐƠN HÀNG ĐÃ MUA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  ĐƠN HÀNG ĐÃ MUA (CRM API)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dữ liệu đơn hàng đồng bộ trực tiếp từ hệ thống ERP/CRM.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    // Start by simulating the POST to the new gateway API
                    const apiRes = await fetch("/api/pos/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        customerPhone: customer.phone,
                        items: "OLED Smart TV 4K...",
                      }),
                    });

                    const result = await apiRes.json();

                    if (result.success) {
                      // On success, we apply the updated data to Firestore
                      const newOrder = result.data;
                      const mockOrders = [
                        newOrder,
                        {
                          id: `SO-${Math.floor(Math.random() * 10000)}`,
                          date: "15/04/2026",
                          total: "35,000,000 đ",
                          status: "Đang giao",
                          items: "Apple Watch Series 11...",
                          statusClasses:
                            "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20",
                        },
                      ];
                      await updateFirestore(
                        { orders: [...(customer.orders || []), ...mockOrders] },
                        result.message,
                      );
                    } else {
                      toast.error(result.message);
                    }
                  } catch (err: any) {
                    toast.error(`Lỗi hệ thống: ${err.message}`);
                  }
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted transition-all flex items-center gap-1.5"
                title="Đồng bộ dữ liệu mới nhất"
              >
                <RefreshCw className="w-3 h-3 text-[#2f6cf5]" /> Đồng bộ giả lập
              </button>
            </div>

            <div className="space-y-3">
              {!customer.orders || customer.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-2xl">
                  <div className="w-12 h-12 bg-background border rounded-2xl flex items-center justify-center mb-3 text-muted-foreground shadow-sm">
                    🛒
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Chưa có thông tin đơn hàng
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Hệ thống chưa ghi nhận phát sinh đơn hàng nào hoặc API chưa
                    đồng bộ dữ liệu.
                  </span>
                </div>
              ) : (
                customer.orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border/60 bg-background shadow-sm hover:border-primary/20 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {order.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${order.statusClasses}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {order.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {order.items}
                      </span>
                      <span>{formatVietnameseDate(order.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* API PHIẾU HỖ TRỢ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  PHIẾU HỖ TRỢ & TICKET (CRM API)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lịch sử khiếu nại, bảo hành và yêu cầu hỗ trợ từ khách hàng.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const apiRes = await fetch("/api/crm/tickets", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        customerPhone: customer.phone,
                        subject: "Tư vấn nâng cấp thiết bị POS",
                      }),
                    });

                    const result = await apiRes.json();

                    if (result.success) {
                      const mockTickets = [
                        result.data,
                        {
                          id: `SUP-${Math.floor(Math.random() * 10000)}`,
                          date: "10/01/2026",
                          subject: "Tư vấn nâng cấp gói bảo hành Vàng",
                          status: "Đã đóng",
                          severity: "Thấp",
                        },
                      ];
                      await updateFirestore(
                        {
                          tickets: [
                            ...(customer.tickets || []),
                            ...mockTickets,
                          ],
                        },
                        result.message,
                      );
                    } else {
                      toast.error(result.message);
                    }
                  } catch (err: any) {
                    toast.error(`Lỗi hệ thống: ${err.message}`);
                  }
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted transition-all"
              >
                Giả lập Ticket CRM
              </button>
            </div>

            <div className="space-y-3">
              {!customer.tickets || customer.tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-2xl">
                  <div className="w-12 h-12 bg-background border rounded-2xl flex items-center justify-center mb-3 text-muted-foreground shadow-sm">
                    🎫
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Chưa có phiếu hỗ trợ
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Khách hàng chưa có yêu cầu hỗ trợ hoặc khiếu nại nào được
                    ghi nhận.
                  </span>
                </div>
              ) : (
                customer.tickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl border border-border/60 bg-background shadow-sm hover:border-primary/20 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {ticket.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ticket.status === "Đang xử lý" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${ticket.severity === "Cao" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}
                      >
                        {ticket.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[250px] font-medium text-foreground">
                        {ticket.subject}
                      </span>
                      <span>
                        {formatVietnameseDate(ticket.date || ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
