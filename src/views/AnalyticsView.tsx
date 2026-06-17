import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
 Card, 
 CardContent, 
 CardHeader, 
 CardTitle, 
 CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
 BarChart, 
 Bar, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 LineChart,
 Line,
 PieChart,
 Pie,
 Cell,
 Legend
} from "recharts";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { ChurnRiskList } from "@/components/analytics/ChurnRiskList";
import { 
  TrendingUp, 
  Users, 
 Gift, 
 Activity,
 ArrowUpRight,
 ArrowDownRight,
 Sparkles,
 Compass,
 HelpCircle,
 Gem,
 Award,
 Zap,
 Trophy,
 CheckCircle2,
 Calendar,
 ChevronDown
} from "lucide-react";
import * as motion from "motion/react-client";
import { Filter } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Customer, TierConfig } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getGuestTiers, getGuestCustomers } from "@/data/guestData";
import { formatCurrency, getCurrency } from "@/lib/currency";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Clock, Send, Coins, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { BespokeSimulator } from "@/components/loyalty/BespokeSimulator";

const SUGGESTIONS_MAP: Record<string, {
  vibe: string;
  items: string[];
  conversion: string;
  projectedValue: string;
  insight: string;
  color: string;
}> = {
  classic: {
    vibe: "Classic Elegant (Cổ điển & Thanh lịch)",
    items: [
      "Kiềng vàng di sản khắc vân mây (Heritage Gold Choker)",
      "Nhẫn vàng phượng hoàng đính Ruby (Phoenix Ruby Gold Ring)",
      "Khuyên tai ngọc trai hạt tròn quý phái (Classic Round Pearl Drop)"
    ],
    conversion: "85%",
    projectedValue: "120.000.000 ₫",
    insight: "Khách hàng đặc biệt ưu chuộng thiết kế đối xứng, mang âm hưởng di sản văn hóa Việt cổ kết hợp chất vàng tinh khiết 18K/24K vững bền.",
    color: "from-amber-500/10 to-amber-600/5 text-amber-500 border-amber-500/20"
  },
  minimalist: {
    vibe: "Minimalist Sophistication (Tối giản & Tinh tế)",
    items: [
      "Vòng tay Platinum mảnh thanh lịch (Minimalist Platinum Bangle)",
      "Nhẫn kim cương Solitaire giác cắt tròn (Brilliant Cut Solitaire Diamond Ring)",
      "Dây chuyền hạt cườm bạc ý tinh giản (Simple Elegant Italian Beads Chain)"
    ],
    conversion: "72%",
    projectedValue: "45.000.000 ₫",
    insight: "Phong cách tối giản chú trọng đường nét hình học sắc sảo, chất liệu Bạch kim hoặc Vàng trắng thanh khiết, không rườm rà hoa mỹ.",
    color: "from-slate-400/15 to-slate-500/5 text-slate-400 border-slate-400/20"
  },
  glamorous: {
    vibe: "Luxury Glamour (Sang trọng & Quý phái)",
    items: [
      "Vòng cổ kim cương đại công nương (Grand Duchess Multi-Tier Diamond Necklace)",
      "Nhẫn kim cương Emerald xanh ngọc lục bảo hoàng gia (Royal Emerald-Cut Ring)",
      "Lắc tay kim cương đính đá Sapphire đại dương (Blue Ocean Sapphire & Diamond Bracelet)"
    ],
    conversion: "90%",
    projectedValue: "350.000.000 ₫",
    insight: "Tệp quý cô thượng lưu đặc biệt yêu thích các điểm nhấn hào quang lộng lẫy từ Kim cương nước D giác cắt lớn kết hợp Ngọc lục bảo, Lam ngọc.",
    color: "from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20"
  },
  "avant-garde": {
    vibe: "Avant-Garde/Experimental (Phá cách & Cá tính)",
    items: [
      "Khuyên tai Gothic chạm khắc đầu rồng vàng trắng (Gothic Dragon Head White Gold Drop)",
      "Nhẫn Signet bạc dập lửa gai góc (Alternative Thorns Signet Sterling Silver)",
      "Vòng cổ luồn dây xích thô phá cách (Brutalist Industrial Metal Bold Chain)"
    ],
    conversion: "65%",
    projectedValue: "85.000.000 ₫",
    insight: "Phong cách độc bản đề cao cấu trực bất đối xứng, chạm khắc phong sương, các họa tiết trừu tượng thô mộc đầy gai góc, nghệ thuật.",
    color: "from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20"
  },
  romantic: {
    vibe: "Romantic & Gentle (Lãng mạn & Dịu dàng)",
    items: [
      "Mặt dây chuyền hoa anh đào vàng hồng đính thạch anh (Cherry Blossom Rose Gold Pendant)",
      "Nhẫn đính hôn kết vòng dây leo hoa cỏ mộng mơ (Whimsical Botanical Vine Ring)",
      "Khuyên tai giọt nước ngọc trai hồng biển cả (Pink Akoya Pearl Drop Earring)"
    ],
    conversion: "78%",
    projectedValue: "60.000.000 ₫",
    insight: "Ưa chuộng cấu hình uốn lượn thướt tha mềm mại của Vàng hồng ấm áp, đính ngọc trai hồng Akoya hoặc thạch anh tóc đỏ đầy thơ mộng.",
    color: "from-pink-500/10 to-pink-600/5 text-pink-400 border-pink-500/20"
  }
};

