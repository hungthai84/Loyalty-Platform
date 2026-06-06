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
  if (!user) {
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
 <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-all bg-card cursor-pointer">
 Xuất báo cáo
 </button>
 <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer font-bold shadow-lg shadow-primary/20">
 Tùy chỉnh khoảng thời gian
 </button>
 </div>
 </div>

 {/* KPI Stats */}
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 {[
 { title: "Tổng khách hàng", value: "1.284", icon: Users, trend: "+12.5%", positive: true },
 { title: "Điểm đã cấp", value: "4.2M pts", icon: Activity, trend: "+18.2%", positive: true },
 { title: "Tỷ lệ đổi quà", value: "32.4%", icon: Gift, trend: "-2.1%", positive: false },
 { title: "Doanh thu ước tính", value: "1.150.000.000 ₫", icon: TrendingUp, trend: "+7.4%", positive: true },
 ].map((stat, i) => (
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

  {/* NEW PREDICTIVE SUGGESTIONS CARD */}
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: 0.45 }}
  >
   <Card className="border border-border/50 bg-[#1e2330]/40 backdrop-blur-md shadow-lg overflow-hidden relative">
    <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-[#2f6cf5]/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
    
    <CardHeader className="border-b border-border/40 pb-5">
     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="text-left">
       <span className="text-[10px] font-bold text-[#2f6cf5] border border-[#2f6cf5]/30 bg-[#2f6cf5]/10 py-1 px-2.5 rounded-full uppercase tracking-widest inline-block mb-2">
        Dự đoán Hành Vi & Thẩm mỹ VIP (Aesthetic Intelligence)
       </span>
       <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#2f6cf5] animate-pulse" /> Đề Xuất Sản Phẩm Trang Sức Theo Phân Khúc Thẩm Mỹ
       </CardTitle>
       <CardDescription className="text-xs text-muted-foreground mt-0.5">
        Tính toán tự động dựa trên các chỉ số hành vi, gu thời trang cá nhân và dữ liệu lưu vết sở thích chất liệu của khách hàng.
       </CardDescription>
      </div>
      
      {/* Segment Selector Dropdown */}
      <div className="flex items-center gap-2 self-start md:self-center">
       <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">Phân khúc:</span>
       <select
        value={selectedSegment}
        onChange={(e) => setSelectedSegment(e.target.value)}
        className="bg-background border border-border/80 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2f6cf5] text-foreground transition-all shrink-0 cursor-pointer shadow-sm hover:border-primary/50"
       >
        <option value="classic">Classic Elegant (Cổ điển & Thanh lịch)</option>
        <option value="minimalist">Minimalist Sophistication (Tối giản & Tinh tế)</option>
        <option value="glamorous">Luxury Glamour (Sang trọng & Quý phái)</option>
        <option value="avant-garde">Avant-Garde/Experimental (Phá cách & Độc bản)</option>
        <option value="romantic">Romantic & Gentle (Lãng mạn & Dịu dàng)</option>
       </select>
      </div>
     </div>
    </CardHeader>

    <CardContent className="pt-6 text-left">
     {(() => {
      const prediction = SUGGESTIONS_MAP[selectedSegment];
      return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vibe & Profile Box */}
        <div className="space-y-4">
         <div className={`p-4 rounded-2xl border bg-gradient-to-br ${prediction.color}`}>
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block mb-1">Cảm Hứng Thần Thái (Vibe Theme)</span>
          <p className="text-sm font-extrabold tracking-wide">{prediction.vibe}</p>
         </div>
         
         <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hồ Sơ Quy Mô Khách Hàng</span>
          <div className="bg-background/40 border border-border/40 p-4 rounded-xl flex items-center justify-between">
           <div>
            <span className="text-2xl font-black text-foreground">{matchingCustomersCount}</span>
            <span className="text-xs text-muted-foreground ml-1.5">hội viên</span>
           </div>
           <span className="text-[10px] bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 font-bold px-2 py-0.5 rounded-full">
            Tỉ lệ: {((matchingCustomersCount / 1284) * 100).toFixed(1)}%
           </span>
          </div>
         </div>

         <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Luận Giải Đặc Tính Phân Khúc</span>
          <p className="text-xs text-muted-foreground leading-relaxed bg-background/20 p-3 rounded-xl border border-border/30">
           {prediction.insight}
          </p>
         </div>
        </div>

        {/* Top 3 Predicted Products Section */}
        <div className="space-y-4 lg:col-span-2 flex flex-col justify-between">
         <div>
          <span className="text-[11px] font-extrabold text-[#2f6cf5] uppercase tracking-wider block mb-3.5 flex items-center gap-1.5">
           <Gem className="w-4 h-4 text-[#2f6cf5]" /> Top 3 Dòng Trang Sức Chuẩn Bị Có Xu Hướng Đột Phá Điển Hình
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           {prediction.items.map((item, index) => {
            const iconsList = [Award, Sparkles, Gem];
            const IconComp = iconsList[index] || Gem;
            return (
             <div
              key={index}
              className="bg-background/40 hover:bg-[#2f6cf5]/5 border border-border/60 hover:border-[#2f6cf5]/40 p-4 rounded-2xl transition-all duration-200 hover:translate-y-[-2px] flex flex-col justify-between space-y-3 shadow-xs h-full"
             >
              <div className="flex items-center justify-between">
               <span className="w-6 h-6 rounded-full bg-[#2f6cf5]/10 flex items-center justify-center text-xs font-black text-[#2f6cf5]">
                {index + 1}
               </span>
               <IconComp className="w-4 h-4 text-[#2f6cf5]/70" />
              </div>
              
              <p className="text-xs font-bold text-foreground leading-tight">
               {item}
              </p>
              
              <div className="pt-2 border-t border-border/30">
               <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2 rounded-full font-bold">
                Khuyên dùng 
               </span>
              </div>
             </div>
            );
           })}
          </div>
         </div>

         {/* Conversion Expectations Row */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-border/30">
          <div className="space-y-1">
           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Xác xuất chuyển đổi</span>
           <p className="text-base font-extrabold text-[#10b981]">{prediction.conversion}</p>
          </div>
          <div className="space-y-1">
           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Doanh số trung vị kỳ vọng</span>
           <p className="text-base font-extrabold text-[#2f6cf5]">{prediction.projectedValue}</p>
          </div>
          <div className="hidden md:block space-y-1">
           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Chu kỳ mua sắm</span>
           <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-lg bg-border/50 block w-max mt-1">1.5 - 2.5 đơn/năm</span>
          </div>
         </div>

        </div>

       </div>
      );
     })()}
    </CardContent>
   </Card>
  </motion.div>

  {/* DỰ PHỎNG TIẾN TRÌNH THĂNG HẠNG THÀNH VIÊN */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <Card className="border border-border/50 bg-[#161a24]/35 backdrop-blur-md shadow-lg overflow-hidden relative">
      <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Trophy className="w-40 h-40 text-amber-500" />
      </div>

      <CardHeader className="border-b border-border/40 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 py-1 px-2.5 rounded-full uppercase tracking-widest inline-block mb-2">
              CRM Velocity Engine (Aura Analytics)
            </span>
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Dự Phỏng Tiến Trình Thăng Hạng Thành Viên
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Chọn hội viên để khởi chạy dự báo tốc độ thăng hạng và các cột mốc đặc quyền tiếp theo dựa trên lịch sử hoạt động.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">Hội viên:</span>
            <select
              value={progressionCustomerId}
              onChange={(e) => setProgressionCustomerId(e.target.value)}
              className="bg-background border border-border/80 text-xs font-semibold rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 text-foreground transition-all shrink-0 cursor-pointer shadow-sm hover:border-primary/50 min-w-[200px]"
            >
              {dbCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier || "Member"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 text-left">
        {(() => {
          const selectedProgCustomer = dbCustomers.find((c) => c.id === progressionCustomerId);
          if (!selectedProgCustomer) {
            return (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Vui lòng chọn hội viên để hiển thị tiến trình thăng hạng.
              </div>
            );
          }

          const activeTiers = tiers.length > 0 ? tiers : [
            { id: "member", name: "Member", threshold: 0, color: "#94a3b8", multiplier: 1, benefits: [] },
            { id: "essential", name: "Essential", threshold: 1000, color: "#38bdf8", multiplier: 1.5, benefits: [] },
            { id: "icon", name: "Icon", threshold: 5000, color: "#facc15", multiplier: 2.0, benefits: [] },
            { id: "atelier", name: "Atelier", threshold: 20000, color: "#2f6cf5", multiplier: 3.0, benefits: [] }
          ];

          const sortedTiers = [...activeTiers].sort((a, b) => a.threshold - b.threshold);
          const currentPoints = selectedProgCustomer.points || 0;
          
          const currentTierObj = sortedTiers.slice().reverse().find(t => currentPoints >= t.threshold) || sortedTiers[0];
          const nextTierObj = sortedTiers.find(t => t.threshold > currentPoints);
          
          const pointsNeeded = nextTierObj ? nextTierObj.threshold - currentPoints : 0;
          
          const currentTierThreshold = currentTierObj ? currentTierObj.threshold : 0;
          const nextTierThreshold = nextTierObj ? nextTierObj.threshold : 0;
          const segmentTotal = nextTierThreshold - currentTierThreshold;
          const segmentProgress = currentPoints - currentTierThreshold;
          const percent = segmentTotal > 0 
            ? Math.min(100, Math.max(0, (segmentProgress / segmentTotal) * 100)) 
            : 100;

          const createdAtTime = selectedProgCustomer.createdAt;
          let daysActive = 180;
          if (createdAtTime) {
            try {
              const createdDate = typeof createdAtTime.toDate === 'function' 
                ? createdAtTime.toDate() 
                : new Date(createdAtTime);
              daysActive = Math.max(15, (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            } catch (e) {
              daysActive = 180;
            }
          }
          
          let pointsDailyRate = currentPoints / daysActive;
          if (pointsDailyRate <= 0.1) {
            const fallbacks: Record<string, number> = {
              Atelier: 250,
              Icon: 80,
              Essential: 15,
              Member: 5
            };
            pointsDailyRate = fallbacks[selectedProgCustomer.tier || "Member"] || 5;
          }

          const pointsMonthlyRate = pointsDailyRate * 30;
          const daysToLevelUp = pointsDailyRate > 0 ? (pointsNeeded / pointsDailyRate) : 0;
          const monthsToLevelUp = pointsMonthlyRate > 0 ? (pointsNeeded / pointsMonthlyRate) : 0;
          
          const predictionDateStr = (() => {
            const estDate = new Date(Date.now() + daysToLevelUp * 24 * 60 * 60 * 1000);
            return estDate.toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric' });
          })();

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              
              {/* Segment progress visual bar & tier details */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Tiến Trình Chặng Hiện Tại</span>
                  <Badge 
                    className="border-none px-2.5 py-1 text-xs text-white"
                    style={{ backgroundColor: currentTierObj?.color || "#94a3b8" }}
                  >
                    {currentTierObj?.name || "Member"}
                  </Badge>
                </div>

                {/* Horizontal Progress bar */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>{currentPoints.toLocaleString()} pts (Hiện tại)</span>
                    {nextTierObj ? (
                      <span>{nextTierObj.threshold.toLocaleString()} pts ({nextTierObj.name})</span>
                    ) : (
                      <span>Đạt cấp cao nhất (Atelier)</span>
                    )}
                  </div>
                </div>

                {/* Remaining status card */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-border/30">
                  {nextTierObj ? (
                    <>
                      <p className="text-xs text-slate-300">
                        Thành viên cần tích thêm <span className="text-amber-500 font-extrabold text-sm">{pointsNeeded.toLocaleString()}</span> điểm (pts) nữa để thăng hạng <span className="font-bold text-white" style={{ color: nextTierObj.color }}>{nextTierObj.name}</span>.
                      </p>
                      <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Tiến độ chặng này đã đạt {percent.toFixed(1)}% hoàn thành
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Hội viên đã đạt phân thứ cao nhất (Atelier). Đang hưởng các độc quyền thượng lưu bậc nhất Việt Nam.
                    </div>
                  )}
                </div>
              </div>

              {/* Forecast velocity metrics and upcoming perks */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">Dự Báo Thăng Cấp (Aura Analytics)</span>
                  
                  {nextTierObj ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-background/40 p-3.5 rounded-xl border border-border/40 text-left">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Tốc Độ Tích Lũy</span>
                        <h5 className="text-sm font-extrabold text-white flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-[#2f6cf5]" /> ~{Math.round(pointsMonthlyRate).toLocaleString()} pts/tháng
                        </h5>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Dựa theo tần suất giao dịch thực tế.</p>
                      </div>

                      <div className="bg-background/40 p-3.5 rounded-xl border border-border/40 text-left">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Thời Gian Thăng Hạng Dự Kiến</span>
                        <h5 className="text-sm font-extrabold text-amber-400 font-heading">
                          ~{monthsToLevelUp < 1 ? `${Math.round(daysToLevelUp)} ngày` : `${monthsToLevelUp.toFixed(1)} tháng`}
                        </h5>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Dự kiến đạt vào: {predictionDateStr}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 text-left font-medium">
                      Giao dịch liên tục để duy trì thời hạn Atelier vĩnh cửu. Hệ số tích lũy nhân điểm độc quyền là x3.0.
                    </div>
                  )}
                </div>

                {/* Next tier privileges checklist */}
                {nextTierObj && (
                  <div className="pt-3 border-t border-border/40 text-xs">
                    <span className="font-extrabold text-slate-300 block mb-2 uppercase tracking-wide">Quyền lợi đặc tuyển đang chờ đón:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground font-medium text-left">
                      {nextTierObj.benefits && nextTierObj.benefits.length > 0 ? (
                        nextTierObj.benefits.map((benefit: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{benefit.name} ({benefit.value})</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Hệ số nhân điểm: x{nextTierObj.multiplier || 1.5}</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Quà tặng dịp kỷ niệm đặc thù VIP</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Dịch vụ thử đồ tại tư gia độc quyền</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                )}

              </div>

            </div>
          );
        })()}
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
 );
}
