import React, { useState, useEffect, useMemo } from "react";
import { 
 TrendingUp, 
 Coins, 
 Users, 
 Percent, 
 Calculator, 
 Sparkles, 
 ShieldAlert,
 Gem,
 Layers,
 CheckCircle2
} from "lucide-react";
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer, 
 BarChart, 
 Bar 
} from "recharts";
import { LoyaltyCampaign, Customer } from "@/types";
import { toast } from "sonner";

interface OfferAnalysisProps {
 campaigns?: LoyaltyCampaign[];
 customers?: Customer[];
}

const PRESET_CAMPAIGNS = [
 { id: "phoenix-gold", name: "Đặc quyền Phượng Hoàng Gold 2026", type: "event", targetSize: 250, incentive: 3500000, aov: 65000000, overhead: 15000000, responseRate: 42 },
 { id: "atelier-birthday", name: "Tri Ân Atelier - Hội Viên Thượng Vy", type: "birthday", targetSize: 85, incentive: 8000000, aov: 145000000, overhead: 24000000, responseRate: 68 },
 { id: "winback-dormant", name: "Winback - Kích hoạt VIP Trễ Hạn", type: "winback", targetSize: 450, incentive: 1200000, aov: 32000000, overhead: 8000000, responseRate: 18 },
 { id: "milestone-essential", name: "Chào Mừng Essential Cấp Độ Mới", type: "milestone", targetSize: 800, incentive: 500000, aov: 18000000, overhead: 5000000, responseRate: 28 },
];