const trendData = [
 { month: "T1", tích: 4500, đổi: 2100 },
 { month: "T2", tích: 5200, đổi: 2800 },
 { month: "T3", tích: 4800, đổi: 3200 },
 { month: "T4", tích: 6100, đổi: 3800 },
 { month: "T5", tích: 5500, đổi: 4100 },
 { month: "T6", tích: 6700, đổi: 4500 },
];

const signupsData = [
  { day: "08/05", signups: 12 }, { day: "09/05", signups: 15 }, { day: "10/05", signups: 9 },
  { day: "11/05", signups: 14 }, { day: "12/05", signups: 18 }, { day: "13/05", signups: 22 },
  { day: "14/05", signups: 25 }, { day: "15/05", signups: 19 }, { day: "16/05", signups: 21 },
  { day: "17/05", signups: 16 }, { day: "18/05", signups: 30 }, { day: "19/05", signups: 28 },
  { day: "20/05", signups: 24 }, { day: "21/05", signups: 18 }, { day: "22/05", signups: 15 },
  { day: "23/05", signups: 20 }, { day: "24/05", signups: 26 }, { day: "25/05", signups: 35 },
  { day: "26/05", signups: 42 }, { day: "27/05", signups: 38 }, { day: "28/05", signups: 31 },
  { day: "29/05", signups: 25 }, { day: "30/05", signups: 29 }, { day: "31/05", signups: 34 },
  { day: "01/06", signups: 40 }, { day: "02/06", signups: 45 }, { day: "03/06", signups: 50 },
  { day: "04/06", signups: 48 }, { day: "05/06", signups: 55 }, { day: "06/06", signups: 62 },
];


const popularRewardsData = [
  { name: "Voucher 500k", count: 145 },
  { name: "Trang sức Bạc", count: 98 },
  { name: "Vệ sinh SP", count: 86 },
  { name: "Voucher 1tr", count: 54 },
  { name: "Quà tặng VIP", count: 32 },
];

const tierData = [
 { name: "Member", value: 450, color: "#94a3b8" },
 { name: "Essential", value: 300, color: "#10b981" },
 { name: "Icon", value: 120, color: "#f59e0b" },
 { name: "Atelier", value: 45, color: "#2f6cf5" },
];

