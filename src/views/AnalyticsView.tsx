import React, { useState, useEffect, useMemo } from "react";
import { 
 Card, 
 CardContent, 
 CardHeader, 
 CardTitle, 
 CardDescription 
} from "@/components/ui/card";
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
    let revenueStr = "";
    if (revenueVal >= 1000000000) {
      revenueStr = `${(revenueVal / 1000000000).toFixed(2)} Tỷ ₫`;
    } else {
      revenueStr = `${revenueVal.toLocaleString("vi-VN")} ₫`;
    }

    return [
      { title: "Tổng khách hàng", value: totalCustCount.toLocaleString("vi-VN"), icon: Users, trend: `+${(12.5 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
      { title: "Điểm đã cấp", value: pointsIssuedStr, icon: Activity, trend: `+${(18.2 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
      { title: "Tỷ lệ đổi quà", value: redeemRate, icon: Gift, trend: "-2.1%", positive: false },
      { title: "Doanh thu ước tính", value: revenueStr, icon: TrendingUp, trend: `+${(7.4 * (daysDiff / 30)).toFixed(1)}%`, positive: true },
    ];
  }, [daysDiff, dbCustomers]);

  const filteredSignupsData = useMemo(() => {
    if (daysDiff <= 30) {
      return signupsData.slice(signupsData.length - daysDiff);
    }
    return signupsData;
  }, [daysDiff]);

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

 return (
 <div className="flex-1 p-8 pt-6 space-y-8 overflow-y-auto max-h-[calc(100vh-64px)]">
 <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full text-left">
 <div className="flex items-center gap-4 text-left">
 <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
 <motion.div
 animate={{ 
 scale: [1, 1.15, 0.95, 1.05, 1],
 y: [0, -3, 3, -1, 0]
 }}
 transition={{ 
 repeat: Infinity,
 duration: 5,
 ease: "easeInOut"
 }}
 >
 <TrendingUp className="w-8 h-8 text-emerald-500" />
 </motion.div>
 </div>
 <div>
 <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Báo cáo & Thống kê</h2>
 <p className="text-muted-foreground text-sm mt-1">
 Theo dõi hiệu quả chương trình ưu đãi của bạn.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button 
   onClick={() => {
     const reportTitle = "BÁO CÁO TOÀN DIỆN CHƯƠNG TRÌNH LOYALTY - SEVA CRM";
     const timestamp = new Date().toLocaleString("vi-VN");
     const content = `==================================================\n        ${reportTitle}\n        Xuất ngày: ${timestamp}\n==================================================\n\n1. CHỒ BIỂU ĐẠI SỐ ĐỒNG BỘ DOANH NGHIỆP:\n----------------------------------\n- Tổng số khách hàng thành viên: 1.284 (+12.5% so với tháng trước)\n- Doanh thu CLV trung bình: 142.500.000 ₫ (+8.2%)\n- Khách hàng đã thăng hạng: 326 (+15.4%)\n- Tỷ lệ quay lại mua sắm (Repeat Rate): 68.2% (+3.1%)\n\n2. PHÂN BỔ HẠNG THÀNH VIÊN (LOYALTY TIERS):\n----------------------------------\n- Hạng Atelier (Hoàng Gia): 124 thành viên\n- Hạng Icon (Vàng VIP): 386 thành viên\n- Hạng Essential (Cơ Bản): 524 thành viên\n- Hạng Member (Khởi Tạo): 250 thành viên\n\n3. CHIẾN DỊCH KHUYẾN GỬI (COMMUNICATION AUTO-PILOT):\n----------------------------------\n- Chúc mừng Sinh nhật Đặc Quyền: Đã gửi 542 | Tỷ lệ mở: 88.5% | Tỷ lệ Click: 24.2%\n- Win-back Phục hồi Khách hàng: Đã gửi 186 | Tỷ lệ mở: 74.0% | Tỷ lệ Click: 12.8%\n\n4. PHÂN TÍCH SỞ TRƯỜNG & PHONG CÁCH (PREDICTIVE STYLE):\n----------------------------------\n- Cổ điển Sang trọng (Classic): 42%\n- Tối giản Tinh khôi (Minimalist): 28%\n- Quý phái Kiêu sa (Glamorous): 18%\n- Tiên phong Phá cách (Avant-Garde): 12%\n\nBáo cáo được khởi tạo tự động từ hệ thống quản trị SEVAGO VIP Loyalty. \nTrân trọng cảm ơn quý doanh nghiệp!\n`;
     const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `SEVA_Loyalty_Executive_Report_${new Date().toISOString().split('T')[0]}.txt`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
     import("sonner").then(module => module.toast.success("Báo cáo Executive Report (.txt) đã được tải xuống!"));
   }}
   className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-all bg-card cursor-pointer">
 Xuất báo cáo (Report)
 </button>
 <button 
   onClick={() => {
     const headers = ["Mã KH", "Họ và Tên", "Hạng Thành Viên", "Điểm Thành Viên", "Doanh Thu CLV (VND)", "Vị Trí", "Tần Suất"];
     const rows = [
       ["cust_1", "Thái Hồng Hưng", "Atelier", "125000", "12500000000", "TP.HCM", "98%"],
       ["cust_2", "Nguyễn Minh Anh", "Icon", "4800", "480000000", "Hà Nội", "64%"],
       ["cust_3", "Trần Khánh Nhung", "Essential", "1250", "125000000", "Nha Trang", "45%"],
       ["cust_4", "Lê Gia Bảo", "Member", "420", "42000000", "Đà Nẵng", "22%"],
       ["cust_5", "Vũ Hoàng Diệp", "Atelier", "18200", "1820000000", "TP.HCM", "89%"]
     ];
     
     const csvRows = [headers.join(",")];
     rows.forEach(r => csvRows.push(r.join(",")));
     const csvString = "\uFEFF" + csvRows.join("\n");
     const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `SEVA_Customers_Metrics_${new Date().toISOString().split('T')[0]}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
     import("sonner").then(module => module.toast.success("Hệ thống đã kết xuất dữ liệu CSV thành công!"));
   }}
   className="px-4 py-2 border border-blue-500/30 text-blue-500 rounded-xl text-sm font-medium hover:bg-blue-500/10 transition-all bg-blue-500/5 cursor-pointer">
 Xuất dữ liệu (CSV)
 </button>
 <div className="relative">
  <button 
    onClick={() => setIsOpen(!isOpen)}
    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer font-bold shadow-lg shadow-primary/20 focus:ring-2 focus:ring-primary/20 outline-none"
  >
    <Calendar className="w-4 h-4 text-primary-foreground" />
    <span>{formatRangeText()}</span>
    <ChevronDown
      className={`w-3.5 h-3.5 text-primary-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    />
  </button>

  {isOpen && (
    <>
      {/* Backdrop handle for closing */}
      <div
        className="fixed inset-0 z-10"
        onClick={() => setIsOpen(false)}
      />
      <div className="absolute right-0 mt-2 w-72 bg-card border border-border/80 shadow-2xl rounded-2xl p-4.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150">
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

          {/* Custom boundaries */}
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
      formatter={(value: number) => [`${value.toLocaleString()} ₫`, ""]}
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
    <CardTitle className="font-heading">Tăng trưởng hội viên mới ({daysDiff} ngày)</CardTitle>
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
      formatter={(value: number) => [`${value} hội viên`, "Đăng ký mới"]}
     />
     <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />
     <Line 
      type="monotone" 
      dataKey="signups" 
      name="Hội viên mới"
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
 <CardTitle className="font-heading text-lg">Phân bổ Hạng thành viên</CardTitle>
 <CardDescription>
 Tỷ lệ khách hàng theo từng cấp độ hội viên.
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
 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">HV Hoạt động</p>
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
 <CardTitle className="font-heading text-lg">Quy mô tệp khách hàng theo Hạng hội viên</CardTitle>
 <CardDescription>
 Số lượng hội viên thuộc các phân tầng Atelier, Icon, Essential và Member đang hoạt động trong hệ thống.
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
 </CardContent></Card></div><ActivityHeatmap /></div>);}
