import React, { useState, useMemo } from 'react';
import * as motion from "motion/react-client";
import { 
  Calculator,
  Percent,
  Settings2,
  TrendingUp,
  Coins,
  Medal,
  Award,
  Crown,
  Star,
  Sparkles,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const TIERS = [
  { id: 'member', name: 'Member', icon: Star, color: 'text-zinc-500', bg: 'bg-zinc-100', req: '0 - 1.49m', multiplier: 1.0 },
  { id: 'essential', name: 'Essential', icon: Medal, color: 'text-blue-500', bg: 'bg-blue-50', req: '1.5m - 3.49m', multiplier: 2.0 },
  { id: 'icon', name: 'Icon', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50', req: '3.5m - 7.99m', multiplier: 4.0 },
  { id: 'atelier', name: 'Atelier', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50', req: '8m+', multiplier: 6.0 },
];

export function TierPointAnalysis() {
  const [baseCashbackPercent, setBaseCashbackPercent] = useState<number>(1);
  const [aov, setAov] = useState<number>(750000);
  const [pointScale, setPointScale] = useState<number>(10000); // 1 point = ? VND spent
  const [simSpent, setSimSpent] = useState<string>("120000000");

  const calculateSimulatedTier = (spentVal: number) => {
    if (spentVal >= 1000000000) {
      return {
        name: "Atelier",
        color: "#2f6cf5",
        multiplier: "2.0x",
        badgeColor: "bg-[#2f6cf5]/15 text-[#2f6cf5]",
        benefits: [
          "Bao gồm tất cả quyền lợi của hạng Icon",
          "Thiết kế trang sức độc bản",
          "Dịch vụ Spa trang sức trọn đời",
          "Limousine đưa đón mua sắm"
        ],
        nextThreshold: "Cao nhất",
        remainingToNext: 0
      };
    } else if (spentVal >= 250000000) {
      return {
        name: "Icon",
        color: "#f59e0b",
        multiplier: "1.5x",
        badgeColor: "bg-[#f59e0b]/15 text-[#f59e0b]",
        benefits: [
          "Bao gồm tất cả quyền lợi của hạng Essential",
          "Có stylist tư vấn riêng 1-1",
          "Tham dự Private Event",
          "Phiếu mua hàng tự động hàng quý"
        ],
        nextThreshold: "1.000.000.000 đ",
        remainingToNext: 1000000000 - spentVal
      };
    } else if (spentVal >= 50000000) {
      return {
        name: "Essential",
        color: "#10b981",
        multiplier: "1.25x",
        badgeColor: "bg-[#10b981]/15 text-[#10b981]",
        benefits: [
          "Bao gồm tất cả quyền lợi của hạng Member",
          "Ưu tiên mua các sản phẩm limited",
          "Miễn phí giao hàng toàn quốc",
          "Quà tặng sinh nhật cao cấp"
        ],
        nextThreshold: "250.000.000 đ",
        remainingToNext: 250000000 - spentVal
      };
    } else {
      return {
        name: "Member",
        color: "#94a3b8",
        multiplier: "1.0x",
        badgeColor: "bg-muted text-muted-foreground",
        benefits: [
          "Tích lũy 1% giá trị hóa đơn quy thành điểm chi tiêu",
          "Nhận thông tin sớm nhất về các BST giới hạn ra mắt hàng tháng",
          "Nhận thiệp chúc mừng thiết kế tinh xảo kèm quà tặng lưu niệm từ Seva"
        ],
        nextThreshold: "50.000.000 đ",
        remainingToNext: 50000000 - spentVal
      };
    }
  };

  const analysis = useMemo(() => {
    // Value of 1 point based on base cash back
    // If you spend 10,000 VND and get 1 point, and the base cashback is 1%
    // 1% of 10,000 is 100 VND. So 1 Point = 100 VND when spend is 10,000.
    const pointValue = (pointScale * baseCashbackPercent) / 100;

    return TIERS.map(tier => {
      const tierCashbackPercent = baseCashbackPercent * tier.multiplier;
      const pointsEarnedPerAov = (aov / pointScale) * tier.multiplier;
      const amountGainedInVnd = pointsEarnedPerAov * pointValue; // equivalent to (aov * tierCashbackPercent / 100)
      
      return {
        ...tier,
        tierCashbackPercent,
        pointsEarnedPerAov,
        amountGainedInVnd,
        pointValue
      };
    });
  }, [baseCashbackPercent, aov, pointScale]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Calculator Form */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-md flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> 
              Cấu hình thông số điểm
            </CardTitle>
            <CardDescription className="text-xs">
              Thiết lập tỷ lệ và giá trị để mô phỏng chính sách hạng
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="base-cb" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Percent className="w-4 h-4 text-emerald-500" />
                Mức % ưu đãi mong muốn (Hạng cơ bản)
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="base-cb"
                  type="number" 
                  value={baseCashbackPercent} 
                  onChange={(e) => setBaseCashbackPercent(Number(e.target.value) || 0)} 
                  className="font-mono bg-muted"
                  step="0.5"
                  min="0"
                />
                <span className="text-muted-foreground font-bold">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Tỷ lệ hoàn tiền/giảm giá mong muốn cho hạng Member. Các hạng khác sẽ nhân theo hệ số.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="aov" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Giá trị đơn hàng trung bình (AOV)
              </Label>
              <div className="relative">
                <Input 
                  id="aov"
                  type="number" 
                  value={aov} 
                  onChange={(e) => setAov(Number(e.target.value) || 0)} 
                  className="font-mono pr-12 bg-muted"
                  step="50000"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">VNĐ</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="point-scale" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Settings2 className="w-4 h-4 text-amber-500" />
                Quy đổi mua hàng
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input 
                    id="point-scale"
                    type="number" 
                    value={pointScale} 
                    onChange={(e) => setPointScale(Number(e.target.value) || 0)} 
                    className="font-mono bg-muted"
                    step="1000"
                    min="1000"
                  />
                </div>
                <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">VNĐ = 1 Điểm</span>
              </div>
            </div>
            
            <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-border mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">TÓM TẮT THUẬT TOÁN</span>
              </div>
              <p className="text-sm leading-relaxed">
                Với mức chi tiêu <strong>{pointScale.toLocaleString()}đ</strong>, khách hàng được tặng <strong>1 điểm</strong>. <br/>
                Giá trị của 1 điểm tương đương <strong>{((pointScale * baseCashbackPercent) / 100).toLocaleString()}đ</strong> (mức Member).
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => {
                  const toastElement = document.createElement('div');
                  toastElement.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 bg-card border-[#2f6cf5]";
                  toastElement.innerHTML = `<div class="text-xs font-bold text-foreground">Lưu cấu hình phân tích hạng & điểm thành công!</div>`;
                  document.body.appendChild(toastElement);
                  setTimeout(() => document.body.removeChild(toastElement), 3000);
                }}
                className="w-full px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent"
              >
                <Calculator className="w-4 h-4" />
                Lưu định dạng tính toán
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Analysis Results */}
      <div className="lg:col-span-8 space-y-6">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {analysis.map((tier, idx) => (
            <Card key={tier.id} className="border-border/50 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
              <div className={`absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none`}>
                <tier.icon className="w-32 h-32" />
              </div>
              
              <CardHeader className="pb-2 border-b border-border/30 bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.bg} ${tier.color}`}>
                      <tier.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className={`text-md font-bold uppercase tracking-wider ${tier.color}`}>{tier.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Chi tiêu: {tier.req} VNĐ</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-black tracking-widest ${tier.color} border-${tier.color.replace('text-', '')}/30 bg-background`}>
                    x{tier.multiplier.toFixed(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Tỷ lệ ưu đãi ròng:</span>
                  <span className={`text-xl font-bold font-mono ${tier.color}`}>{tier.tierCashbackPercent.toFixed(1)}%</span>
                </div>
                
                <div className="h-px w-full bg-border/40"></div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ví dụ đơn hàng:</span>
                    <span className="font-bold">{aov.toLocaleString()}đ</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-500" /> 
                      Số điểm tích được:
                    </span>
                    <span className="font-bold">{Math.floor(tier.pointsEarnedPerAov).toLocaleString()} điểm</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mức tiền quy đổi:</span>
                    <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                      {Math.floor(tier.amountGainedInVnd).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
        
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Gợi ý Chiến lược
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Theo mức cấu hình trên, một khách hàng mới (Member) khi mua một sản phẩm trị giá <strong>{aov.toLocaleString()}đ</strong> sẽ tích lũy được <strong>{Math.floor(analysis[0].amountGainedInVnd).toLocaleString()}đ</strong> vào ví.
              Số tiền này đủ động lực để trừ trực tiếp vào đơn hàng kế tiếp (ví dụ như phí ship hoặc một phụ kiện nhỏ), giúp kích thích tỷ lệ mua lại (Repeat Purchase Rate) vào lần 2 và lần 3.
              Với khách Atelier, trải nghiệm ưu đãi hoàn tiền <strong>{analysis[3].tierCashbackPercent.toFixed(1)}%</strong> là cực kỳ hấp dẫn, biến họ thành người ủng hộ thương hiệu (Brand Advocate).
            </p>
          </CardContent>
        </Card>

        {/* 1. MÔ PHỎNG CẤU TRÚC PHÂN HẠNG SEVA CLUB (DEMO) */}
        <Card className="p-6 border border-[#2f6cf5]/20 bg-[#2f6cf5]/5 rounded-3xl mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2 text-[#2f6cf5] font-heading">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> Trình Mô phỏng Cấu trúc Phân hạng Khách hàng
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tính toán thăng hạng VIP ngay lập tức dựa trên tổng chi tiêu tích luỹ từ trước đến nay.
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-primary/10 border-primary/20 text-primary font-bold uppercase tracking-wider text-[10px]">
              Hạng Tiêu Chuẩn Config
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 bg-background/50 p-5 rounded-2xl border border-border/60">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
                  Nhập tổng doanh số tích lũy (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={Number(simSpent || 0).toLocaleString("vi-VN")}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\./g, "").replace(/[^\d]/g, "");
                      setSimSpent(clean ? clean : "0");
                    }}
                    className="w-full bg-background border border-border/80 p-3 pl-4 rounded-xl font-bold font-mono text-base outline-none focus:border-primary tracking-tight text-foreground"
                    placeholder="Ví dụ: 120.000.000"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-muted-foreground">VND</span>
                </div>
              </div>

              {/* Presets to click */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Chọn nhanh mẫu chi tiêu</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Khách lẻ (30M)", value: "30000000" },
                    { label: "Essential VIP (120M)", value: "120000000" },
                    { label: "Icon VIP (450M)", value: "450000000" },
                    { label: "Atelier VVIP (1.5B)", value: "1500000000" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSimSpent(option.value)}
                      className="px-3 py-2 bg-muted/40 text-xs font-bold rounded-xl text-left hover:bg-muted hover:border-primary/20 border border-transparent transition-all cursor-pointer"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            {(() => {
              const res = calculateSimulatedTier(Number(simSpent || 0));
              return (
                <div className="flex flex-col justify-between border-l border-border/40 pl-0 md:pl-6 pt-4 md:pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase block">HẠNG KHÁCH ĐẠT ĐƯỢC:</span>
                      <Badge className={cn("text-xs font-bold uppercase py-0.5 px-2.5 rounded-full border-none", res.badgeColor)}>
                        {res.name}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tighter" style={{ color: res.color }}>
                        {res.multiplier}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tốc độ tích luỹ điểm</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Đặc quyền độc quyền được kích hoạt:
                      </span>
                      <div className="space-y-1.5 font-sans leading-relaxed text-foreground/90">
                        {res.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span style={{ color: res.color }} className="font-extrabold mt-0.5">✓</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center bg-muted/20 p-2.5 rounded-lg mt-3">
                    {res.remainingToNext > 0 ? (
                      <span>Cần thêm <strong className="text-foreground font-semibold">{res.remainingToNext.toLocaleString("vi-VN")} đ</strong> để thăng hạng VIP kế tiếp ({res.nextThreshold})</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> Đã chạm tinh hoa đặc quyền Atelier cao cấp nhất!</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
