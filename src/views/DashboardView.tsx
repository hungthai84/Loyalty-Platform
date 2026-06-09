import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { kpiData, revenueData, recentCustomers } from "@/data/mockData";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/components/FirebaseProvider";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
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
  RotateCcw,
  LayoutDashboard,
  Database,
  Send,
  Smartphone,
  CreditCard as LucideCreditCard,
  Plus,
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
  HelpCircle
} from "lucide-react";
import * as motion from "motion/react-client";
import { DatabaseStatus } from "@/components/layout/DatabaseStatus";
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
  const [totalCustomers, setTotalCustomers] = useState(24);
  const [activeCampaigns, setActiveCampaigns] = useState(4);
  const [loyaltyPointsIssued, setLoyaltyPointsIssued] = useState(1200000);

  useEffect(() => {
    if (!user || user.isLocal) {
      // Local Guest storage fallback
      const localStr = localStorage.getItem("crm_guest_customers");
      if (localStr) {
        try {
          const list = JSON.parse(localStr);
          setTotalCustomers(list.length || 24);
          const pts = list.reduce((acc: number, c: any) => acc + (c.points || 0), 0);
          setLoyaltyPointsIssued(pts || 120000);
        } catch (e) {
          console.error(e);
        }
      }

      // Listen to event for guest changes
      const handleGuestChange = () => {
        const localStr2 = localStorage.getItem("crm_guest_customers");
        if (localStr2) {
          try {
            const list = JSON.parse(localStr2);
            setTotalCustomers(list.length || 24);
            const pts = list.reduce((acc: number, c: any) => acc + (c.points || 0), 0);
            setLoyaltyPointsIssued(pts || 120000);
          } catch (e) {
            console.error(e);
          }
        }
      };
      window.addEventListener("crm_guest_data_changed", handleGuestChange);
      return () => window.removeEventListener("crm_guest_data_changed", handleGuestChange);
    } else {
      // Firestore Real-Time listeners!
      const unsubscribeCust = onSnapshot(collection(db, "customers"), (snap) => {
        const count = snap.size;
        setTotalCustomers(count || 0);

        let sumPts = 0;
        snap.docs.forEach((doc) => {
          sumPts += doc.data().points || 0;
        });
        setLoyaltyPointsIssued(sumPts || 0);
      }, (err) => {
        console.error("Firestore customers KPI listener error:", err);
      });

      const unsubscribeCamp = onSnapshot(collection(db, "loyalty_campaigns"), (snap) => {
        const activeCount = snap.docs.filter(doc => doc.data().isActive === true).length;
        setActiveCampaigns(activeCount || 0);
      }, (err) => {
        console.error("Firestore campaigns KPI listener error:", err);
      });

      return () => {
        unsubscribeCust();
        unsubscribeCamp();
      };
    }
  }, [user]);

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

  // Stat Recalculations for KPIs based on date interval and tier
  const filteredKpis = useMemo(() => {
    if (activePreset === "all") {
      return kpiData.map((kpi, idx) => {
        if (idx === 0) {
          // Revenue
          const origVal = 105700000000;
          const newVal = origVal * tierFactor;
          return {
            ...kpi,
            value: `${(newVal / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tỷ ₫`,
          };
        }
        if (idx === 1) {
          // Active customers
          const origVal = 24591;
          const newVal = Math.floor(origVal * tierFactor);
          return { ...kpi, value: newVal.toLocaleString("vi-VN") };
        }
        if (idx === 3) {
          // points
          const origVal = 1200000;
          const newVal = Math.floor(origVal * tierFactor);
          return {
            ...kpi,
            value: `${(newVal / 1000).toFixed(1).replace(".", ",")}k pts`,
          };
        }
        return kpi;
      });
    }

    // Daily revenue average = 88,000,000 VNĐ
    const revenueVal = daysDiff * 88000000 * tierFactor;
    let formattedRevenue = "";
    if (revenueVal >= 1000000000) {
      formattedRevenue = `${(revenueVal / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tỷ ₫`;
    } else {
      formattedRevenue = `${(revenueVal / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr ₫`;
    }

    // Daily guest onboarding active pool
    const activeCust = Math.min(
      24591,
      Math.max(10, Math.floor((50 + daysDiff * 14.5) * tierFactor)),
    );
    const formattedActiveCust = activeCust.toLocaleString("vi-VN");

    // Repeat rate percentage fluctuates based on size
    let repeatRate = "68%";
    let repeatChange = "+2.1%";
    let repeatPositive = true;
    if (activePreset === "today") {
      repeatRate = selectedTier === "Atelier" ? "88%" : "74%";
      repeatChange = "+4.8%";
    } else if (activePreset === "7days") {
      repeatRate = selectedTier === "Atelier" ? "82%" : "71%";
      repeatChange = "+1.8%";
    } else if (activePreset === "30days") {
      repeatRate = selectedTier === "Atelier" ? "79%" : "68.5%";
      repeatChange = "+2.4%";
    } else {
      const seed =
        (daysDiff % 6) * 0.35 +
        (selectedTier === "Atelier"
          ? 12
          : selectedTier === "Icon"
            ? 7
            : 0);
      repeatRate = `${(66.2 + seed).toFixed(1).replace(".", ",")}%`;
      repeatChange =
        seed >= 0
          ? `+${seed.toFixed(1).replace(".", ",")}%`
          : `${seed.toFixed(1).replace(".", ",")}%`;
      repeatPositive = seed >= 0;
    }

    // Point Redemptions
    const pointsRedeemed = Math.min(
      1200000,
      Math.floor(daysDiff * 2420 * tierFactor),
    );
    let formattedPoints = "";
    if (pointsRedeemed >= 1000000) {
      formattedPoints = `${(pointsRedeemed / 1000000).toFixed(1).replace(".", ",")}M pts`;
    } else if (pointsRedeemed >= 1000) {
      formattedPoints = `${(pointsRedeemed / 1000).toFixed(1).replace(".", ",")}k pts`;
    } else {
      formattedPoints = `${pointsRedeemed} pts`;
    }

    const revenueChange =
      activePreset === "today"
        ? "+8.5%"
        : activePreset === "7days"
          ? "+4.2%"
          : "+12.5%";
    const activeCustChange =
      activePreset === "today"
        ? "+0.3%"
        : activePreset === "7days"
          ? "+1.4%"
          : "+5.2%";
    const pointsChange = activePreset === "today" ? "+2.9%" : "-4.5%";
    const formattedPointsIssued = loyaltyPointsIssued >= 1000000 
      ? `${(loyaltyPointsIssued / 1000000).toFixed(1).replace(".", ",")}M pts`
      : loyaltyPointsIssued >= 1000 
        ? `${(loyaltyPointsIssued / 1000).toFixed(1).replace(".", ",")}k pts`
        : `${loyaltyPointsIssued} pts`;

    return [
      {
        label: "Thành viên hoạt động",
        value: totalCustomers.toLocaleString("vi-VN"),
        change: activeCustChange,
        positive: true,
      },
      {
        label: "Tổng doanh thu",
        value: formattedRevenue,
        change: revenueChange,
        positive: true,
      },
      {
        label: "LTV Trung bình",
        value: `${(65000000 * tierFactor / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr ₫`,
        change: "+3.4%",
        positive: true,
      },
      {
        label: "Điểm Loyalty đã cấp",
        value: formattedPointsIssued,
        change: "+15.7%",
        positive: true,
      },
    ];
  }, [daysDiff, activePreset, selectedTier, tierFactor, totalCustomers, activeCampaigns, loyaltyPointsIssued]);

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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="relative z-30 flex w-full flex-col justify-between gap-5 rounded-[10px] border border-border/60 bg-card/45 p-5 shadow-xs transition-all backdrop-blur-md md:flex-row md:items-center md:p-6 hover:shadow-md hover:border-primary/25"
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
              <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                Tổng quan
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Số liệu thống kê và thông tin tổng quan hệ thống.
            </p>
          </div>
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
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-primary/95 shadow-sm"
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
              className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-muted/50 text-foreground border border-border rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
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
                          className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg text-left transition-all cursor-pointer flex items-center justify-between ${
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
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer animate-in fade-in duration-200"
              id="clear-filters-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <div className="flex items-center">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 mr-0.5" />
              <span>Đã kết nối Firestore</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <WifiOff className="w-3.5 h-3.5 mr-0.5" />
              <span>Mất kết nối Firestore (Ngoại tuyến)</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredKpis.map((kpi, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                {kpi.label.includes("doanh thu") && <LucideCreditCard className="h-4 w-4 text-emerald-500/60" />}
                {kpi.label.includes("khách hàng") && <User className="h-4 w-4 text-[#2f6cf5]" />}
                {kpi.label.includes("Chiến dịch") && <Award className="h-4 w-4 text-amber-500/60" />}
                {kpi.label.includes("Điểm Loyalty") && <Coins className="h-4 w-4 text-[#eb7a2e]/60" />}
              </CardHeader>
              <CardContent className="text-left">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p
                  className={`text-xs flex items-center mt-1 ${kpi.positive ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {kpi.positive ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {kpi.change} so với chu kỳ trước
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================= Power Service PREMIUM DIGITAL WALLET WORKSPACE (MOCKUP ACCURACY) ================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
        
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
                <Plus className="w-3 h-3 text-emerald-500" />
                <span>+ $ 2,319.00</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold">
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
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-lg transition-all"
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
                <p className="font-mono text-[10px] break-all bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 text-left select-all">
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
                  <div className="p-2 bg-[#eb7a2e]/10 text-[#eb7a2e] rounded-xl">
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
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Key</p>
                    <p className="text-[10px] text-slate-400">•••• •••• ••••</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => toast.info("Vui lòng truy cập trang cấu hình bảo mật hệ thống để sửa khóa mã hóa.")}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-all shadow-xs"
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
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-100 p-1 flex flex-col justify-between border border-amber-400/30 opacity-90 shadow-md">
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
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${activeWalletAction === 'send' ? 'bg-[#131924] text-white dark:bg-white dark:text-[#131924] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Send
              </button>
              <button 
                type="button"
                onClick={() => {
                  setActiveWalletAction("apply");
                  toast.info("Tính năng đăng ký hạn mức thẻ tín dụng (Apply for Limit) hiện đang thuộc giai đoạn thử nghiệm bảo mật.");
                }}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${activeWalletAction === 'apply' ? 'bg-[#131924] text-white dark:bg-white dark:text-[#131924] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
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
                  className="w-full px-4 py-3 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
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
                    className="w-full px-4 py-3 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Reason</label>
                  <select
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full px-3 py-3 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#eb7a2e]/20 text-slate-800 dark:text-slate-100"
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
        <div className="col-span-full xl:col-span-2">
          <DatabaseStatus />
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
                    wrapperClassName="rounded-xl border shadow-lg bg-card text-card-foreground"
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                    cursor={{ stroke: "var(--color-border)" }}
                    formatter={(value: number) => [
                      new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(value),
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
                        {customer.spent}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="xl:col-span-2"
        >
          <RecentActivity />
        </motion.div>
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="xl:col-span-1 space-y-6"
        >
          <UpcomingBirthdays />
          <TierUpProgress />
        </motion.div>
      </div>

      {/* Floating Quick Actions Menu */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 group">
        <div className="flex flex-col gap-2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 origin-bottom-right mb-2">
           <button 
             onClick={() => toast.success("Mở form thêm điểm...")}
             className="flex items-center gap-2 px-4 py-2 bg-card border border-border shadow-md rounded-full hover:bg-muted font-semibold text-sm transition-colors text-foreground whitespace-nowrap cursor-pointer">
             <Plus className="w-4 h-4 text-emerald-500" /> Thêm điểm Loyalty
           </button>
           <button 
             onClick={() => toast.success("Mở công cụ gửi khuyến mãi...")}
             className="flex items-center gap-2 px-4 py-2 bg-card border border-border shadow-md rounded-full hover:bg-muted font-semibold text-sm transition-colors text-foreground whitespace-nowrap cursor-pointer">
             <Send className="w-4 h-4 text-[#2f6cf5]" /> Gửi Promotion
           </button>
        </div>
        <button className="h-14 w-14 rounded-full bg-[#2f6cf5] text-white shadow-lg flex items-center justify-center hover:bg-[#2f6cf5]/90 hover:scale-105 transition-all shadow-[#2f6cf5]/30 cursor-pointer">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
