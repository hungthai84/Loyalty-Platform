import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { kpiData, revenueData, recentCustomers } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Gem, Wifi, WifiOff, Calendar, ChevronDown, Filter, ArrowRight, Award, RotateCcw, LayoutDashboard, Database } from "lucide-react";
import * as motion from "motion/react-client";
import { SeedDemoData } from "@/components/layout/SeedDemoData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DashboardView() {
 const [isOnline, setIsOnline] = useState(navigator.onLine);

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
 { label: "Bạc", id: "Bạc" },
 { label: "Vàng", id: "Vàng" },
 { label: "Bạch kim", id: "Bạch kim" },
 { label: "Kim cương", id: "Kim cương" },
 ];

 const presets = [
 { label: "Hôm nay", id: "today", getRange: () => ({ start: "2026-05-27", end: "2026-05-27" }) },
 { label: "7 ngày qua", id: "7days", getRange: () => ({ start: "2026-05-21", end: "2026-05-27" }) },
 { label: "30 ngày qua", id: "30days", getRange: () => ({ start: "2026-04-28", end: "2026-05-27" }) },
 { label: "Tháng này", id: "month", getRange: () => ({ start: "2026-05-01", end: "2026-05-27" }) },
 { label: "Tháng trước", id: "last_month", getRange: () => ({ start: "2026-04-01", end: "2026-04-30" }) },
 { label: "Toàn bộ", id: "all", getRange: () => ({ start: "2023-01-01", end: "2026-05-27" }) },
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
 const sStr = sDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
 const eStr = eDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
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
 case "Bạc": return 0.15;
 case "Vàng": return 0.25;
 case "Bạch kim": return 0.28;
 case "Kim cương": return 0.32;
 default: return 1.0;
 }
 }, [selectedTier]);

 // Stat Recalculations for KPIs based on date interval and tier
 const filteredKpis = useMemo(() => {
 if (activePreset === 'all') {
 return kpiData.map((kpi, idx) => {
 if (idx === 0) { // Revenue
 const origVal = 105700000000;
 const newVal = origVal * tierFactor;
 return {
 ...kpi,
 value: `${(newVal / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ ₫`
 };
 }
 if (idx === 1) { // Active customers
 const origVal = 24591;
 const newVal = Math.floor(origVal * tierFactor);
 return { ...kpi, value: newVal.toLocaleString("vi-VN") };
 }
 if (idx === 3) { // points
 const origVal = 1200000;
 const newVal = Math.floor(origVal * tierFactor);
 return { ...kpi, value: `${(newVal / 1000).toFixed(1).replace(".", ",")}k pts` };
 }
 return kpi;
 });
 }

 // Daily revenue average = 88,000,000 VNĐ
 const revenueVal = daysDiff * 88000000 * tierFactor;
 let formattedRevenue = "";
 if (revenueVal >= 1000000000) {
 formattedRevenue = `${(revenueVal / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ ₫`;
 } else {
 formattedRevenue = `${(revenueVal / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr ₫`;
 }

 // Daily guest onboarding active pool
 const activeCust = Math.min(24591, Math.max(10, Math.floor((50 + daysDiff * 14.5) * tierFactor)));
 const formattedActiveCust = activeCust.toLocaleString("vi-VN");

 // Repeat rate percentage fluctuates based on size
 let repeatRate = "68%";
 let repeatChange = "+2.1%";
 let repeatPositive = true;
 if (activePreset === 'today') {
 repeatRate = selectedTier === "Kim cương" ? "88%" : "74%";
 repeatChange = "+4.8%";
 } else if (activePreset === '7days') {
 repeatRate = selectedTier === "Kim cương" ? "82%" : "71%";
 repeatChange = "+1.8%";
 } else if (activePreset === '30days') {
 repeatRate = selectedTier === "Kim cương" ? "79%" : "68.5%";
 repeatChange = "+2.4%";
 } else {
 const seed = (daysDiff % 6) * 0.35 + (selectedTier === "Kim cương" ? 12 : selectedTier === "Bạch kim" ? 7 : 0);
 repeatRate = `${(66.2 + seed).toFixed(1).replace(".", ",")}%`;
 repeatChange = seed >= 0 ? `+${seed.toFixed(1).replace(".", ",")}%` : `${seed.toFixed(1).replace(".", ",")}%`;
 repeatPositive = seed >= 0;
 }

 // Point Redemptions
 const pointsRedeemed = Math.min(1200000, Math.floor(daysDiff * 2420 * tierFactor));
 let formattedPoints = "";
 if (pointsRedeemed >= 1000000) {
 formattedPoints = `${(pointsRedeemed / 1000000).toFixed(1).replace(".", ",")}M pts`;
 } else if (pointsRedeemed >= 1000) {
 formattedPoints = `${(pointsRedeemed / 1000).toFixed(1).replace(".", ",")}k pts`;
 } else {
 formattedPoints = `${pointsRedeemed} pts`;
 }

 const revenueChange = activePreset === 'today' ? "+8.5%" : activePreset === '7days' ? "+4.2%" : "+12.5%";
 const activeCustChange = activePreset === 'today' ? "+0.3%" : activePreset === '7days' ? "+1.4%" : "+5.2%";
 const pointsChange = activePreset === 'today' ? "+2.9%" : "-4.5%";

 return [
 { label: "Tổng doanh thu", value: formattedRevenue, change: revenueChange, positive: true },
 { label: "Khách hàng hoạt động", value: formattedActiveCust, change: activeCustChange, positive: true },
 { label: "Tỷ lệ mua lại", value: repeatRate, change: repeatChange, positive: repeatPositive },
 { label: "Điểm đã đổi", value: formattedPoints, change: pointsChange, positive: activePreset === 'today' },
 ];
 }, [daysDiff, activePreset, selectedTier, tierFactor]);

 // Dynamic Charting categories matching dates or weeks scaled by tier
 const filteredRevenueData = useMemo(() => {
 if (activePreset === 'all' || daysDiff > 60) {
 return revenueData.map(d => ({ ...d, revenue: Math.floor(d.revenue * tierFactor) }));
 }

 // If day-by-day analysis
 if (daysDiff <= 7) {
 const data = [];
 const sDate = new Date(startDate);
 for (let i = 0; i < daysDiff; i++) {
 const currentDate = new Date(sDate);
 currentDate.setDate(sDate.getDate() + i);
 const dayLabel = currentDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
 const dayVal = Math.floor((62000000 + (i % 3) * 16500000 + (i % 2) * 9000000) * tierFactor);
 data.push({ name: dayLabel, revenue: dayVal });
 }
 return data;
 }

 // Weekly blocks for 30 days
 const totalWeeks = Math.ceil(daysDiff / 7);
 const data = [];
 for (let i = 1; i <= totalWeeks; i++) {
 const weekRevenue = Math.floor((920000000 + (i % 3) * 145000000 + (i % 2) * 45000000) * tierFactor);
 data.push({ name: `Tuần ${i}`, revenue: weekRevenue });
 }
 return data;
 }, [daysDiff, startDate, activePreset, tierFactor]);

 // Dynamic Filtered VIP customers shown in list based on selected tier
 const filteredRecentCustomers = useMemo(() => {
 if (selectedTier === "all") return recentCustomers;
 return recentCustomers.filter(c => c.tier.toLowerCase() === selectedTier.toLowerCase());
 }, [selectedTier]);

 return (
 <div className="flex-1 space-y-6 p-8 pt-6">
 <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full">
 {/* Title container + Date Range Picker right next to it */}
 <div className="flex items-center gap-4 text-left">
 <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
 <motion.div
 animate={{ 
 scale: [1, 1.15, 0.95, 1.05, 1],
 rotate: [0, 8, -8, 4, 0]
 }}
 transition={{ 
 repeat: Infinity,
 duration: 5.5,
 ease: "easeInOut"
 }}
 >
 <LayoutDashboard className="w-8 h-8 text-[#2f6cf5]" />
 </motion.div>
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Tổng quan</h2>
 <Dialog>
 <DialogTrigger className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-bold shadow-sm cursor-pointer animate-fade-in uppercase tracking-wider">
 <Database className="w-3 h-3" />
 <span>Nạp mẫu</span>
 </DialogTrigger>
 <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none" aria-describedby="dialog-description">
 <div id="dialog-description" className="sr-only">Nạp dữ liệu mẫu vào hệ thống</div>
 <SeedDemoData />
 </DialogContent>
 </Dialog>
 </div>
 <p className="text-sm text-muted-foreground mt-1">Số liệu thống kê và thông tin tổng quan hệ thống.</p>
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
 className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-muted/50 text-foreground border border-border rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
 >
 <Calendar className="w-4 h-4 text-[#2f6cf5]" />
 <span className="">{formatRangeText()}</span>
 <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
 </button>

 {isOpen && (
 <>
 {/* Backdrop handle for closing */}
 <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
 <div className="absolute left-0 mt-2 w-72 bg-card border border-border shadow-2xl rounded-[1.25rem] p-4.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150">
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
 onClick={() => handlePresetSelect(p.id, range.start, range.end)}
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
 <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest block">Khoảng ngày tùy chỉnh</span>
 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase block">Từ ngày</label>
 <input
 type="date"
 value={startDate}
 onChange={(e) => handleCustomDateChange("start", e.target.value)}
 className="w-full bg-background border border-border rounded-xl p-2 text-xs outline-none focus:border-primary/50 text-foreground"
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase block">Đến ngày</label>
 <input
 type="date"
 value={endDate}
 onChange={(e) => handleCustomDateChange("end", e.target.value)}
 className="w-full bg-background border border-border rounded-xl p-2 text-xs outline-none focus:border-primary/50 text-foreground"
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
 Hạng: <span className="text-[#2f6cf5] font-extrabold">{tierOptions.find(t => t.id === selectedTier)?.label || selectedTier}</span>
 </span>
 <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isTierOpen ? 'rotate-180' : ''}`} />
 </button>

 {isTierOpen && (
 <>
 <div className="fixed inset-0 z-10" onClick={() => setIsTierOpen(false)} />
 <div className="absolute left-0 mt-2 w-48 bg-card border border-border shadow-2xl rounded-[1.25rem] p-2.5 z-20 text-left animate-in fade-in-50 slide-in-from-top-2 duration-150">
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
 {isSel && <span className="w-1.5 h-1.5 rounded-full bg-current font-black" />}
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
 </div>

 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 {filteredKpis.map((kpi, i) => (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 key={kpi.label}
 >
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
 <Gem className="h-4 w-4 text-primary/40" />
 </CardHeader>
 <CardContent className="text-left">
 <div className="text-2xl font-bold">{kpi.value}</div>
 <p className={`text-xs flex items-center mt-1 ${kpi.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
 {kpi.positive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
 {kpi.change} so với chu kỳ trước
 </p>
 </CardContent>
 </Card>
 </motion.div>
 ))}
 </div>

 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
 <Card className="col-span-4">
 <CardHeader className="text-left">
 <CardTitle>Biểu đồ Doanh thu</CardTitle>
 <CardDescription className="text-xs">
 Thống kê doanh số chu kỳ {daysDiff} ngày ({formatRangeText()})
 </CardDescription>
 </CardHeader>
 <CardContent className="pl-2">
 <div className="h-[300px] w-full mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={filteredRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
 <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
 <YAxis 
 stroke="#888888" 
 fontSize={11} 
 tickLine={false} 
 axisLine={false} 
 tickFormatter={(value) => {
 if (value >= 1000000000) return `${(value / 1000000000).toLocaleString('vi-VN')}T`;
 if (value >= 1000000) return `${(value / 1000000).toLocaleString('vi-VN')}Tr`;
 return value.toLocaleString('vi-VN');
 }} 
 />
 <Tooltip 
 wrapperClassName="rounded-xl border shadow-lg bg-card text-card-foreground" 
 contentStyle={{ borderRadius: "8px", border: "none" }} 
 cursor={{ stroke: 'var(--color-border)' }} 
 formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), "Doanh thu"]}
 />
 <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>

 <Card className="col-span-3">
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
 <TableRow key={customer.id}>
 <TableCell className="font-medium text-left">{customer.name}</TableCell>
 <TableCell className="text-left">
 <Badge variant={customer.tier === 'Kim cương' ? 'default' : customer.tier === 'Bạch kim' ? 'secondary' : 'outline'} className={customer.tier === 'Kim cương' ? 'bg-primary text-primary-foreground' : ''}>
 {customer.tier}
 </Badge>
 </TableCell>
 <TableCell className="text-right">{customer.spent}</TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">
 Không có khách hàng nào thuộc hạng này.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
