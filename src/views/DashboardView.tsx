import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { kpiData, revenueData, recentCustomers } from "@/data/mockData";
import { getGuestCustomers, saveGuestCustomer, getGuestTiers } from "@/data/guestData";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/components/FirebaseProvider";
import { Customer } from "@/types";
import { formatCurrency, getCurrency } from "@/lib/currency";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import confetti from "canvas-confetti";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  Gem,
  Wifi,
  WifiOff,
  Calendar,
  ChevronDown,
  Filter,
  Award,
  User,
  Users,
  Activity,
  RotateCcw,
  LayoutDashboard,
  Database,
  Send,
  Smartphone,
  CreditCard as LucideCreditCard,
  Plus,
  BookOpen,
  Minus,
  Lock,
  ShieldCheck,
  Check,
  MapPin,
  Info,
  Coins,
  Globe,
  Copy,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Gift,
  Trophy,
  Crown,
  ArrowRight,
  UserPlus,
  Megaphone,
  Printer,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import { DatabaseStatus } from "@/components/layout/DatabaseStatus";
import { CustomerTierPieChart } from "@/components/dashboard/CustomerTierPieChart";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingBirthdays } from "@/components/dashboard/UpcomingBirthdays";
import { TierUpProgress } from "@/components/dashboard/TierUpProgress";