const heatmapHours = ["8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h"];
const heatmapData = [
  { day: 'T2', values: [1, 2, 5, 8, 4, 3, 2, 7, 15, 12, 10, 5, 2, 1] },
  { day: 'T3', values: [0, 1, 3, 5, 4, 2, 1, 6, 12, 10, 8, 4, 1, 0] },
  { day: 'T4', values: [2, 3, 6, 7, 5, 4, 3, 8, 16, 14, 12, 6, 3, 1] },
  { day: 'T5', values: [1, 2, 4, 6, 4, 3, 2, 5, 14, 11, 9, 3, 2, 1] },
  { day: 'T6', values: [3, 4, 8, 12, 8, 5, 4, 10, 20, 18, 15, 8, 5, 2] },
  { day: 'T7', values: [5, 8, 12, 18, 15, 12, 10, 15, 25, 22, 18, 10, 6, 3] },
  { day: 'CN', values: [4, 6, 10, 15, 12, 10, 8, 12, 22, 18, 14, 8, 4, 2] },
];

 export function AnalyticsView() {
  const { user } = useFirebase();
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>("classic");
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [progressionCustomerId, setProgressionCustomerId] = useState<string>("");
  const [clvPeriod, setClvPeriod] = useState<"week" | "month" | "quarter">("month");
  const [clvCompare, setClvCompare] = useState<boolean>(true);
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [reportEmail, setReportEmail] = useState("admin@seva.premium");
  const [currencyConfig, setCurrencyConfig] = useState(getCurrency());

  // Simulator states
  const [simAovValue, setSimAovValue] = useState<number>(750000);
  const [selectedSimTierId, setSelectedSimTierId] = useState<string>("tier-member");
  const [isGlobalMultiplierActive, setIsGlobalMultiplierActive] = useState<boolean>(false);
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(1.2);
  const [globalMultiplierReason, setGlobalMultiplierReason] = useState<string>("Happy Hour / Tháng Sinh Nhật");

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyConfig(getCurrency());
    window.addEventListener('seva-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('seva-currency-changed', handleCurrencyChange);
  }, []);

  // Date Selection States (copied from DashboardView layout style)
  const [startDate, setStartDate] = useState("2026-04-28");
  const [endDate, setEndDate] = useState("2026-05-27");
  const [activePreset, setActivePreset] = useState<string>("30days");
  const [isOpen, setIsOpen] = useState(false);

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

  const currentCurrency = useMemo(() => getCurrency(), [currencyConfig]);

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

  const statCards = useMemo(() => {
    const totalCustCount = dbCustomers.length > 0 ? (1200 + dbCustomers.length) : 1284;
    const pointsIssuedVal = Math.floor((4200000 / 30) * daysDiff);
    let pointsIssuedStr = "";
    if (pointsIssuedVal >= 1000000) {
      pointsIssuedStr = `${(pointsIssuedVal / 1000000).toFixed(1)}M pts`;
    } else {
      pointsIssuedStr = `${pointsIssuedVal.toLocaleString("vi-VN")} pts`;
    }

    const redeemRate = (32.4 + (daysDiff % 5) * 0.15).toFixed(1) + "%";
    
    const revenueVal = Math.floor((1150000000 / 30) * daysDiff);
    let revenueStr = formatCurrency(revenueVal, currentCurrency);

    return [
      { title: "Tổng khách hàng", value: totalCustCount.toLocaleString("vi-VN"), icon: Users, trend: `+${(12.5 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
      { title: "Điểm đã cấp", value: pointsIssuedStr, icon: Activity, trend: `+${(18.2 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
      { title: "Tỷ lệ đổi quà", value: redeemRate, icon: Gift, trend: "-2.1%", positive: false },
      { title: "Doanh thu ước tính", value: revenueStr, icon: TrendingUp, trend: `+${(7.4 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
    ];
  }, [daysDiff, dbCustomers]);

  const filteredSignupsData = useMemo(() => {
    // Generate dates for the range
    const dates: Record<string, number> = {};
    const now = new Date();
    
    // Initialize day counts for the requested diff
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dates[dateStr] = 0;
    }

    // Process real customer records
    dbCustomers.forEach(c => {
      if (!c.createdAt) return;
      
      let createdDate: Date;
      if (typeof (c.createdAt as any).toDate === "function") {
        createdDate = (c.createdAt as any).toDate();
      } else if ((c.createdAt as any).seconds !== undefined) {
        createdDate = new Date((c.createdAt as any).seconds * 1000);
      } else {
        createdDate = new Date(c.createdAt as any);
      }
      
      const dateStr = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dates[dateStr] !== undefined) {
        dates[dateStr]++;
      }
    });

    // Convert to array and sort by date
    const realData = Object.entries(dates).map(([day, count]) => ({
      day,
      signups: count
    })).reverse();

    // If no real data found (e.g. all 0), fall back to mock data but scaled to daysDiff
    const totalRealSignups = realData.reduce((acc, curr) => acc + curr.signups, 0);
    if (totalRealSignups === 0) {
      if (daysDiff <= 30) {
        return signupsData.slice(signupsData.length - daysDiff);
      }
      return signupsData;
    }

    return realData;
  }, [daysDiff, dbCustomers]);

  const tierGrowthData = useMemo(() => {
    const dates: Record<string, any> = {};
    const now = new Date();
    
    // Tier threshold definitions (synced with app logic)
    const getTierStr = (pts: number) => {
      if (pts >= 10000) return "Atelier";
      if (pts >= 2500) return "Icon";
      if (pts >= 500) return "Essential";
      return "Member";
    };

    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dates[dateStr] = { day: dateStr, Member: 0, Essential: 0, Icon: 0, Atelier: 0 };
    }

    // Process customers to see tiers at specific dates
    // For demo purposes, we distribute current tiers based on creation date
    dbCustomers.forEach(c => {
      if (!c.createdAt) return;
      let createdDate: Date;
      if (typeof (c.createdAt as any).toDate === "function") createdDate = (c.createdAt as any).toDate();
      else if ((c.createdAt as any).seconds !== undefined) createdDate = new Date((c.createdAt as any).seconds * 1000);
      else createdDate = new Date(c.createdAt as any);
      
      const dateStr = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const tier = getTierStr(c.points || 0);

      // Backfill: if someone exists today as Icon, they were Member -> Essential -> Icon
      // Simplification: just increment the tier they belong to for that day and all subsequent days
      Object.keys(dates).forEach(dKey => {
        const [day, month] = dKey.split('/').map(Number);
        const loopDate = new Date(now.getFullYear(), month - 1, day);
        if (loopDate >= createdDate) {
          dates[dKey][tier]++;
        }
      });
    });

    return Object.values(dates).reverse();
  }, [daysDiff, dbCustomers]);

  const clvData = useMemo(() => {
    if (clvPeriod === "week") {
      return [
        { label: "T2", current: 15200000, prev: 12100000 },
        { label: "T3", current: 16500000, prev: 13500000 },
        { label: "T4", current: 19800000, prev: 14200000 },
        { label: "T5", current: 17600000, prev: 15400000 },
        { label: "T6", current: 24100000, prev: 18600000 },
        { label: "T7", current: 28500000, prev: 22000000 },
        { label: "CN", current: 31200000, prev: 24500000 },
      ];
    } else if (clvPeriod === "month") {
      return [
        { label: "Tuần 1", current: 85000000, prev: 72000000 },
        { label: "Tuần 2", current: 92000000, prev: 81000000 },
        { label: "Tuần 3", current: 110000000, prev: 95000000 },
        { label: "Tuần 4", current: 145000000, prev: 112000000 },
      ];
    } else {
      return [
        { label: "Tháng 1", current: 420000000, prev: 350000000 },
        { label: "Tháng 2", current: 480000000, prev: 380000000 },
        { label: "Tháng 3", current: 560000000, prev: 420000000 },
      ];
    }
  }, [clvPeriod]);

 useEffect(() => {
  if (!user || user.isLocal) {
   setTiers(getGuestTiers());
   setDbCustomers(getGuestCustomers());
   return;
  }

  // Load tiers from Firestore
  const unsubTiers = onSnapshot(
   query(collection(db, "tier_configs"), orderBy("threshold", "asc")),
   (snapshot) => {
    setTiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TierConfig)));
   }
  );

  // Load customers from Firestore
  const qCustomers = query(collection(db, "customers"));
  const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
   setDbCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
  });

  return () => {
   unsubTiers();
   unsubCustomers();
  };
 }, [user]);

 useEffect(() => {
  if (dbCustomers.length > 0 && !progressionCustomerId) {
   setProgressionCustomerId(dbCustomers[0].id);
  }
 }, [dbCustomers, progressionCustomerId]);

 // Filter segment size
 const matchingCustomersCount = useMemo(() => {
  const liveMatch = dbCustomers.filter((c) => c.customFields?.fashionStyle === selectedSegment);
  const baseOffsets: Record<string, number> = {
   classic: 142,
   minimalist: 98,
   glamorous: 64,
   "avant-garde": 33,
    romantic: 78
   };
   return (baseOffsets[selectedSegment] || 25) + liveMatch.length;
  }, [dbCustomers, selectedSegment]);

  const predictedSpendData = [
   { month: "Tháng 7", spend: 42000000, confidence: 95 },
   { month: "Tháng 8", spend: 48000000, confidence: 92 },
   { month: "Tháng 9", spend: 55000000, confidence: 88 },
   { month: "Tháng 10", spend: 62000000, confidence: 85 },
   { month: "Tháng 11", spend: 74000000, confidence: 80 },
   { month: "Tháng 12", spend: 85000000, confidence: 75 },
  ];

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-[#2f6cf5]/30 p-5 md:p-6 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-[#2f6cf5]/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-[#2f6cf5]/10 rounded-[10px] text-[#2f6cf5] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
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
            <TrendingUp className="w-8 h-8 text-[#2f6cf5]" />
          </motion.div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground font-sans">
            Báo cáo & Thống kê
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi hiệu quả chương trình ưu đãi của bạn.
          </p>
        </div>
      </div>
    </motion.div>
  );

  const actionControls = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card/65 border border-border/80 rounded-3xl backdrop-blur-md">
      <div className="text-left">
        <h3 className="text-base font-bold font-heading text-foreground">
          Bộ lọc báo cáo & Thao tác
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Lọc dữ liệu theo mốc thời gian và xuất các tệp thống kê nội bộ.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Export buttons removed */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 transition-all cursor-pointer shadow-lg shadow-primary/20 focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <Calendar className="w-4 h-4 text-primary-foreground" />
            <span>{formatRangeText()}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-primary-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border/80 shadow-2xl rounded-2xl p-4.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150 font-sans">
                <div className="space-y-4">
                  <div className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Chọn khoảng lọc thời gian</span>
                  </div>

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
                          className={`px-3 py-2 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
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

                  <div className="pt-3.5 border-t border-border/80 space-y-2.5">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest block font-heading">
                      Khoảng ngày tùy chỉnh
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase block text-left">
                          Từ ngày
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            handleCustomDateChange("start", e.target.value)
                          }
                          className="w-full bg-background border border-border/80 rounded-xl p-2 text-xs outline-none focus:border-primary/50 text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase block text-left">
                          Đến ngày
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) =>
                            handleCustomDateChange("end", e.target.value)
                          }
                          className="w-full bg-background border border-border/80 rounded-xl p-2 text-xs outline-none focus:border-primary/50 text-foreground"
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
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-8 font-sans">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      {actionControls}

      <div className="pt-6 space-y-8">
        <div className="mb-8">
          <ChurnRiskList customers={dbCustomers} />
        </div>

        <BespokeSimulator />

        {/* KPI Stats */}
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 {statCards.map((stat, i) => (
 <motion.div
 key={stat.title}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 >
 <Card className="border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden shadow-sm hover:shadow transition-shadow">
 <CardHeader className="flex flex-row items-center justify-between pb-3">
 <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
 {stat.title}
 </CardTitle>
 <div className="p-2 bg-primary/10 rounded-xl text-primary">
  <stat.icon className="h-4 w-4" />
 </div>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-black font-heading tracking-tight drop-shadow-sm">{stat.value}</div>
 <p className="text-xs flex items-center mt-2 font-medium">
 {stat.positive ? (
 <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center mr-2">
 <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stat.trend}
 </span>
 ) : (
 <span className="text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center mr-2">
 <ArrowDownRight className="w-3 h-3 mr-0.5" /> {stat.trend}
 </span>
 )}
 <span className="text-muted-foreground">so với tháng trước</span>
 </p>
 </CardContent>
 </Card>
 </motion.div>
 ))}
 </div>

 <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: 0.15 }}
 >
   <Card className="border-border/50 bg-gradient-to-br from-[#2f6cf5]/5 to-purple-500/5 backdrop-blur-sm shadow-md overflow-hidden relative border-primary/20">
     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32" />
     </div>
     <CardHeader>
       <CardTitle className="font-heading flex items-center gap-2">
         <Gem className="w-5 h-5 text-[#2f6cf5]" /> Loyalty ROI Calculator
       </CardTitle>
       <CardDescription>
         Ước tính hiệu quả kinh tế khi chuyển đổi nhóm khách hàng "At-Risk" thành khách hàng trung thành.
       </CardDescription>
     </CardHeader>
     <CardContent>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="space-y-2">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Khách hàng At-Risk (Ước tính)</p>
           <p className="text-2xl font-black">84 <span className="text-sm font-medium text-muted-foreground">thành viên</span></p>
           <p className="text-[10px] text-amber-500 font-bold">~15% tổng cơ sở khách hàng</p>
         </div>
         <div className="space-y-2">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mục tiêu chuyển đổi (10%)</p>
           <p className="text-2xl font-black text-emerald-500">+ 9 <span className="text-sm font-medium text-muted-foreground">thành viên</span></p>
           <p className="text-[10px] text-muted-foreground font-bold italic">Chiến dịch Win-back tự động</p>
         </div>
         <div className="space-y-2">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tiềm năng doanh thu (Ước tính)</p>
           <p className="text-2xl font-black text-[#2f6cf5]">~ 405.000.000 <span className="text-sm font-medium text-muted-foreground">₫</span></p>
           <p className="text-[10px] text-emerald-500 font-bold">+ 12.4% ARR Potential</p>
         </div>
       </div>
       
       <div className="mt-8 p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#2f6cf5] rounded-xl text-white">
                <Zap className="w-4 h-4" />
             </div>
             <p className="text-xs font-bold">Kích hoạt chiến dịch "Win-back" ngay để tối ưu hóa ROI?</p>
          </div>
          <button className="px-6 py-2 bg-[#2f6cf5] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-[#2f6cf5]/20">
             Khởi chạy chiến dịch
          </button>
       </div>
     </CardContent>
   </Card>
 </motion.div>

 {/* CLV Growth Chart */}
 <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
 >
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
   <div>
    <CardTitle className="font-heading">Biểu đồ tăng trưởng CLV</CardTitle>
    <CardDescription>
     Phân tích giá trị vòng đời khách hàng (Customer Lifetime Value) và xu hướng mua sắm.
    </CardDescription>
   </div>
   <div className="flex flex-wrap items-center gap-3">
    <button className="flex items-center gap-2 border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-muted transition-colors shadow-xs text-foreground cursor-pointer">
     <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
     Tháng 6, 2026 - Tùy chỉnh
     <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
    </button>
    <div className="flex items-center gap-1 bg-background/60 border border-border/60 p-1 rounded-xl shadow-xs">
     <button 
       onClick={() => setClvPeriod("week")}
       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${clvPeriod === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
     >
       Tuần
     </button>
     <button 
       onClick={() => setClvPeriod("month")}
       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${clvPeriod === "month" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
     >
       Tháng
     </button>
     <button 
       onClick={() => setClvPeriod("quarter")}
       className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${clvPeriod === "quarter" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
     >
       Quý
     </button>
    </div>
    
    <label className="flex items-center gap-2 cursor-pointer border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-muted transition-colors shadow-xs">
      <input 
       type="checkbox" 
       checked={clvCompare}
       onChange={(e) => setClvCompare(e.target.checked)}
       className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
      />
      So sánh kỳ trước
    </label>
   </div>
  </CardHeader>
  <CardContent className="h-[380px] pt-6">
   <ResponsiveContainer width="100%" height="100%">
    <LineChart data={clvData}>
     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
     <XAxis 
      dataKey="label" 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
      dy={10}
     />
     <YAxis 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 11, fill: "#64748b" }}
      tickFormatter={(val) => `${val/1000000}tr`}
      dx={-10}
     />
     <Tooltip 
      contentStyle={{ 
       backgroundColor: "var(--card)", 
       borderColor: "var(--border)",
       borderRadius: "12px",
       boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
       border: "1px solid rgba(226, 232, 240, 0.5)",
       fontWeight: 500
      }}
      itemStyle={{ fontSize: "13px" }}
      labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}
      formatter={(value: number) => [formatCurrency(value, currentCurrency), ""]}
     />
     <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />
     <Line 
      type="monotone" 
      dataKey="current" 
      name={clvPeriod === "week" ? "Tuần này" : clvPeriod === "month" ? "Tháng này" : "Quý này"}
      stroke="#2f6cf5" 
      strokeWidth={3} 
      dot={{ r: 4, fill: "#2f6cf5", strokeWidth: 0 }}
      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
     />
     {clvCompare && (
      <Line 
       type="monotone" 
       dataKey="prev" 
       name={clvPeriod === "week" ? "Tuần trước" : clvPeriod === "month" ? "Tháng trước" : "Quý trước"}
       stroke="#94a3b8" 
       strokeWidth={3} 
       strokeDasharray="5 5"
       dot={{ r: 4, fill: "#94a3b8", strokeWidth: 0 }}
       activeDot={{ r: 5, strokeWidth: 0 }}
      />
     )}
    </LineChart>
   </ResponsiveContainer>
  </CardContent>
  </Card>
 </motion.div>

 {/* New Customer Sign-ups Growth Chart */}
 <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.25 }}
 >
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
   <div>
    <CardTitle className="font-heading">Tăng trưởng thành viên mới ({daysDiff} ngày)</CardTitle>
    <CardDescription>
     Theo dõi số lượng đăng ký tham gia chương trình Loyalty hàng ngày.
    </CardDescription>
   </div>
  </CardHeader>
  <CardContent className="h-[380px] pt-6">
   <ResponsiveContainer width="100%" height="100%">
    <LineChart data={filteredSignupsData}>
     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
     <XAxis 
      dataKey="day" 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
      dy={10}
      minTickGap={20}
     />
     <YAxis 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 11, fill: "#64748b" }}
      dx={-10}
     />
     <Tooltip 
      contentStyle={{ 
       backgroundColor: "var(--card)", 
       borderColor: "var(--border)",
       borderRadius: "12px",
       boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
       border: "1px solid rgba(226, 232, 240, 0.5)",
       fontWeight: 500
      }}
      itemStyle={{ fontSize: "13px" }}
      labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}
      formatter={(value: number) => [`${value} thành viên`, "Đăng ký mới"]}
     />
     <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />
     <Line 
      type="monotone" 
      dataKey="signups" 
      name="Thành viên mới"
      stroke="#10b981" 
      strokeWidth={3} 
      dot={{ r: 0 }}
      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
     />
    </LineChart>
   </ResponsiveContainer>
  </CardContent>
  </Card>
 </motion.div>

 {/* Popular Rewards Chart */}
 <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.28 }}
 >
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
    <CardHeader>
      <CardTitle className="font-heading text-lg">Quà tặng đổi thưởng phổ biến</CardTitle>
      <CardDescription>
        Top 5 phần quà được khách hàng quy đổi nhiều nhất trong 30 ngày qua.
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={popularRewardsData} 
          layout="vertical"
          margin={{ left: 40, right: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#64748b", fontWeight: "bold" }}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
             backgroundColor: "var(--card)", 
             borderColor: "var(--border)",
             borderRadius: "12px",
             boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
             border: "1px solid rgba(226, 232, 240, 0.5)",
             fontWeight: 500
            }}
          />
          <Bar 
           dataKey="count" 
           fill="#2f6cf5" 
           radius={[0, 8, 8, 0]} 
           barSize={32}
           label={{ position: 'right', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
          >
            {popularRewardsData.map((entry, index) => (
               <Cell 
                 key={`cell-${index}`} 
                 fill={index === 0 ? "#2f6cf5" : index === 1 ? "#10b981" : index === 2 ? "#f59e0b" : "#94a3b8"} 
               />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
 </motion.div>

 {/* Predicted Future Spend Chart */}
 <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
 >
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden border-primary/20">
  <div className="absolute top-0 right-0 p-4">
   <Badge className="bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20 animate-pulse">
    <Sparkles className="w-3 h-3 mr-1" /> Dự báo AI Smart Prediction
   </Badge>
  </div>
  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
   <div>
    <CardTitle className="font-heading">Dự báo chi tiêu tương lai (6 tháng tới)</CardTitle>
    <CardDescription>
     Phân tích dự đoán tổng chi tiêu dựa trên tần suất mua hàng lịch sử và thói quen tiêu dùng.
    </CardDescription>
   </div>
  </CardHeader>
  <CardContent className="h-[380px] pt-6">
   <ResponsiveContainer width="100%" height="100%">
    <LineChart data={predictedSpendData}>
     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
     <XAxis 
      dataKey="month" 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
      dy={10}
     />
     <YAxis 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 11, fill: "#64748b" }}
      tickFormatter={(val) => `${val/1000000}tr`}
      dx={-10}
     />
     <Tooltip 
      contentStyle={{ 
       backgroundColor: "var(--card)", 
       borderColor: "var(--border)",
       borderRadius: "12px",
       boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
       border: "1px solid rgba(226, 232, 240, 0.5)",
       fontWeight: 500
      }}
      itemStyle={{ fontSize: "13px" }}
      labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}
      formatter={(value: number) => [formatCurrency(value, currentCurrency), "Chi tiêu dự kiến"]}
     />
     <Line 
      type="monotone" 
      dataKey="spend" 
      name="Chi tiêu dự kiến"
      stroke="#2f6cf5" 
      strokeWidth={4} 
      dot={{ r: 6, fill: "#2f6cf5", strokeWidth: 2, stroke: "#fff" }}
      activeDot={{ r: 8, stroke: "#fff", strokeWidth: 2 }}
     />
    </LineChart>
   </ResponsiveContainer>
  </CardContent>
  <div className="px-6 pb-6 pt-2 flex flex-wrap gap-4 border-t border-border/40 mt-4">
   {predictedSpendData.slice(0, 3).map((d, i) => (
     <div key={i} className="flex-1 min-w-[120px] bg-muted/30 p-3 rounded-xl border border-border/50">
       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">{d.month}</p>
       <p className="text-sm font-bold text-foreground mt-0.5">~{formatCurrency(d.spend, currentCurrency)}</p>
       <p className="text-[10px] text-emerald-500 font-bold mt-1">Độ tin cậy: {d.confidence}%</p>
     </div>
   ))}
  </div>
  </Card>
 </motion.div>

 <div className="grid gap-6 md:grid-cols-2">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Báo cáo định kỳ (Scheduled)
          </CardTitle>
          <CardDescription>
            Tự động gửi bản tóm tắt hiệu suất Loyalty hàng tuần tới email quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/60">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Kích hoạt chuyển phát hàng tuần</Label>
              <p className="text-[10px] text-muted-foreground">Gửi vào thứ Hai hàng tuần, 08:00 AM</p>
            </div>
            <Switch 
              checked={scheduledEnabled} 
              onCheckedChange={setScheduledEnabled} 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Email nhận báo cáo</Label>
            <div className="flex gap-2">
              <Input 
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="email@company.com"
                className="bg-background/50"
              />
              <Button 
                variant="outline" 
                className="rounded-xl font-bold"
                onClick={() => toast.success(`Đã gửi bản xem trước tới ${reportEmail}`)}
              >
                <Send className="w-3.5 h-3.5 mr-2" /> Gửi thử
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-2">
             <p className="text-[10px] font-bold text-muted-foreground uppercase">Nội dung bao gồm:</p>
             <ul className="text-[11px] space-y-1.5 list-disc pl-4 text-foreground/80">
                <li>Biểu đồ tăng trưởng thành viên mới</li>
                <li>Thống kê Top 5 quà tặng được quy đổi</li>
                <li>Dự báo doanh thu tháng tiếp theo</li>
                <li>Danh sách khách hàng "At-Risk" cần chăm sóc</li>
             </ul>
          </div>

          {scheduledEnabled && (
             <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Chế độ chuyển phát định kỳ đang hoạt động
             </div>
          )}
        </CardContent>
      </Card>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full">
         <CardHeader>
           <CardTitle className="font-heading">Ghi chú vận hành</CardTitle>
           <CardDescription>Các lưu ý quan trọng trong việc phân tích dữ liệu.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
               <p className="text-xs text-foreground/80 leading-relaxed italic">
                 "Dữ liệu Doanh thu ước tính được tính toán dựa trên điểm tích lũy và tỷ lệ chuyển đổi trung bình. Các chỉ số này có thể thay đổi tùy thuộc vào cấu hình Earn Rule của bạn."
               </p>
            </div>
            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
               <p className="text-xs text-foreground/80 leading-relaxed">
                 Phân khúc "Classic Elegant" hiện đang mang lại ROI cao nhất, hãy cân nhắc tập trung các chiến dịch Marekting cá nhân hóa vào nhóm này.
               </p>
            </div>
         </CardContent>
      </Card>
    </motion.div>
 </div>

 <div className="grid gap-6 md:grid-cols-7">
 {/* Main Chart */}
 <Card className="md:col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
 <CardHeader>
 <CardTitle className="font-heading">Xu hướng Tích lũy vs Đổi điểm</CardTitle>
 <CardDescription>
 So sánh lượng điểm khách hàng tích lũy được và lượng điểm đã sử dụng.
 </CardDescription>
 </CardHeader>
 <CardContent className="h-[350px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={trendData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
 <XAxis 
 dataKey="month" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
 dy={10}
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fill: "#64748b" }}
 dx={-10}
 />
 <Tooltip 
 contentStyle={{ 
  backgroundColor: "var(--card)", 
  borderColor: "var(--border)",
  borderRadius: "12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(226, 232, 240, 0.5)",
  fontWeight: 500
 }}
 itemStyle={{ fontSize: "13px" }}
 labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}
 />
 <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />
 <Line 
 type="monotone" 
 dataKey="tích" 
 name="Điểm tích lũy"
 stroke="#2f6cf5" 
 strokeWidth={3} 
 dot={{ r: 4, fill: "#2f6cf5", strokeWidth: 0 }}
 activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
 />
 <Line 
 type="monotone" 
 dataKey="đổi" 
 name="Điểm đổi quà"
 stroke="#94a3b8" 
 strokeWidth={3} 
 strokeDasharray="5 5"
 dot={{ r: 4, fill: "#94a3b8", strokeWidth: 0 }}
 activeDot={{ r: 5, strokeWidth: 0 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 {/* Tier Distribution Chart */}
 <Card className="md:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
 <CardHeader className="border-b border-border/40 pb-5">
 <CardTitle className="font-heading text-lg">Phân bổ Cấp bậc</CardTitle>
 <CardDescription>
 Tỷ lệ khách hàng theo từng cấp độ thành viên.
 </CardDescription>
 </CardHeader>
 <CardContent className="h-[350px] flex flex-col items-center justify-center pt-6">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={tierData}
 cx="50%"
 cy="50%"
 innerRadius={80}
 outerRadius={105}
 paddingAngle={3}
 dataKey="value"
 stroke="var(--card)"
 strokeWidth={3}
 >
 {tierData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip 
 contentStyle={{ 
  backgroundColor: "var(--card)", 
  borderColor: "var(--border)",
  borderRadius: "12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  border: "1px solid rgba(226, 232, 240, 0.5)",
  fontWeight: 500
 }}
 itemStyle={{ fontSize: "13px", fontWeight: "bold" }}
 />
 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-[45%] text-center pointer-events-none mt-4">
 <p className="text-3xl font-black font-heading tracking-tight drop-shadow-sm">915</p>
 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">TV Hoạt động</p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Customers per Loyalty Tier Bar Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 >
 <Card className="border border-border/50 bg-sidebar backdrop-blur-sm shadow-sm relative overflow-hidden">
 <CardHeader className="border-b border-border/40 pb-5">
 <CardTitle className="font-heading text-lg">Quy mô tệp khách hàng theo Cấp bậc</CardTitle>
 <CardDescription>
 Số lượng thành viên thuộc các phân tầng Atelier, Icon, Essential và Member đang hoạt động trong hệ thống.
 </CardDescription>
 </CardHeader>
 <CardContent className="h-[320px] pt-6">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart
 data={[
 { tier: "Member", count: 520, label: "Member (Hạng Phổ thông)" },
 { tier: "Essential", count: 340, label: "Essential (Hạng Bạc)" },
 { tier: "Icon", count: 180, label: "Icon (Hạng Vàng VIP)" },
 { tier: "Atelier", count: 65, label: "Atelier (Hạng Thượng lưu)" },
 ]}
 margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
 >
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
 <XAxis 
 dataKey="tier" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 12, fill: "#64748b", fontWeight: "600" }}
 dy={10}
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fill: "#64748b" }}
 dx={-10}
 />
 <Tooltip 
 cursor={{ fill: "rgba(212, 175, 55, 0.04)", radius: 10 }}
 content={({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 const colors: Record<string, string> = {
 Member: "#94a3b8",
 Essential: "#38bdf8",
 Icon: "#facc15",
 Atelier: "#2f6cf5"
 };
 return (
 <div className="bg-card border border-border rounded-xl p-3 shadow-xl backdrop-blur-md">
 <p className="font-bold text-xs flex items-center gap-1.5" style={{ color: colors[data.tier] }}>
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[data.tier] }} />
 {data.label}
 </p>
 <p className="text-foreground text-sm font-semibold mt-1">
 {data.count.toLocaleString("vi-VN")} thành viên
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">
 Chiếm {((data.count / 1105) * 100).toFixed(1)}% tổng quy mô
 </p>
 </div>
 );
 }
 return null;
 }}
 />
 <Bar 
 dataKey="count" 
 radius={[12, 12, 0, 0]}
 maxBarSize={60}
 >
 {[
 { tier: "Member", fill: "#94a3b8" },
 { tier: "Essential", fill: "#38bdf8" },
 { tier: "Icon", fill: "#facc15" },
 { tier: "Atelier", fill: "#2f6cf5" },
 ].map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.fill} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </motion.div>

 {/* Heatmap Section */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 >
 <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
 <CardHeader className="border-b border-border/40 pb-5">
 <CardTitle className="font-heading text-lg">Khung giờ vàng mua sắm (Khách VIP)</CardTitle>
 <CardDescription>
 Mật độ giao dịch thành công theo các khung giờ trong tuần thông qua hệ thống POS.
 </CardDescription>
 </CardHeader>
 <CardContent className="pt-6">
 <div className="w-full overflow-x-auto pb-4">
 <div className="min-w-[600px]">
 <div className="flex mb-2">
 <div className="w-10 shrink-0"></div>
 {heatmapHours.map(hour => (
 <div key={hour} className="flex-1 text-center text-[10px] text-muted-foreground font-semibold">
 {hour}
 </div>
 ))}
 </div>
 <div className="space-y-1">
 {heatmapData.map((row, i) => (
 <div key={row.day} className="flex items-center gap-1.5">
 <div className="w-10 shrink-0 text-xs font-bold text-muted-foreground">{row.day}</div>
 {row.values.map((val, j) => {
 const opacity = val === 0 ? 0.05 : Math.min(1, Math.max(0.1, val / 25));
 return (
 <div 
 key={j} 
 className="flex-1 aspect-square rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer group relative" 
 style={{ backgroundColor: `rgba(47, 108, 245, ${opacity})` }}
 >
 <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-md border border-border/10 whitespace-nowrap font-bold">
 {val > 0 ? `${val} giao dịch` : 'Không có GD'}
 </span>
 </div>
 );
 })}
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
 <span>Thấp</span>
 <div className="flex gap-1 h-2.5">
 {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((op, i) => (
 <div key={i} className="w-4 h-full rounded-[2px]" style={{ backgroundColor: `rgba(47, 108, 245, ${op})` }} />
 ))}
 </div>
 <span>Cao</span>
 </div>
 </CardContent>
 </Card>
 </motion.div>

  {/* Grid for Bottom Sections */}
 <div className="grid gap-6 md:grid-cols-2">
 <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
 <CardHeader>
 <CardTitle className="font-heading">Ưu đãi được đổi nhiều nhất</CardTitle>
 <CardDescription>Các phần thưởng khách hàng quan tâm nhất tháng này.</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {[
 { name: "Voucher giảm giá 1.250.000 ₫", count: 245, growth: "+12%" },
 { name: "Miễn phí đánh bóng trang sức", count: 184, growth: "+5%" },
 { name: "Bộ quà tặng nến thơm VIP", count: 92, growth: "+24%" },
 { name: "Giảm 10% đơn hàng kế tiếp", count: 76, growth: "-3%" },
 ].map((item, i) => (
 <div key={item.name} className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-primary" />
 <span className="text-sm font-medium">{item.name}</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-sm font-bold">{item.count} lượt</span>
 <span className={`text-xs font-bold ${item.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
 {item.growth}
 </span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
 <CardHeader>
 <CardTitle className="font-heading">Khách hàng tích cực</CardTitle>
 <CardDescription>Thành viên có lượng điểm giao dịch cao nhất.</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {[
 { name: "Eleanor Pena", tier: "Atelier", points: "45,200", avatar: "EP" },
 { name: "Albert Flores", tier: "Icon", points: "32,850", avatar: "AF" },
 { name: "Arlene McCoy", tier: "Icon", points: "28,400", avatar: "AM" },
 { name: "Jane Cooper", tier: "Essential", points: "21,150", avatar: "JC" },
 ].map((customer) => (
 <div key={customer.name} className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center text-xs font-bold">
 {customer.avatar}
 </div>
 <div>
 <p className="text-sm font-medium leading-none">{customer.name}</p>
 <p className="text-xs text-muted-foreground mt-1">{customer.tier}</p>
 </div>
 </div>
 <span className="text-sm font-bold text-primary">{customer.points} pts</span>
 </div>
 ))}
 </div>
  </CardContent>
 </Card>
  </div>
 </div>
 </div>
 );
}