export function OfferAnalysis({ campaigns = [], customers = [] }: OfferAnalysisProps) {
 // 1. Selector of Campaign to Simulate
 const [selectedCamId, setSelectedCamId] = useState<string>("phoenix-gold");
 
 // 2. Simulator Parameters
 const [targetSize, setTargetSize] = useState<number>(250);
 const [incentiveValue, setIncentiveValue] = useState<number>(3500000); // Incentive per client (VND)
 const [redemptionRate, setRedemptionRate] = useState<number>(42); // expected claim rate %
 const [expectedAOV, setExpectedAOV] = useState<number>(65000000); // average order value generated
 const [fixedOverhead, setFixedOverhead] = useState<number>(15000000); // Operational / Decor / Print Fixed Cost
 const [marginRate, setMarginRate] = useState<number>(45); // Standard Gross margin of jewelry / retail items (45%)

 const [aiOptimizing, setAiOptimizing] = useState<boolean>(false);
 const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

 // Synchronize values if preset changes
 useEffect(() => {
 const selectedPreset = PRESET_CAMPAIGNS.find(p => p.id === selectedCamId);
 if (selectedPreset) {
 setTargetSize(selectedPreset.targetSize);
 setIncentiveValue(selectedPreset.incentive);
 setExpectedAOV(selectedPreset.aov);
 setFixedOverhead(selectedPreset.overhead);
 setRedemptionRate(selectedPreset.responseRate);
 setAiAnalysisResult(null); // Reset AI advisor for clean simulation
 } else {
 // If it is from Firestore we match it
 const activeLive = campaigns.find(c => c.id === selectedCamId);
 if (activeLive) {
 setTargetSize(customers.length || 150);
 setIncentiveValue(Number(activeLive.rewardValue) || 1000000);
 setExpectedAOV(45000000);
 setFixedOverhead(10000000);
 setRedemptionRate(25);
 setAiAnalysisResult(null);
 }
 }
 }, [selectedCamId, campaigns, customers]);

 // Combine live campaigns and presets for the dropdown
 const campaignOptions = useMemo(() => {
 const options = [...PRESET_CAMPAIGNS];
 campaigns.forEach(c => {
 if (!options.some(o => o.id === c.id)) {
 options.push({
 id: c.id,
 name: `🟢 LIVE: ${c.name}`,
 type: c.type,
 targetSize: customers.length || 120,
 incentive: Number(c.rewardValue) || 1200000,
 aov: 40000000,
 overhead: 10000000,
 responseRate: 30
 });
 }
 });
 return options;
 }, [campaigns, customers]);

 // 3. Mathematical Simulation Output Calculations
 const calculatedMetrics = useMemo(() => {
 const actualRedemptions = Math.round(targetSize * (redemptionRate / 100));
 
 // Total cost = (Incentives claimed) + Fixed printing/overhead
 const totalIncentiveCost = actualRedemptions * incentiveValue;
 const totalCost = totalIncentiveCost + fixedOverhead;
 
 // Gross revenue = claims * average order value
 const grossRevenue = actualRedemptions * expectedAOV;
 
 // Cost per claim = Total Cost / claims
 const costPerClaim = actualRedemptions > 0 ? Math.round(totalCost / actualRedemptions) : 0;
 
 // Gross Return (Margins) = grossRevenue * grossMargin %
 const grossMarginProfit = Math.round(grossRevenue * (marginRate / 100));
 
 // Net profit = Gross Revenue - Total Cost
 const netProfit = grossRevenue - totalCost;
 const netMarginProfit = grossMarginProfit - totalCost;
 
 // ROI = ((Gross Revenue - Total Cost) / Total Cost) * 100
 const roi = totalCost > 0 ? ((grossRevenue - totalCost) / totalCost) * 100 : 0;
 const marginRoi = totalCost > 0 ? ((grossMarginProfit - totalCost) / totalCost) * 100 : 0;

 return {
 actualRedemptions,
 totalIncentiveCost,
 totalCost,
 grossRevenue,
 costPerClaim,
 grossMarginProfit,
 netProfit,
 netMarginProfit,
 roi,
 marginRoi
 };
 }, [targetSize, incentiveValue, redemptionRate, expectedAOV, fixedOverhead, marginRate]);

 // Helper formats
 const formatVND = (value: number) => {
 return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
 };
 
 const formatShortVND = (value: number) => {
 if (value >= 1000000000) {
 return `${(value / 1000000000).toFixed(2)} Tỷ`;
 }
 return `${(value / 1000000).toFixed(0)} Triệu`;
 };

 // 4. Chart 1: Projecting cumulative growth and costs over a 6-month redemption cycle
 const cumulativeTrendData = useMemo(() => {
 const data = [];
 const monthlyWeight = [0.15, 0.35, 0.25, 0.13, 0.08, 0.04]; // normal distribution of voucher claims
 let cumulativeCost = 0;
 let cumulativeRevenue = 0;

 for (let month = 1; month <= 6; month++) {
 const weight = monthlyWeight[month - 1];
 const monthlyClaims = targetSize * (redemptionRate / 100) * weight;
 
 const monCost = monthlyClaims * incentiveValue + (month === 1 ? fixedOverhead : 0);
 const monRev = monthlyClaims * expectedAOV;
 
 cumulativeCost += monCost;
 cumulativeRevenue += monRev;
 
 data.push({
 name: `Tháng ${month}`,
 "Tổng chi phí lũy kế": Math.round(cumulativeCost / 1000000),
 "Doanh thu bồi đắp lũy kế": Math.round(cumulativeRevenue / 1000000)
 });
 }
 return data;
 }, [targetSize, redemptionRate, incentiveValue, expectedAOV, fixedOverhead]);

 // 5. Chart 2: Projected performance by Tier list distribution
 const tierDistributionSim = useMemo(() => {
 return [
 { name: "Atelier (Cực Cao)", cost: Math.round((calculatedMetrics.totalCost * 0.45) / 1000000), revenue: Math.round((calculatedMetrics.grossRevenue * 0.58) / 1000000) },
 { name: "Icon (Cao)", cost: Math.round((calculatedMetrics.totalCost * 0.35) / 1000000), revenue: Math.round((calculatedMetrics.grossRevenue * 0.28) / 1000000) },
 { name: "Essential (Vừa)", cost: Math.round((calculatedMetrics.totalCost * 0.15) / 1000000), revenue: Math.round((calculatedMetrics.grossRevenue * 0.11) / 1000000) },
 { name: "Member (Khác)", cost: Math.round((calculatedMetrics.totalCost * 0.05) / 1000000), revenue: Math.round((calculatedMetrics.grossRevenue * 0.03) / 1000000) }
 ];
 }, [calculatedMetrics]);

 // Try simulated optimizer model using rule parameters
 const runAIEstimation = () => {
 if (aiOptimizing) return;
 setAiOptimizing(true);
 
 setTimeout(() => {
 const isHighCost = incentiveValue > expectedAOV * 0.15;
 const isLowROI = calculatedMetrics.roi < 150;
 
 let score = 95;
 let bottleneck = "Tệp phân khúc và ngân sách hiện tại ở ngưỡng rất an toàn.";
 let recommendation = "";
 let optimizationIncentive = incentiveValue;
 let minSpendRequirement = expectedAOV * 0.7; // recommended minimum invoice to receive voucher

 if (isHighCost) {
 score -= 20;
 bottleneck = "Giá trị ưu đãi quá lớn so với doanh số dự tính (AOV), gây loãng tỷ suất hoàn vốn.";
 recommendation = `Đề xuất: Hạ giá trị quà tặng xuống ${formatVND(incentiveValue * 0.75)} HOẶC áp đặt điều kiện hóa đơn tối thiểu (Minimum Order Value) đạt từ ${formatVND(expectedAOV * 1.5)}.`;
 optimizationIncentive = Math.round(incentiveValue * 0.8);
 } else if (isLowROI) {
 score -= 15;
 bottleneck = "Doanh thu bồi đắp cận biên chưa đủ bù đắp chi phí cố định vận hành và nguyên liệu.";
 recommendation = "Đề xuất: Chuyển đổi phần thưởng sang hình thức 'Tặng Trải Nghiệm Phong Cách VIP' thay vì trừ tiền trực tiếp. Điều này giúp giảm 40% giá vốn mà vẫn tăng gắn kết.";
 } else {
 recommendation = "Chiến dịch tối ưu tốt! Hãy thiết lập Zalo OA thông báo tự động đợt 1 và SMS Smart-Gateway trước giờ mở showroom để tăng tỷ lệ đổi quà thêm +8%.";
 }

 setAiAnalysisResult({
 score,
 bottleneck,
 recommendation,
 minSpendRequirement,
 suggestedIncentive: optimizationIncentive,
 suggestedAovTarget: Math.round(expectedAOV * 1.25),
 roiBumping: Math.round(calculatedMetrics.roi * 1.2)
 });
 setAiOptimizing(false);
 toast.success("AI đã tối ưu hóa thông số chiến dịch thành công!");
 }, 1500);
 };

 return (
 <div className="space-y-6">
 
 {/* Title Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-sidebar/50 border border-[#2f6cf5]/20 rounded-3xl backdrop-blur-md gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-[#2f6cf5]/10 rounded-2xl text-[#2f6cf5]">
 <Calculator className="w-6 h-6 animate-pulse" />
 </div>
 <div>
 <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
 Mô phỏng & Phân tích Hiệu Quả Ưu Đãi VIP
 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#2f6cf5]/10 text-[#2f6cf5] text-xs font-black uppercase tracking-wider rounded border border-[#2f6cf5]/20 leading-none">
 <Sparkles className="w-3 h-3" /> AI Simulation Model
 </span>
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Chọn một chương trình ưu đãi, điều chỉnh quy mô tệp để tính toán trực quan chi phí, doanh thu & điểm hòa vốn ROI ròng.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <span className="text-xs font-bold text-muted-foreground ">Chiến dịch mẫu:</span>
 <select 
 value={selectedCamId} 
 onChange={(e) => setSelectedCamId(e.target.value)}
 className="p-2 bg-background border border-border/80 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
 >
 {campaignOptions.map((opt) => (
 <option key={opt.id} value={opt.id}>{opt.name}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Controls Column */}
 <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-4">
 <h4 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest border-b pb-2.5 border-border/40 flex items-center gap-1.5 ">
 <Layers className="w-4 h-4 text-[#2f6cf5]" /> THIẾT LẬP THAM SỐ CHIẾN DỊCH
 </h4>

 <div className="space-y-4 pr-1">
 {/* Target size */}
 <div className="space-y-1">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-muted-foreground">Quy mô tệp khách hàng VIP</span>
 <span className="text-foreground font-bold">{targetSize} KH</span>
 </div>
 <input 
 type="range" 
 min="10" 
 max="1000" 
 step="10"
 value={targetSize} 
 onChange={(e) => setTargetSize(Number(e.target.value))} 
 className="w-full accent-[#2f6cf5]" 
 />
 <div className="flex justify-between text-xs text-muted-foreground leading-none">
 <span>10 KH</span>
 <span>1,000 KH</span>
 </div>
 </div>

 {/* Incentive Value */}
 <div className="space-y-1">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-muted-foreground">Ưu đãi / Quà cấp (Mỗi VIP)</span>
 <span className="text-foreground font-bold text-[#2f6cf5]">{formatShortVND(incentiveValue)}</span>
 </div>
 <input 
 type="range" 
 min="100000" 
 max="10000000" 
 step="100000"
 value={incentiveValue} 
 onChange={(e) => setIncentiveValue(Number(e.target.value))} 
 className="w-full accent-[#2f6cf5]" 
 />
 <div className="flex justify-between text-xs text-muted-foreground leading-none">
 <span>100K ₫</span>
 <span>10M ₫</span>
 </div>
 </div>

 {/* Redemption Rate */}
 <div className="space-y-1">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-muted-foreground">Tỷ lệ đổi thưởng dự kiến</span>
 <span className="text-foreground font-bold text-emerald-500">{redemptionRate}%</span>
 </div>
 <input 
 type="range" 
 min="5" 
 max="100" 
 step="1"
 value={redemptionRate} 
 onChange={(e) => setRedemptionRate(Number(e.target.value))} 
 className="w-full accent-[#2f6cf5]" 
 />
 <div className="flex justify-between text-xs text-muted-foreground leading-none">
 <span>5%</span>
 <span>100%</span>
 </div>
 </div>

 {/* Expected AOV generated */}
 <div className="space-y-1">
 <div className="flex justify-between text-xs font-semibold">
 <span className="text-muted-foreground">Doanh số trung bình / Hóa đơn (AOV)</span>
 <span className="text-foreground font-bold text-sky-500">{formatShortVND(expectedAOV)}</span>
 </div>
 <input 
 type="range" 
 min="2000000" 
 max="150000000" 
 step="1000000"
 value={expectedAOV} 
 onChange={(e) => setExpectedAOV(Number(e.target.value))} 
 className="w-full accent-[#2f6cf5]" 
 />
 <div className="flex justify-between text-xs text-muted-foreground leading-none">
 <span>2 Tr ₫</span>
 <span>150 Tr ₫</span>
 </div>
 </div>

 {/* Operational Fixed Overhead */}
 <div className="space-y-2 pt-2 border-t border-border/30">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-muted-foreground uppercase">Chi phí vận hành và in ấn (₫)</label>
 <span className="text-xs font-black text-foreground">{formatVND(fixedOverhead)}</span>
 </div>
 <input 
 type="text" 
 inputMode="numeric"
 value={fixedOverhead.toLocaleString("vi-VN")}
 onChange={(e) => {
 const cleaned = Number(e.target.value.replace(/\./g, "").replace(/[^\d]/g, ""));
 setFixedOverhead(cleaned || 0);
 }}
 className="w-full p-2 bg-background border rounded-xl text-xs font-semibold text-foreground"
 />
 </div>
 </div>
 </div>

 {/* Real-time Simulated Output Metrics Panel */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Quick Metrics Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="p-4 bg-sidebar/50 rounded-2xl border border-border/50 flex flex-col justify-between">
 <span className="text-xs uppercase font-bold text-muted-foreground leading-none flex items-center gap-1">
 <Users className="w-3.5 h-3.5" /> Thể tích đổi quà
 </span>
 <h4 className="text-2xl font-black font-heading mt-2 ">
 {calculatedMetrics.actualRedemptions} <span className="text-xs text-muted-foreground">VIPs</span>
 </h4>
 <span className="text-xs text-muted-foreground mt-2 block border-t pt-1.5 ">
 Thỏa mục tiêu trong {targetSize} KH
 </span>
 </div>

 <div className="p-4 bg-sidebar/50 rounded-2xl border border-border/50 flex flex-col justify-between">
 <span className="text-xs uppercase font-bold text-muted-foreground leading-none flex items-center gap-1">
 <Coins className="w-3.5 h-3.5 text-[#2f6cf5]" /> Tổng chi phí
 </span>
 <h4 className="text-2xl font-black font-heading mt-2 text-[#2f6cf5] truncate">
 {formatShortVND(calculatedMetrics.totalCost)}
 </h4>
 <span className="text-xs text-muted-foreground mt-2 block border-t pt-1.5 ">
 Giá TB / KH: {calculatedMetrics.actualRedemptions > 0 ? formatShortVND(calculatedMetrics.costPerClaim) : "0 ₫"}
 </span>
 </div>

 <div className="p-4 bg-sidebar/50 rounded-2xl border border-border/50 flex flex-col justify-between">
 <span className="text-xs uppercase font-bold text-emerald-500 leading-none flex items-center gap-1">
 <TrendingUp className="w-3.5 h-3.5" /> Doanh thu bồi đắp
 </span>
 <h4 className="text-2xl font-black font-heading mt-2 text-emerald-500 truncate">
 {formatShortVND(calculatedMetrics.grossRevenue)}
 </h4>
 <span className="text-xs text-muted-foreground mt-2 block border-t pt-1.5 ">
 Lợi gộp ({marginRate}%): {formatShortVND(calculatedMetrics.grossMarginProfit)}
 </span>
 </div>

 <div className="p-4 bg-sidebar/50 rounded-2xl border border-[#2f6cf5]/30 flex flex-col justify-between relative overflow-hidden">
 <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full blur-xs" />
 <span className="text-xs uppercase font-bold text-primary leading-none flex items-center gap-1">
 <Percent className="w-3.5 h-3.5" /> Tỷ lệ hoàn vốn ROI
 </span>
 <h4 className="text-2xl font-black font-heading mt-2 text-primary truncate">
 {calculatedMetrics.roi.toFixed(0)}%
 </h4>
 <span className="text-xs text-muted-foreground mt-2 block border-t pt-1.5 ">
 ROI Lợi gộp: {calculatedMetrics.marginRoi.toFixed(0)}%
 </span>
 </div>
 </div>

 {/* Graphical Projections Section */}
 <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
 <h4 className="text-xs font-bold text-foreground">XU THẾ LŨY KẾ CHI PHÍ VS DOANH THU (6 THÁNG HƯỞNG ƯU ĐÃI)</h4>
 <div className="h-[180px] w-full mt-2 text-xs ">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={cumulativeTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
 <defs>
 <linearGradient id="colorCostSim" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#2f6cf5" stopOpacity={0.0}/>
 </linearGradient>
 <linearGradient id="colorRevSim" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
 <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
 <YAxis stroke="#888" fontSize={10} tickLine={false} unit="M" />
 <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.95)", borderRadius: "12px", border: "1px solid rgba(128,128,128,0.2)", color: "#fff" }} />
 <Area type="monotone" name="Chi phí tích lũy (Tr ₫)" dataKey="Tổng chi phí lũy kế" stroke="#2f6cf5" strokeWidth={2} fillOpacity={1} fill="url(#colorCostSim)" />
 <Area type="monotone" name="Doanh thu tích lũy (Tr ₫)" dataKey="Doanh thu bồi đắp lũy kế" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevSim)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Group 2: Tier Distribution Simulation details */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 
 {/* Left side: chart of simulated contribution */}
 <div className="bg-card border border-border/60 rounded-2xl p-5 md:col-span-2 space-y-3">
 <h5 className="text-xs font-bold text-foreground">HIỆU QUẢ PHÂN BỔ THEO PHÂN CẤP CỦA HỘI VIÊN</h5>
 <div className="h-[130px] w-full text-xs ">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={tierDistributionSim}>
 <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
 <YAxis stroke="#888" fontSize={9} tickLine={false} unit="M" />
 <Tooltip />
 <Bar name="Tổng chi (Tr)" dataKey="cost" fill="#2f6cf5" radius={[3, 3, 0, 0]} />
 <Bar name="Doanh số (Tr)" dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Right side: AI Advisor call */}
 <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/20 rounded-2xl p-5 flex flex-col justify-between">
 <div>
 <span className="text-xs uppercase font-bold tracking-widest text-[#2f6cf5] block">AI Advisor Suite</span>
 <h5 className="text-xs font-bold text-foreground mt-1">Chẩn đoán và Đề xuất Thâm dụng ngân sách</h5>
 <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
 Gửi các tham số chiến dịch đang cấu hình lên mô hình phân tích để dò soát lỗi biên lợi nhuận.
 </p>
 </div>

 <button
 onClick={runAIEstimation}
 disabled={aiOptimizing}
 className="w-full mt-3 py-2 bg-[#2f6cf5] hover:bg-[#1652f1] disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 px-3 transition-all tracking-wider uppercase cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5" />
 {aiOptimizing ? "Chẩn đoán..." : "Tối ưu hóa bằng AI"}
 </button>
 </div>

 </div>

 </div>
 </div>

 {/* AI Analysis detailed feedback block */}
 {aiAnalysisResult && (
 <div className="bg-gradient-to-r from-[#2f6cf5]/10 via-[#2f6cf5]/5 to-[#2f6cf5]/10 border border-[#2f6cf5]/40 rounded-3xl p-6 relative overflow-hidden animate-fade-in">
 
 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
 <Gem className="w-40 h-40 text-[#2f6cf5]" />
 </div>

 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#2f6cf5]/30 pb-4 gap-4">
 <div className="flex items-center gap-3">
 <span className="text-3xl font-black text-[#2f6cf5]">{aiAnalysisResult.score}</span>
 <div>
 <h4 className="text-sm font-black text-foreground uppercase tracking-wide">Điểm Khả thi & Tối Ưu Chiến Dịch (Campaign Score)</h4>
 <p className="text-xs text-muted-foreground mt-0.5">Dựa trên tỷ suất, giá trị gán, và tần suất mua lặp lại của hội viên.</p>
 </div>
 </div>
 
 <div className="px-4 py-1.5 border border-[#2f6cf5]/30 bg-[#2f6cf5]/10 text-[#2f6cf5] text-xs font-bold uppercase rounded-xl">
 Cấp độ: {aiAnalysisResult.score >= 85 ? "Khuyến khích chạy" : "Cần tinh chỉnh gấp"}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase">
 <ShieldAlert className="w-4 h-4 animate-bounce" /> Nút thắt rủi ro (Bottleneck)
 </div>
 <p className="text-xs text-foreground leading-relaxed pl-1">
 {aiAnalysisResult.bottleneck}
 </p>
 </div>

 <div className="space-y-2">
 <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase">
 <CheckCircle2 className="w-4 h-4" /> Đề xuất hành động (Tactical recommendation)
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed pl-1">
 {aiAnalysisResult.recommendation}
 </p>
 </div>
 </div>

 {/* AI Ideal Parameters display table */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#2f6cf5]/20 bg-background/40 p-4 rounded-2xl border border-border/40">
 <div className="space-y-0.5">
 <span className="text-xs text-muted-foreground uppercase font-bold">Mức Hóa Đơn Tối Thiểu (Suggested Threshold)</span>
 <p className="text-xs font-black text-foreground ">{formatVND(aiAnalysisResult.minSpendRequirement)}</p>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs text-muted-foreground uppercase font-bold">Giá Trị Ưu Đãi Tối Ưu (Suggested Incentive)</span>
 <p className="text-xs font-black text-[#2f6cf5] ">{formatVND(aiAnalysisResult.suggestedIncentive)}</p>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs text-muted-foreground uppercase font-bold">Chỉ tiêu AOV Nhắm mục tiêu (Suggested AOV Target)</span>
 <p className="text-xs font-black text-sky-500 ">{formatVND(aiAnalysisResult.suggestedAovTarget)}</p>
 </div>
 <div className="space-y-0.5">
 <span className="text-xs text-muted-foreground uppercase font-bold">ROI Biên kỳ vọng tối đa (Projected ROI Ceiling)</span>
 <p className="text-xs font-black text-emerald-500 ">+{aiAnalysisResult.roiBumping}%</p>
 </div>
 </div>

 </div>
 )}

 </div>
 );
}