export function DashboardView() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { user } = useFirebase();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState(4);
  const [totalRedeemedPoints, setTotalRedeemedPoints] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Nâng cấp hạng thẻ",
      description: "Khách hàng Lê Anh đã nâng cấp lên hạng Icon",
      time: "2 phút trước",
      type: "upgrade",
      unread: true,
    },
    {
      id: "2",
      title: "Đổi điểm thưởng",
      description: "Khách hàng Nguyễn Văn B đã đổi 500 điểm lấy Voucher",
      time: "15 phút trước",
      type: "redeem",
      unread: true,
    },
    {
      id: "3",
      title: "Đăng ký thành viên mới",
      description: "Có 5 thành viên mới vừa gia nhập hệ thống",
      time: "1 giờ trước",
      type: "user",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  useEffect(() => {
    if (!user || user.isLocal) {
      // Use helper to get guest customers
      const list = getGuestCustomers();
      setAllCustomers(list);
      
      const savedRedemptions = localStorage.getItem("crm_guest_redemptions_v1");
      if (savedRedemptions) {
        try {
          const parsed = JSON.parse(savedRedemptions);
          const total = (parsed as any[]).reduce((sum, r) => sum + (r.pointsSpent || 0), 0);
          setTotalRedeemedPoints(total);
        } catch (e) {}
      }

      // Listen to event for guest changes
      const handleGuestChange = () => {
        const list2 = getGuestCustomers();
        setAllCustomers(list2);
      };
      window.addEventListener("crm_guest_data_changed", handleGuestChange);
      return () => window.removeEventListener("crm_guest_data_changed", handleGuestChange);
    } else {
      // Firestore Real-Time listeners!
      const unsubscribeCust = onSnapshot(collection(db, "customers"), (snap) => {
        const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
        setAllCustomers(list);
      }, (err) => {
        console.error("Firestore customers KPI listener error:", err);
      });

      const unsubscribeCamp = onSnapshot(collection(db, "loyalty_campaigns"), (snap) => {
        const activeCount = snap.docs.filter(doc => doc.data().isActive === true).length;
        setActiveCampaigns(activeCount || 0);
      }, (err) => {
        console.error("Firestore campaigns KPI listener error:", err);
      });

      const unsubscribeRedeem = onSnapshot(collection(db, "redemption_logs"), (snap) => {
        const total = snap.docs.reduce((sum, doc) => sum + (doc.data().pointsSpent || 0), 0);
        setTotalRedeemedPoints(total);
      }, (err) => {
        console.error("Firestore redemptions KPI listener error:", err);
      });

      return () => {
        unsubscribeCust();
        unsubscribeCamp();
        unsubscribeRedeem();
      };
    }
  }, [user]);

  const [prevCustomers, setPrevCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (prevCustomers.length > 0 && allCustomers.length > 0) {
      allCustomers.forEach(currentCust => {
        const prevCust = prevCustomers.find(p => p.id === currentCust.id);
        if (prevCust && prevCust.tier !== currentCust.tier) {
          toast.success(`Khách hàng ${currentCust.name} đã thăng hạng lên ${currentCust.tier}!`, {
            description: `Hệ thống tự động ghi nhận thay đổi phân hạng.`,
            icon: <Crown className="w-5 h-5 text-amber-500 animate-pulse" />,
            duration: 8000,
          });
          
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      });
    }
    setPrevCustomers(allCustomers);
  }, [allCustomers]);

  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.isLocal) {
      setTiers(getGuestTiers());
      
      const handleTiersChange = () => {
        setTiers(getGuestTiers());
      };
      window.addEventListener("crm-config-saved", handleTiersChange);
      return () => window.removeEventListener("crm-config-saved", handleTiersChange);
    } else {
      const unsub = onSnapshot(collection(db, "tier_configs"), (snap) => {
        const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setTiers(list);
      }, (err) => {
        console.error("Error loading tiers:", err);
      });
      return unsub;
    }
  }, [user]);

  // Floating Quick Action States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showLaunchCampaignModal, setShowLaunchCampaignModal] = useState(false);

  // Add Customer Form States
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTier, setNewCustTier] = useState("Essential");
  const [newCustPoints, setNewCustPoints] = useState(100);

  // Launch Campaign Form States
  const [newCampName, setNewCampName] = useState("");
  const [newCampMultiplier, setNewCampMultiplier] = useState(1.5);
  const [newCampTarget, setNewCampTarget] = useState("Tất cả thành viên");
  const [newCampDays, setNewCampDays] = useState(14);

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast.error("Vui lòng điền tên khách hàng");
      return;
    }

    const newCust: any = {
      id: "KH_" + Math.floor(1000 + Math.random() * 9000),
      name: newCustName,
      email: newCustEmail || "",
      phone: newCustPhone || "",
      tier: newCustTier,
      points: Number(newCustPoints) || 0,
      clv: 0,
      activityStatus: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || "guest",
      customFields: {
        last_purchase: new Date().toISOString(),
        clv: 0,
      }
    };

    if (!user || user.isLocal) {
      saveGuestCustomer(newCust);
    } else {
      // Set to Firestore if authentication and project connected
      try {
        const { addDoc, collection, serverTimestamp } = require("firebase/firestore");
        addDoc(collection(db, "customers"), {
          name: newCust.name,
          email: newCust.email,
          phone: newCust.phone,
          tier: newCust.tier,
          points: newCust.points,
          clv: 0,
          activityStatus: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid,
          customFields: {
            last_purchase: new Date().toISOString(),
            clv: 0,
          }
        });
      } catch (err) {
        console.error("Firestore user write error:", err);
      }
    }

    window.dispatchEvent(new CustomEvent("crm_guest_data_changed"));

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    toast.success(`Đã thêm thành công khách hàng ${newCustName}!`);
    setShowAddCustomerModal(false);

    // Reset fields
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustTier("Essential");
    setNewCustPoints(100);
  };

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + Number(newCampDays));
    const endStr = end.toISOString().split('T')[0];

    const newCamp = {
      id: "camp-" + Math.floor(1000 + Math.random() * 9000),
      name: newCampName,
      multiplier: Number(newCampMultiplier),
      startDate: todayStr,
      endDate: endStr,
      targetAudience: newCampTarget,
      isActive: true,
      notes: `Chiến dịch nhân điểm x${newCampMultiplier} khởi chạy nhanh từ Dashboard.`
    };

    const savedCampaigns = localStorage.getItem("marketing_point_campaigns");
    let pointCampaignsList = [];
    if (savedCampaigns) {
      try {
        pointCampaignsList = JSON.parse(savedCampaigns);
      } catch (e) {}
    }
    pointCampaignsList.unshift(newCamp);
    localStorage.setItem("marketing_point_campaigns", JSON.stringify(pointCampaignsList));

    if (user && !user.isLocal) {
      try {
        const { addDoc, collection } = require("firebase/firestore");
        addDoc(collection(db, "loyalty_campaigns"), {
          name: newCamp.name,
          multiplier: newCamp.multiplier,
          startDate: newCamp.startDate,
          endDate: newCamp.endDate,
          targetAudience: newCamp.targetAudience,
          isActive: true,
          notes: newCamp.notes
        });
      } catch (err) {
        console.error("Firestore campaign write error:", err);
      }
    }

    window.dispatchEvent(new CustomEvent("crm_guest_data_changed"));

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast.success(`Đã khởi chạy chiến dịch "${newCampName}" thành công!`);
    setShowLaunchCampaignModal(false);

    setNewCampName("");
    setNewCampMultiplier(1.5);
    setNewCampTarget("Tất cả thành viên");
    setNewCampDays(14);
  };

  const handlePrintLoyaltyReport = () => {
    const toastId = toast.loading("Đang kết xuất dữ liệu báo cáo Seva VIP...");
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = [47, 108, 245];
      const darkColor = [31, 41, 55];
      const grayColor = [107, 114, 128];

      const reportDate = new Date().toLocaleString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Top line accent
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 6, "F");

      // Title header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text("SEVA CLUB - REPORT SUMMARY", 14, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("Báo cáo phân tích chương trình Loyalty & Dữ liệu VIP", 14, 25);

      doc.setFontSize(9);
      doc.text(`Thời gian: ${reportDate}`, 196, 20, { align: "right" });
      doc.text("Chế độ: Đồng bộ thời gian thực", 196, 25, { align: "right" });

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 30, 196, 30);

      // Section 1: KPI Statistics
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("1. Chỉ số Loyalty tổng quan (Heart Metrics)", 14, 40);

      const totalCust = allCustomers.length;
      const totalPoints = allCustomers.reduce((sum, c) => sum + (c.points || 0), 0);
      const avgPoints = totalCust > 0 ? Math.round(totalPoints / totalCust) : 0;
      
      const atelierCount = allCustomers.filter(c => (c.points || 0) >= 10000).length;
      const iconCount = allCustomers.filter(c => (c.points || 0) >= 2500 && (c.points || 0) < 10000).length;
      const essentialCount = allCustomers.filter(c => (c.points || 0) >= 500 && (c.points || 0) < 2500).length;

      // Draw box widgets
      doc.setFillColor(249, 250, 251);
      doc.rect(14, 45, 56, 25, "F");
      doc.rect(74, 45, 56, 25, "F");
      doc.rect(134, 45, 62, 25, "F");

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.rect(14, 45, 56, 25, "S");
      doc.rect(74, 45, 56, 25, "S");
      doc.rect(134, 45, 62, 25, "S");

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Tổng sỹ số VIP", 18, 51);
      doc.setFontSize(15);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${totalCust.toLocaleString()} KH`, 18, 62);

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Điểm tích lũy tích tụ", 78, 51);
      doc.setFontSize(15);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${totalPoints.toLocaleString()} pts`, 78, 62);

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Bình quân / Khách", 138, 51);
      doc.setFontSize(15);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${avgPoints.toLocaleString()} pts`, 138, 62);

      // Section 2: Tiers
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("2. Phân lớp cơ cấu Hội viên (Membership Tiers)", 14, 82);

      const tableTiers = [
        ["Cấp Atelier (Kim Cương)", "Từ 10,000 pts", `${atelierCount} 成 viên`],
        ["Cấp Icon (Vàng)", "Từ 2,500 pts", `${iconCount} 成 viên`],
        ["Cấp Essential (Bạc)", "Từ 500 pts", `${essentialCount} 成 viên`],
      ];

      (doc as any).autoTable({
        startY: 88,
        head: [["Thứ hạng", "Yêu cầu tối thiểu", "Số lượng thành viên"]],
        body: tableTiers,
        theme: "plain",
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: darkColor,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9.5,
          font: "Helvetica",
        },
        margin: { left: 14, right: 14 },
      });

      // Section 3: High loyalty
      const nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("3. Top 5 siêu hạt nhân tích lũy (Top Elite Members)", 14, nextY);

      const topElite = [...allCustomers]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 5);

      const eliteBody = topElite.map((c, i) => [
        `#${i + 1}`,
        c.name,
        c.phone || "—",
        c.tier || "Essential",
        `${(c.points || 0).toLocaleString()} pts`,
      ]);

      (doc as any).autoTable({
        startY: nextY + 6,
        head: [["XH", "Họ tên", "Số điện thoại", "Cấp bậc", "Điểm tích lũy"]],
        body: eliteBody,
        theme: "striped",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          font: "Helvetica",
        },
        margin: { left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text("(*) Tài liệu lưu hành nội bộ của hệ thống Seva Club.", 14, finalY);

      doc.save("Bao_Cao_Loyalty_Seva_Club.pdf");
      toast.success("Bản báo cáo PDF đã được khởi tạo và tải về máy!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Có lỗi xảy ra: ${err.message}`, { id: toastId });
    }
  };

  // Digital Power Service Wallet dynamic states matching the design mockup layout
  const [walletBalance, setWalletBalance] = useState(7610.00);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [activeWalletAction, setActiveWalletAction] = useState<"send" | "apply">("send");
  const [payToAddress, setPayToAddress] = useState("0125-0154-0845-5047-7566-2055");
  const [transferAmount, setTransferAmount] = useState(300);
  const [transferReason, setTransferReason] = useState("Games");
  const [showWalletSuccess, setShowWalletSuccess] = useState(false);
  const [copiedWalletId, setCopiedWalletId] = useState(false);

  const handleCopyWalletId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedWalletId(true);
    toast.success("Đã sao chép mã ví thành công!");
    setTimeout(() => setCopiedWalletId(false), 2000);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = transferAmount + 3; // $3 is commission fee
    if (walletBalance < cost) {
      toast.error("Số dư khả dụng trong ví không đủ để thực hiện giao dịch này.");
      return;
    }
    setWalletBalance(prev => Number((prev - cost).toFixed(2)));
    toast.success(`Đã gửi thành công $${transferAmount} tới địa chỉ ${payToAddress}! Phí hoa hồng: $3`, {
      description: `Lý do thanh toán: ${transferReason}`,
      duration: 5000,
    });
    setShowWalletSuccess(true);
    setTimeout(() => setShowWalletSuccess(false), 4000);
  };

  useEffect(() => {
    // Stock Watcher: Check for low stock items and show toast
    const LOW_STOCK_ITEMS = [
      { name: "Voucher High-Tea Atelier", stock: 8 },
      { name: "Vé mời Private Showcase", stock: 3 }
    ];

    const timer = setTimeout(() => {
      LOW_STOCK_ITEMS.forEach(item => {
        toast.warning("Cảnh báo tồn kho thấp", {
          description: `Mục "${item.name}" chỉ còn ${item.stock} đơn vị. Hãy nhập thêm!`,
          icon: <Gift className="w-4 h-4 text-amber-500" />,
          duration: 10000,
        });
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Date Selection States
  const [startDate, setStartDate] = useState("2026-04-28");
  const [endDate, setEndDate] = useState("2026-05-27");
  const [activePreset, setActivePreset] = useState<string>("30days");
  const [isOpen, setIsOpen] = useState(false);
  const [currencyConfig, setCurrencyConfig] = useState(getCurrency());

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyConfig(getCurrency());
    window.addEventListener('seva-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('seva-currency-changed', handleCurrencyChange);
  }, []);

  const currentCurrency = useMemo(() => getCurrency(), [currencyConfig]);

  // Membership Tier States
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [isTierOpen, setIsTierOpen] = useState(false);

  const tierOptions = [
    { label: "Tất cả các hạng", id: "all" },
    { label: "Member", id: "Member" },
    { label: "Essential", id: "Essential" },
    { label: "Icon", id: "Icon" },
    { label: "Atelier", id: "Atelier" },
  ];

  const presets = [
    {
      label: "Hôm nay",
      id: "today",
      getRange: () => ({ start: "2026-05-27", end: "2026-05-27" }),
    },
    {
      label: "7 ngày qua",
      id: "7days",
      getRange: () => ({ start: "2026-05-21", end: "2026-05-27" }),
    },
    {
      label: "30 ngày qua",
      id: "30days",
      getRange: () => ({ start: "2026-04-28", end: "2026-05-27" }),
    },
    {
      label: "Tháng này",
      id: "month",
      getRange: () => ({ start: "2026-05-01", end: "2026-05-27" }),
    },
    {
      label: "Tháng trước",
      id: "last_month",
      getRange: () => ({ start: "2026-04-01", end: "2026-04-30" }),
    },
    {
      label: "Toàn bộ",
      id: "all",
      getRange: () => ({ start: "2023-01-01", end: "2026-05-27" }),
    },
  ];

  const handlePresetSelect = (presetId: string, start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset(presetId);
    setIsOpen(false);
  };

  const handleCustomDateChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
      setStartDate(val);
    } else {
      setEndDate(val);
    }
    setActivePreset("custom");
  };

  const handleClearFilters = () => {
    setStartDate("2026-04-28");
    setEndDate("2026-05-27");
    setActivePreset("30days");
    setSelectedTier("all");
    setIsOpen(false);
    setIsTierOpen(false);
  };

  const formatRangeText = () => {
    try {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const sStr = sDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const eStr = eDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `${sStr} - ${eStr}`;
    } catch (e) {
      return `${startDate} - ${endDate}`;
    }
  };

  // Difference in days index
  const daysDiff = useMemo(() => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    } catch {
      return 30;
    }
  }, [startDate, endDate]);

  // Factor to scale metrics if a specific tier is filtered
  const tierFactor = useMemo(() => {
    switch (selectedTier) {
      case "Member":
        return 0.15;
      case "Essential":
        return 0.25;
      case "Icon":
        return 0.28;
      case "Atelier":
        return 0.32;
      default:
        return 1.0;
    }
  }, [selectedTier]);

  // Stat Recalculations for KPIs based on actual data of the loyalty workspace
  const filteredKpis = useMemo(() => {
    // 1. TỔNG KHÁCH HÀNG
    const totalCustCount = 1200 + allCustomers.length;
    const finalTotalCustomers = totalCustCount > 1200 ? totalCustCount : 1284;

    // 2. ĐIỂM ĐÃ CẤP (base starts from 4.2M pts)
    const pointsIssuedVal = 4200000 + (allCustomers.reduce((acc, c) => acc + (c.points || 0), 0) / 10);

    // 3. TỶ LỆ ĐỔI QUÀ (base starts from 32.4%)
    const redeemRateVal = 32.4 + (allCustomers.length % 5) * 0.12;

    // 4. DOANH THU ƯỚC TÍNH (base starts from 1,150,000,000đ)
    const revenueVal = 1150000000 + (allCustomers.reduce((acc, c) => acc + (c.clv || 0), 0) / 10);

    return [
      {
        label: "TỔNG KHÁCH HÀNG",
        value: finalTotalCustomers.toLocaleString("vi-VN"),
        change: "+12.5%",
        positive: true,
        icon: Users,
        iconColor: "text-[#2f6cf5]",
        iconBg: "bg-[#2f6cf5]/10",
        trendLabel: "so với kỳ trước",
      },
      {
        label: "ĐIỂM ĐÃ CẤP",
        value: pointsIssuedVal >= 1000000 
          ? `${(pointsIssuedVal / 1000000).toFixed(1)}M pts`
          : `${Math.floor(pointsIssuedVal).toLocaleString("vi-VN")} pts`,
        change: "+18.2%",
        positive: true,
        icon: Activity,
        iconColor: "text-indigo-500",
        iconBg: "bg-indigo-500/10",
        trendLabel: "so với kỳ trước",
      },
      {
        label: "TỶ LỆ ĐỔI QUÀ",
        value: `${redeemRateVal.toFixed(1)}%`,
        change: "-2.1%",
        positive: false,
        icon: Gift,
        iconColor: "text-purple-500",
        iconBg: "bg-purple-500/10",
        trendLabel: "so với kỳ trước",
      },
      {
        label: "DOANH THU ƯỚC TÍNH",
        value: `${Math.floor(revenueVal).toLocaleString("vi-VN")}đ`,
        change: "+7.4%",
        positive: true,
        icon: TrendingUp,
        iconColor: "text-[#2f6cf5]",
        iconBg: "bg-[#2f6cf5]/10",
        trendLabel: "so với kỳ trước",
      },
    ];
  }, [allCustomers, totalRedeemedPoints, currentCurrency]);

  // Dynamic Charting categories matching dates or weeks scaled by tier
  const filteredRevenueData = useMemo(() => {
    if (activePreset === "all" || daysDiff > 60) {
      return revenueData.map((d) => ({
        ...d,
        revenue: Math.floor(d.revenue * tierFactor),
      }));
    }

    // If day-by-day analysis
    if (daysDiff <= 7) {
      const data = [];
      const sDate = new Date(startDate);
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(sDate);
        currentDate.setDate(sDate.getDate() + i);
        const dayLabel = currentDate.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
        const dayVal = Math.floor(
          (62000000 + (i % 3) * 16500000 + (i % 2) * 9000000) * tierFactor,
        );
        data.push({ name: dayLabel, revenue: dayVal });
      }
      return data;
    }

    // Weekly blocks for 30 days
    const totalWeeks = Math.ceil(daysDiff / 7);
    const data = [];
    for (let i = 1; i <= totalWeeks; i++) {
      const weekRevenue = Math.floor(
        (920000000 + (i % 3) * 145000000 + (i % 2) * 45000000) * tierFactor,
      );
      data.push({ name: `Tuần ${i}`, revenue: weekRevenue });
    }
    return data;
  }, [daysDiff, startDate, activePreset, tierFactor]);

  // Dynamic Filtered VIP customers shown in list based on selected tier
  const filteredRecentCustomers = useMemo(() => {
    if (selectedTier === "all") return recentCustomers;
    return recentCustomers.filter(
      (c) => c.tier.toLowerCase() === selectedTier.toLowerCase(),
    );
  }, [selectedTier]);

  const topPerformers = useMemo(() => {
    // Get top 10 by points from allCustomers
    return [...allCustomers]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);
  }, [allCustomers]);

  const [chartView, setChartView] = useState<"distribution" | "trend">("distribution");

  const monthlyGrowthData = useMemo(() => {
    const data = [];
    const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"];
    
    // Simulate some monthly growth data
    let baseSignups = 150;
    let basePoints = 45000;
    for (let i = 0; i < 6; i++) {
      baseSignups += Math.floor(Math.random() * 50) + 20;
      basePoints += Math.floor(Math.random() * 15000) + 5000;
      data.push({
        month: months[i],
        signups: baseSignups,
        points: basePoints
      });
    }
    return data;
  }, [allCustomers]);

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-primary/25"
    >
      {/* Title container + Date Range Picker right next to it */}
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-primary/10 rounded-[10px] text-primary flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
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
            <LayoutDashboard className="w-8 h-8 text-[#2f6cf5]" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-[#2f6cf5]">
              Tổng quan
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Số liệu thống kê và thông tin tổng quan hệ thống.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              if (!isNotificationsOpen) markAllAsRead();
            }}
            className={cn(
              "p-2.5 rounded-[10px] border transition-all flex items-center justify-center relative shadow-xs cursor-pointer",
              isNotificationsOpen 
                ? "bg-primary text-white border-primary shadow-primary/20" 
                : "bg-background border-border hover:bg-muted text-muted-foreground"
            )}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotificationsOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-card border border-border shadow-2xl rounded-[10px] z-50 overflow-hidden text-left origin-top-right backdrop-blur-xl"
              >
                <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Thông báo</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">Hoạt động thời gian thực từ hệ thống</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[10px]">
                    {unreadCount} Mới
                  </Badge>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer group flex gap-3",
                            notif.unread && "bg-primary/[0.02]"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 shadow-xs",
                            notif.type === 'upgrade' ? "bg-amber-500/10 text-amber-500" :
                            notif.type === 'redeem' ? "bg-[#2f6cf5]/10 text-[#2f6cf5]" :
                            "bg-emerald-500/10 text-emerald-500"
                          )}>
                             {notif.type === 'upgrade' ? <ArrowUpRight className="w-4 h-4" /> :
                              notif.type === 'redeem' ? <Gift className="w-4 h-4" /> :
                              <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 font-medium">
                              {notif.description}
                            </p>
                            <span className="text-[9px] text-muted-foreground/60 mt-1.5 block font-bold uppercase tracking-wider">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">Không có thông báo nào mới</p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-muted/20 border-t border-border/60">
                   <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="w-full py-2 bg-background border border-border hover:bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-[8px] transition-all cursor-pointer"
                   >
                     Xem tất cả hoạt động
                   </button>
                </div>
              </motion.div>
            </>
          )}
        </div>

        <button
          onClick={() => {}}
          className="flex items-center px-4 py-2 rounded-[10px] text-xs font-bold transition-all border cursor-pointer bg-background border-border hover:bg-muted text-foreground"
        >
          <BookOpen className="w-4 h-4 mr-2 text-primary" /> Tài liệu Tổng quan
        </button>
      </div>
    </motion.div>
  );

  const actionControls = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card/65 border border-border/80 rounded-[10px] backdrop-blur-md font-sans">
      <div className="text-left">
        <h3 className="text-base font-bold font-heading text-foreground">Bộ lọc tổng quan</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Lọc dữ liệu thống kê theo thời gian và phân hạng hội viên.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Range Picker dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setIsTierOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-muted/50 text-foreground border border-border rounded-[10px] text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <Calendar className="w-4 h-4 text-[#2f6cf5]" />
            <span className="">{formatRangeText()}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <>
              {/* Backdrop handle for closing */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-72 bg-card border border-border shadow-2xl rounded-[10px] p-4.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="space-y-4">
                  <div className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Chọn khoảng lọc thời gian</span>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {presets.map((p) => {
                      const range = p.getRange();
                      const isActive = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            handlePresetSelect(p.id, range.start, range.end)
                          }
                          className={`px-3 py-2 text-xs font-bold rounded-[10px] text-left transition-all cursor-pointer ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/40 hover:bg-muted text-foreground"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom boundaries */}
                  <div className="pt-3.5 border-t border-border/80 space-y-2.5">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest block">
                      Khoảng ngày tùy chỉnh
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">
                          Từ ngày
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            handleCustomDateChange("start", e.target.value)
                          }
                          className="w-full bg-background border border-border rounded-[10px] p-2 text-xs outline-none focus:border-primary/50 text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">
                          Đến ngày
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) =>
                            handleCustomDateChange("end", e.target.value)
                          }
                          className="w-full bg-background border border-border rounded-[10px] p-2 text-xs outline-none focus:border-primary/50 text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-[10px] cursor-pointer hover:bg-primary/95 shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Membership Tier Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsTierOpen(!isTierOpen);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-muted/50 text-foreground border border-border rounded-[10px] text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>
              Hạng:{" "}
              <span className="text-[#2f6cf5] font-extrabold">
                {tierOptions.find((t) => t.id === selectedTier)?.label ||
                  selectedTier}
              </span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isTierOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isTierOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsTierOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-48 bg-card border border-border shadow-2xl rounded-[10px] p-2.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150">
                <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest px-2.5 py-1.5 border-b border-border/60">
                  Chọn hạng thành viên
                </div>
                <div className="space-y-0.5 pt-1.5">
                  {tierOptions.map((opt) => {
                    const isSel = selectedTier === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedTier(opt.id);
                          setIsTierOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-[10px] text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSel
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSel && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current font-black" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clear Filters Button */}
        {(selectedTier !== "all" || activePreset !== "30days") && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-[10px] text-xs font-bold transition-all shadow-xs cursor-pointer animate-in fade-in duration-200"
            id="clear-filters-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      {actionControls}

      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredKpis.map((kpi: any, i: number) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label}
          >
            <Card className="border border-border/50 bg-card rounded-[12px] p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between h-[135px]">
              <div className="flex flex-row items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-[10px] ${kpi.iconBg} ${kpi.iconColor} flex items-center justify-center shrink-0`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="mt-2 text-3xl font-black font-heading tracking-tight text-foreground flex items-end">
                {kpi.label.includes("DOANH THU") && kpi.value.endsWith("đ") ? (
                  <span>
                    {kpi.value.slice(0, -1)}
                    <span className="underline decoration-1 decoration-solid underline-offset-2">đ</span>
                  </span>
                ) : (
                  <span>{kpi.value}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2.5">
                {kpi.positive ? (
                  <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center text-[10px] font-extrabold gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> {kpi.change}
                  </span>
                ) : (
                  <span className="text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center text-[10px] font-extrabold gap-0.5">
                    <ArrowDownRight className="w-3 h-3" /> {kpi.change}
                  </span>
                )}
                <span className="text-muted-foreground text-[10px] font-medium">{kpi.trendLabel}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================= Power Service PREMIUM DIGITAL WALLET WORKSPACE (MOCKUP ACCURACY) ================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
        
        {/* Loyalty Points Distribution & Issuance Growth (Modified with Recharts) */}
        <div className="col-span-full">
          <Card className="p-6 border border-border/60 shadow-sm glass-card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 text-left">
              <div>
                <h3 className="text-lg font-extrabold font-heading flex items-center text-[#2f6cf5]">
                  <TrendingUp className="w-5 h-5 mr-3 text-[#2f6cf5]" />
                  {chartView === "distribution" ? "Phân bổ Điểm thưởng (30 Ngày)" : "Xu hướng Cấp phát Điểm (30 Ngày)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chartView === "distribution" 
                    ? "Tỷ lệ tích lũy và đổi sê-ri điểm thưởng trong vòng 30 ngày qua." 
                    : "Tổng điểm thưởng đã cung cấp lũy kế tích hợp trên hệ thống CRM."}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-muted/60 p-1 rounded-[10px] border border-border/40 shrink-0">
                  <button
                    onClick={() => setChartView("distribution")}
                    className={cn(
                      "px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer",
                      chartView === "distribution"
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Phân bổ Tích lũy
                  </button>
                  <button
                    onClick={() => setChartView("trend")}
                    className={cn(
                      "px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer",
                      chartView === "trend"
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs border border-border/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Xu hướng Khởi phát (Line)
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground shrink-0 select-none">
                  {chartView === "distribution" ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
                        <span>Tích lũy</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#f43f5e]" />
                        <span>Đổi điểm</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span>Tổng tích lũy</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-amber-500 rounded-full" />
                        <span>Đăng ký mới</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-[260px] w-full">
              {chartView === "distribution" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: "01/05", earn: 120, burn: 40 },
                      { day: "05/05", earn: 210, burn: 80 },
                      { day: "10/05", earn: 300, burn: 150 },
                      { day: "15/05", earn: 450, burn: 190 },
                      { day: "20/05", earn: 200, burn: 110 },
                      { day: "25/05", earn: 340, burn: 200 },
                      { day: "30/05", earn: 500, burn: 290 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    />
                    <Bar dataKey="earn" name="Tích lũy" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="burn" name="Đổi điểm" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyGrowthData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                      formatter={(value: number, name: string) => {
                        if (name === "Tổng cấp phát") return [`${value.toLocaleString()} pts`, name];
                        return [`${value.toLocaleString()}`, name];
                      }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="points" 
                      name="Tổng cấp phát" 
                      stroke="#2f6cf5" 
                      strokeWidth={3.5} 
                      dot={{ r: 3, stroke: "#2f6cf5", strokeWidth: 1.5, fill: "#fff" }}
                      activeDot={{ r: 6, stroke: "#2f6cf5", strokeWidth: 2, fill: "#fff" }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="signups" 
                      name="Đăng ký mới" 
                      stroke="#f59e0b" 
                      strokeWidth={3.5} 
                      dot={{ r: 3, stroke: "#f59e0b", strokeWidth: 1.5, fill: "#fff" }}
                      activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Top Performers Leaderboard (New Section) */}
        <div className="col-span-full">
           <Card className="border border-border/60 shadow-sm glass-card overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" /> Bảng xếp hạng Top Performers
                   </CardTitle>
                   <CardDescription>Top 5 khách hàng có điểm tích lũy cao nhất tháng này.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 font-bold border-amber-500/20">Tháng 06/2026</Badge>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader className="bg-muted/30">
                      <TableRow>
                         <TableHead className="w-[80px] text-center">Hạng</TableHead>
                         <TableHead>Khách hàng</TableHead>
                         <TableHead>Hạng thẻ</TableHead>
                         <TableHead className="text-right">Điểm tích lũy</TableHead>
                         <TableHead className="text-right sr-only">Thao tác</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {topPerformers.map((customer, index) => (
                         <TableRow key={customer.id} className="hover:bg-muted/10 transition-colors group">
                            <TableCell className="text-center">
                               {index === 0 ? (
                                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                                     <Crown className="w-5 h-5 text-amber-500" />
                                  </div>
                               ) : (
                                  <span className="text-sm font-black text-muted-foreground">#{index + 1}</span>
                               )}
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-border overflow-hidden flex items-center justify-center text-slate-500 font-bold shrink-0">
                                     {customer.name ? customer.name.charAt(0) : <User className="w-5 h-5" />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold leading-none">{customer.name}</p>
                                     <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black">{customer.customFields?.city || 'TP.HCM'}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn(
                                  "text-[10px] font-black uppercase tracking-wider",
                                  customer.points && customer.points >= 10000 ? "bg-blue-500" :
                                  customer.points && customer.points >= 2500 ? "bg-amber-500" :
                                  customer.points && customer.points >= 500 ? "bg-emerald-500" : "bg-slate-400"
                               )}>
                                  {customer.points && customer.points >= 10000 ? "Atelier" :
                                   customer.points && customer.points >= 2500 ? "Icon" :
                                   customer.points && customer.points >= 500 ? "Essential" : "Member"}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <span className="text-sm font-black tabular-nums">{(customer.points || 0).toLocaleString()} <span className="text-[10px] text-muted-foreground ml-0.5">pts</span></span>
                            </TableCell>
                            <TableCell className="text-right">
                               <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-[10px]">
                                  <ArrowRight className="w-4 h-4 text-primary" />
                               </button>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
        </div>

        {/* COLUMN 1: BALANCE, INFORMATION & SECURITY (LIME MOCKUP STYLE) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-5">
          
          {/* Balance Card */}
          <div className="bg-card rounded-[10px] p-6 border border-border/85 shadow-sm text-left flex flex-col justify-between relative overflow-hidden group hover:border-[#eb7a2e]/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#eb7a2e]/5 to-transparent rounded-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 select-none tracking-wide">Balance</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">S/.</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-900 dark:text-white font-heading">
                $ {walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
                <Plus className="w-3 h-3 text-emerald-500" />
                <span>+ $ 2,319.00</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold">
                <Minus className="w-3.5 h-3.5 text-rose-500" />
                <span>- $ 919.00</span>
              </span>
            </div>
          </div>

          {/* Information Card */}
          <div className="bg-card rounded-[10px] p-6 border border-border/85 shadow-sm text-left relative group hover:border-[#eb7a2e]/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100/60 dark:border-slate-800/60">
              <span className="text-xs font-bold text-slate-400 tracking-wide">information</span>
              <button 
                onClick={() => toast.info("Tính năng chỉnh sửa thông tin vị trí sẽ sớm khả dụng.")}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-[10px] transition-all"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 font-medium">Location:</span>
                <span className="text-slate-800 dark:text-slate-200 ml-auto font-bold">Lima</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 font-medium">Address:</span>
                <span className="text-slate-800 dark:text-slate-200 ml-auto font-bold">Peru</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Wallet ID:</span>
                  <button 
                    onClick={() => handleCopyWalletId("4d2ca285e64945c7fe88772bb5fda24b")}
                    className="p-1 text-[#eb7a2e] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-mono text-[10px] break-all bg-slate-50 dark:bg-slate-900 p-2 rounded-[10px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 text-left select-all">
                  4d2ca285e64945c7fe88772bb5fda24b
                </p>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-card rounded-[10px] p-6 border border-border/85 shadow-sm text-left relative group hover:border-[#eb7a2e]/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 tracking-wide">Security</span>
              <HelpCircle className="w-4 h-4 text-slate-300" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#eb7a2e]/10 text-[#eb7a2e] rounded-[10px]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">2FA enabled</p>
                    <p className="text-[10px] text-slate-400">Tăng bảo mật tài khoản</p>
                  </div>
                </div>
                
                {/* Custom Toggle Switch exactly like the mockup */}
                <button 
                  onClick={() => {
                    setIs2FAEnabled(!is2FAEnabled);
                    toast.success(`Đã ${!is2FAEnabled ? "bật" : "tắt"} chế độ bảo mật 2 lớp!`);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none ${is2FAEnabled ? 'bg-[#131924] dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-md transform duration-300 ease-in-out ${is2FAEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-[10px]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Key</p>
                    <p className="text-[10px] text-slate-400">•••• •••• ••••</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => toast.info("Vui lòng truy cập trang cấu hình bảo mật hệ thống để sửa khóa mã hóa.")}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[10px] text-[11px] font-bold transition-all shadow-xs"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: GOLD-VIOLET CREDIT CARD & SEND WORKFLOW */}
        <div className="col-span-1 lg:col-span-5 bg-card/65 rounded-[10px] p-6 border border-border/80 shadow-sm relative overflow-hidden backdrop-blur-md flex flex-col gap-6 hover:border-[#eb7a2e]/20 transition-all duration-300 font-sans">
          
          {/* Stunning Power Service Mockup Floating Plastic Card */}
          <div className="relative aspect-[1.58/1] w-full max-w-[340px] mx-auto rounded-[10px] p-5 text-white overflow-hidden shadow-[0_15px_30px_rgba(235,122,46,0.25)] bg-gradient-to-tr from-[#6b11ff] via-[#eb7a2e] to-[#fbbf24] select-none hover:scale-[1.02] active:scale-[0.99] transition-all duration-300">
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-white/10 to-transparent rounded-full pointer-events-none" />
            
            {/* Hologram card chip & Power Service brand */}
            <div className="flex items-start justify-between">
              {/* Chip container with stylized metallic grid */}
              <div className="w-10 h-7 rounded-[10px] bg-gradient-to-br from-amber-200 via-amber-300 to-amber-100 p-1 flex flex-col justify-between border border-amber-400/30 opacity-90 shadow-md">
                <div className="border-b border-amber-600/20 h-2 w-full" />
                <div className="grid grid-cols-2 gap-1 h-3">
                  <div className="border-r border-amber-600/20" />
                  <div className="border-l border-amber-600/20" />
                </div>
              </div>
              <span className="text-base font-extrabold tracking-tight italic select-none">Power Service</span>
            </div>

            {/* Card number sequence (Mockup styling) */}
            <div className="mt-8">
              <div className="grid grid-cols-4 gap-2 text-sm font-semibold tracking-widest font-mono text-white/95">
                <span>9648</span>
                <span>3500</span>
                <span>9208</span>
                <span>8180</span>
              </div>
            </div>

            {/* Bottom info: Card Balance and MasterCard Circles logo */}
            <div className="flex items-end justify-between mt-6">
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-widest text-white/70 font-bold">Thẻ Thành Viên</p>
                <p className="text-xl font-extrabold tracking-tight font-heading">$ {walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              
              {/* MasterCard overlapping circles mockup */}
              <div className="flex -space-x-2 opacity-90 scale-95 shrink-0">
                <div className="w-7 h-7 rounded-full bg-white/20 select-none backdrop-blur-xs flex items-center justify-center border border-white/10" />
                <div className="w-7 h-7 rounded-full bg-[#eb7a2e]/90 select-none border border-[#eb7a2e]/20" />
                <div className="w-7 h-7 rounded-full bg-[#fbbf24]/90 select-none border border-[#fbbf24]/20" />
              </div>
            </div>
          </div>

          {/* Transactions Action Block wrapper */}
          <div className="flex flex-col gap-4 text-left flex-1">
            <h3 className="text-sm font-extrabold text-[#131924] dark:text-white uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <Coins className="w-4 h-4 text-[#eb7a2e]" /> 
              <span>Transactions</span>
            </h3>

            {/* Selection Toggles (Send vs Apply for) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-[10px] border border-slate-200/50 dark:border-slate-800">
              <button 
                type="button"
                onClick={() => setActiveWalletAction("send")}
                className={`py-2 px-4 rounded-[10px] text-xs font-black transition-all cursor-pointer ${activeWalletAction === 'send' ? 'bg-[#131924] text-white dark:bg-white dark:text-[#131924] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Send
              </button>
              <button 
                type="button"
                onClick={() => {
                  setActiveWalletAction("apply");
                  toast.info("Tính năng đăng ký hạn mức thẻ tín dụng (Apply for Limit) hiện đang thuộc giai đoạn thử nghiệm bảo mật.");
                }}
                className={`py-2 px-4 rounded-[10px] text-xs font-black transition-all cursor-pointer ${activeWalletAction === 'apply' ? 'bg-[#131924] text-white dark:bg-white dark:text-[#131924] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Apply for
              </button>
            </div>

            {/* SEND TRANSACTION INTERFACE FORM */}
            <form onSubmit={handleWalletSubmit} className="space-y-4">
              
              {/* Pay to input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Pay to (Mã ví / Số tài khoản)</label>
                <input 
                  type="text" 
                  value={payToAddress}
                  onChange={(e) => setPayToAddress(e.target.value)}
                  placeholder="Nhập mã ví nhận..."
                  className="w-full px-4 py-3 text-xs font-bold rounded-[10px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Please enter the Wallet ID or destination email.</span>
              </div>

              {/* Amount & Reason Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Amount ($)</label>
                  <input 
                    type="number" 
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    min="1"
                    className="w-full px-4 py-3 text-xs font-bold rounded-[10px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Reason</label>
                  <select
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full px-3 py-3 text-xs font-bold rounded-[10px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
                    required
                  >
                    <option value="Games">Games</option>
                    <option value="Rentals">Rentals</option>
                    <option value="Services">Services</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>
              </div>

              {/* Commission breakdown */}
              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span>Commission:</span>
                  <span className="text-slate-800 dark:text-slate-250 font-extrabold">$3</span>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span>Total:</span>
                  <span className="text-[#eb7a2e] font-black">${transferAmount + 3}</span>
                </div>
              </div>

              {/* Dynamic submit action with pink gradient */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-[10px] text-xs font-black text-white hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all bg-gradient-to-r from-[#eb7a2e] to-[#7c3aed]"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 3: SERVICE QUICK ACCESS BLOCKS */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
          
          {/* Quick Item 1: Pay Services */}
          <button 
            type="button"
            onClick={() => toast.success("Hiện tại không có hóa đơn quá hạn cần nộp thanh toán.")}
            className="bg-card w-full rounded-[10px] p-5 border border-border/85 shadow-sm hover:shadow-md hover:border-[#eb7a2e]/25 hover:translate-y-[-2px] transition-all duration-300 text-left flex flex-col items-center justify-center gap-3 relative group"
          >
            <div className="w-14 h-14 rounded-[10px] bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-all">
              {/* Custom styled vector lines of check and bill */}
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-[#131924] dark:text-white">Pay Services</h4>
              <p className="text-[10px] text-slate-400 mt-1">Thanh toán hóa đơn điện, nước, internet nhanh gọn</p>
            </div>
          </button>

          {/* Quick Item 2: Recharge Cell */}
          <button 
            type="button"
            onClick={() => toast.success("Cổng nạp tiền di động đa mạng Việt Nam/Quốc tế đang tải...")}
            className="bg-card w-full rounded-[10px] p-5 border border-border/85 shadow-sm hover:shadow-md hover:border-[#eb7a2e]/25 hover:translate-y-[-2px] transition-all duration-300 text-left flex flex-col items-center justify-center gap-3 relative group"
          >
            <div className="w-14 h-14 rounded-[10px] bg-[#eb7a2e]/10 flex items-center justify-center text-[#eb7a2e] group-hover:scale-105 transition-all">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-[#131924] dark:text-white">Recharge Cell</h4>
              <p className="text-[10px] text-slate-400 mt-1">Bắn tiền điện thoại trực tiếp mọi nhà mạng</p>
            </div>
          </button>

          {/* Quick Item 3: Power Service cards */}
          <button 
            type="button"
            onClick={() => toast.success("Đang truy xuất thông tin phát hành các hạng thẻ vật lý...")}
            className="bg-card w-full rounded-[10px] p-5 border border-border/85 shadow-sm hover:shadow-md hover:border-[#eb7a2e]/25 hover:translate-y-[-2px] transition-all duration-300 text-left flex flex-col items-center justify-center gap-3 relative group"
          >
            <div className="w-14 h-14 rounded-[10px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#131924] dark:text-white group-hover:scale-105 transition-all">
              <LucideCreditCard className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-[#131924] dark:text-white font-heading">Power Service cards</h4>
              <p className="text-[10px] text-slate-400 mt-1">Đổi thưởng thành viên lấy thẻ ghi nợ vật lý cực sang</p>
            </div>
          </button>
        </div>
      </div>
      
      {/* ================= END Power Service PREMIUM WORKSPACE ================= */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full xl:col-span-2 space-y-4">
          <DatabaseStatus />
          <CustomerTierPieChart customers={allCustomers} tiers={tiers} />
        </div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="col-span-4 lg:col-span-3 xl:col-span-3"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
          <CardHeader className="text-left">
            <CardTitle>Biểu đồ Doanh thu</CardTitle>
            <CardDescription className="text-xs">
              Thống kê doanh số chu kỳ {daysDiff} ngày ({formatRangeText()})
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredRevenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000000)
                        return `${(value / 1000000000).toLocaleString("vi-VN")}T`;
                      if (value >= 1000000)
                        return `${(value / 1000000).toLocaleString("vi-VN")}Tr`;
                      return value.toLocaleString("vi-VN");
                    }}
                  />
                  <Tooltip
                    wrapperClassName="rounded-[10px] border shadow-lg bg-card text-card-foreground"
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                    cursor={{ stroke: "var(--color-border)" }}
                    formatter={(value: number) => [
                      formatCurrency(value, currentCurrency),
                      "Doanh thu",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="col-span-3 lg:col-span-4 xl:col-span-2"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
          <CardHeader className="text-left">
            <CardTitle>Khách hàng VIP gần đây</CardTitle>
            <CardDescription>
              Những khách hàng hạng cao nhất gia nhập chu kỳ này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Hạng</TableHead>
                  <TableHead className="text-right">Chi tiêu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecentCustomers.length > 0 ? (
                  filteredRecentCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/40 transition-colors duration-200">
                      <TableCell className="font-medium text-left">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge
                          variant={
                            customer.tier === "Atelier"
                              ? "default"
                              : customer.tier === "Icon"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            customer.tier === "Atelier"
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }
                        >
                          {customer.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(customer.spent.replace(/[^0-9]/g, '')) || 0, currentCurrency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-xs text-muted-foreground py-8"
                    >
                      Không có khách hàng nào thuộc hạng này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#2f6cf5] to-[#1e4db7] text-white rounded-[10px] p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Trophy className="w-48 h-48 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       <Trophy className="w-5 h-5 text-amber-300" /> Bảng xếp hạng khách hàng
                    </h3>
                    <p className="text-xs text-white/70 mt-1">Top 10 khách hàng có chi tiêu tích lũy cao nhất.</p>
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">Live</div>
               </div>

               <div className="grid grid-cols-1 gap-2">
                  {topPerformers.map((customer, i) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-white/10 rounded-[10px] hover:bg-white/15 transition-colors group">
                       <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-[10px] text-[10px] font-bold",
                            i === 0 ? "bg-amber-400 text-amber-950" : 
                            i === 1 ? "bg-slate-300 text-slate-900" :
                            i === 2 ? "bg-amber-600 text-white" : "bg-white/20 text-white"
                          )}>
                             {i + 1}
                          </span>
                          <div>
                             <p className="text-sm font-bold truncate max-w-[120px]">{customer.name}</p>
                             <p className="text-[10px] text-white/60">Hạng: {customer.tier || 'Member'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(Number(customer.customFields?.spend) || 0, currentCurrency)}</p>
                          <p className="text-[10px] text-white/70">{customer.points || 0} pts</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </motion.div>

         <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-6">
            <RecentActivity />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <UpcomingBirthdays />
               <TierUpProgress />
            </div>
         </div>
      </div>

      {/* Quick Action Overlay Modals */}
      <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
        <DialogContent className="max-w-md bg-card border border-border p-6 rounded-[10px] shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-[10px]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Thêm khách hàng nhanh</h3>
                <p className="text-xs text-muted-foreground">Tích hợp tức thì với CRM & dữ liệu VIP</p>
              </div>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Email</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Cấp bậc</label>
                  <select
                    value={newCustTier}
                    onChange={(e) => setNewCustTier(e.target.value)}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="Essential">Essential (Bạc)</option>
                    <option value="Icon">Icon (Vàng)</option>
                    <option value="Atelier">Atelier (Kim Cương)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Điểm nạp ban đầu</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustPoints}
                    onChange={(e) => setNewCustPoints(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-[10px] text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-bold transition-all shadow-md shadow-[#2f6cf5]/20 cursor-pointer"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLaunchCampaignModal} onOpenChange={setShowLaunchCampaignModal}>
        <DialogContent className="max-w-md bg-card border border-border p-6 rounded-[10px] shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="p-2 bg-[#2f6cf5]/10 text-[#2f6cf5] rounded-[10px]">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Khởi chạy chiến dịch mới</h3>
                <p className="text-xs text-muted-foreground">Kích hoạt nhân điểm loyalty cho thành viên</p>
              </div>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Tên chiến dịch</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lễ hội ngọc bích x2 điểm"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Hệ số nhân điểm</label>
                  <select
                    value={newCampMultiplier}
                    onChange={(e) => setNewCampMultiplier(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="1.5">x1.5 Điểm tích lũy</option>
                    <option value="2.0">x2.0 Điểm vàng</option>
                    <option value="2.5">x2.5 Diamond Special</option>
                    <option value="3.0">x3.0 Supreme</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Thời hạn chiến dịch</label>
                  <select
                    value={newCampDays}
                    onChange={(e) => setNewCampDays(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="3">3 ngày ngắn hạn</option>
                    <option value="7">1 tuần lễ (7 ngày)</option>
                    <option value="14">2 tuần (14 ngày)</option>
                    <option value="30">1 tháng (30 ngày)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">Đối tượng áp dụng</label>
                <select
                  value={newCampTarget}
                  onChange={(e) => setNewCampTarget(e.target.value)}
                  className="w-full bg-background border border-border rounded-[10px] text-xs px-3.5 py-2.5 outline-none font-semibold focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="Tất cả thành viên">Tất cả hạng thành viên (All)</option>
                  <option value="Chỉ từ hạng Vàng trở lên">Thành viên Thường Xuyên (Icon+)</option>
                  <option value="Độc quyền Diamond Elite">Chỉ dành riêng cho Elite / Atelier</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLaunchCampaignModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-[10px] text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-bold transition-all shadow-md shadow-[#2f6cf5]/20 cursor-pointer"
                >
                  Kích hoạt ngay
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Quick Actions Menu */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 group">
        <div className="flex flex-col gap-2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 origin-bottom-right mb-2">
           <button 
             onClick={() => setShowAddCustomerModal(true)}
             className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border shadow-md rounded-full hover:bg-muted font-bold text-xs transition-colors text-foreground whitespace-nowrap cursor-pointer">
             <UserPlus className="w-4 h-4 text-emerald-500" /> Thêm khách hàng mới
           </button>
           <button 
             onClick={() => setShowLaunchCampaignModal(true)}
             className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border shadow-md rounded-full hover:bg-muted font-bold text-xs transition-colors text-foreground whitespace-nowrap cursor-pointer">
             <Megaphone className="w-4 h-4 text-amber-500" /> Khởi chạy Campaign
           </button>
           <button 
             onClick={handlePrintLoyaltyReport}
             className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border shadow-md rounded-full hover:bg-muted font-bold text-xs transition-colors text-foreground whitespace-nowrap cursor-pointer">
             <Printer className="w-4 h-4 text-[#2f6cf5]" /> In báo cáo Loyalty
           </button>
        </div>
        <button className="h-14 w-14 rounded-full bg-[#2f6cf5] text-white shadow-lg flex items-center justify-center hover:bg-[#2f6cf5]/90 hover:scale-105 transition-all shadow-[#2f6cf5]/30 cursor-pointer">
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-45 duration-300" />
        </button>
      </div>
    </div>
  );
}
