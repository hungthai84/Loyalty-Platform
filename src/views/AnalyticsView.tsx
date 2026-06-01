import React from "react";
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
 ArrowDownRight
} from "lucide-react";
import * as motion from "motion/react-client";

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
 <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
 <CardHeader className="flex flex-row items-center justify-between pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">
 {stat.title}
 </CardTitle>
 <stat.icon className="h-4 w-4 text-primary" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stat.value}</div>
 <p className="text-xs flex items-center mt-1">
 {stat.positive ? (
 <span className="text-emerald-500 flex items-center mr-1">
 <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stat.trend}
 </span>
 ) : (
 <span className="text-rose-500 flex items-center mr-1">
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
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
 <XAxis 
 dataKey="month" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 12, fill: "#64748b" }}
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 12, fill: "#64748b" }}
 />
 <Tooltip 
 contentStyle={{ 
 backgroundColor: "hsl(var(--card))", 
 borderColor: "hsl(var(--border))",
 borderRadius: "8px",
 boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
 }} 
 />
 <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
 <Line 
 type="monotone" 
 dataKey="tích" 
 name="Điểm tích lũy"
 stroke="hsl(var(--primary))" 
 strokeWidth={3} 
 dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
 activeDot={{ r: 6, strokeWidth: 0 }}
 />
 <Line 
 type="monotone" 
 dataKey="đổi" 
 name="Điểm đổi quà"
 stroke="#94a3b8" 
 strokeWidth={3} 
 strokeDasharray="5 5"
 dot={{ r: 4, fill: "#94a3b8", strokeWidth: 0 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 {/* Tier Distribution Chart */}
 <Card className="md:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
 <CardHeader>
 <CardTitle className="font-heading">Phân bổ Hạng thành viên</CardTitle>
 <CardDescription>
 Tỷ lệ khách hàng theo từng cấp độ hội viên.
 </CardDescription>
 </CardHeader>
 <CardContent className="h-[350px] flex flex-col items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={tierData}
 cx="50%"
 cy="50%"
 innerRadius={80}
 outerRadius={100}
 paddingAngle={5}
 dataKey="value"
 >
 {tierData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 <Legend verticalAlign="bottom" height={36}/>
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4">
 <p className="text-3xl font-bold font-heading">915</p>
 <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">HV Hoạt động</p>
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
 <Card className="border border-border/50 bg-sidebar backdrop-blur-sm shadow-sm">
 <CardHeader>
 <CardTitle className="font-heading">Quy mô tệp khách hàng theo Hạng hội viên</CardTitle>
 <CardDescription>
 Số lượng hội viên thuộc các phân tầng Atelier, Icon, Essential và Member đang hoạt động trong hệ thống.
 </CardDescription>
 </CardHeader>
 <CardContent className="h-[320px]">
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
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 12, fill: "#64748b" }}
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
 <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
 <CardHeader>
 <CardTitle className="font-heading">Khung giờ vàng mua sắm (Khách VIP)</CardTitle>
 <CardDescription>
 Mật độ giao dịch thành công theo các khung giờ trong tuần thông qua hệ thống POS.
 </CardDescription>
 </CardHeader>
 <CardContent>
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
 );
}
