import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Crown, 
  Gem, 
  Award, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Heart,
  Shield,
  Zap,
} from "lucide-react";
import * as motion from "motion/react-client";

interface FeatureRow {
  category: string;
  name: string;
  description: string;
  silver: string | boolean;
  gold: string | boolean;
  diamond: string | boolean;
}

export function TierComparisonTable() {
  const [targetTier, setTargetTier] = useState<"gold" | "diamond">("gold");
  const [currentSimPoints, setCurrentSimPoints] = useState<number>(1420);

  // Hardcoded comparison data matching Gold, Silver, Diamond as requested
  const COMPARISON_FEATURES: FeatureRow[] = [
    {
      category: "Tỉ lệ điểm thưởng",
      name: "Hệ số tích điểm (Multiplier)",
      description: "Hệ số nhân điểm trên mỗi hóa đơn thanh toán",
      silver: "1.0x (Cơ bản)",
      gold: "1.25x (Ưu đãi)",
      diamond: "1.5x (Đặc quyền tối đa)"
    },
    {
      category: "Đặc quyền Thăng hạng",
      name: "Quà tặng chào mừng",
      description: "Bộ quà tặng đặc biệt được trao ngay khi thăng hạng thành công",
      silver: "Thiệp tay Seva Heritage",
      gold: "Voucher 500k + Bộ quà nến thơm",
      diamond: "Voucher 1.5M + Tráp quà lụa thượng hạng"
    },
    {
      category: "Dành riêng cho Ngày sinh nhật",
      name: "Sinh nhật hoàng gia",
      description: "Tiệc sắm hoặc quà tặng gửi trực tiếp trong tháng sinh nhật",
      silver: "Quà lưu niệm & Voucher 200k",
      gold: "Hộp quà hoa di sản + Voucher 1M",
      diamond: "Set trang sức độc bản đính đá quý + Tiệc trà Lounge biệt lập"
    },
    {
      category: "Chế tác & Bảo trì",
      name: "Spa & Vệ sinh trang sức",
      description: "Dịch vụ làm sạch, khảm đá gãy, đánh bóng sản phẩm",
      silver: "Giảm 20% chi phí dịch vụ",
      gold: "Miễn phí đánh bóng cơ bản trọn đời",
      diamond: "Đặc trị khuyết tật khảm đá & Xi mạ cao cấp miễn phí trọn đời"
    },
    {
      category: "Ủy thác Không gian",
      name: "Sử dụng Private Lounge",
      description: "Trải nghiệm phòng tiếp khách khép kín riêng tư tại Boutique",
      silver: false,
      gold: "Giảm 50% phí dịch vụ đặt phòng",
      diamond: "Miễn phí hoàn toàn 100% kèm trà bánh hoàng gia"
    },
    {
      category: "Nhân sự hỗ trợ",
      name: "Chuyên viên tư vấn riêng",
      description: "Đội ngũ phục vụ độc lập giải quyết tất cả nhu cầu về thiết kế",
      silver: "Hotline CSKH tiêu chuẩn",
      gold: "Hotline VIP ưu tiên xử lý nhanh",
      diamond: "Phó Giám đốc/Quản lý Showroom phụ trách trực tiếp 24/7"
    },
    {
      category: "Giao nhận & Bảo an",
      name: "Vận chuyển đặc nhiệm",
      description: "Ủy thác xe bảo an bàn giao tận tay sản phẩm kim hoàn",
      silver: "Theo phí đối tác vận chuyển",
      gold: "Miễn phí toàn quốc cho đơn trên 10M",
      diamond: "Bảo hiểm toàn phần & Miễn phí mọi hóa đơn"
    },
    {
      category: "Tiếp cận tuyệt mật",
      name: "Bộ sưu tập giới hạn",
      description: "Quyền đặt giữ trước các tuyệt phẩm độc bản giới hạn",
      silver: "Đăng ký mua ngày công chúng",
      gold: "Ưu tiên đặt giữ sớm trước 3 ngày",
      diamond: "Ngắm mẫu kín & Chốt giữ riêng trước 7 ngày"
    }
  ];

  // Goals calculation based on 1420 current point
  const goldThreshold = 500;
  const diamondThreshold = 2500;

  const pointsToGoldNext = Math.max(0, goldThreshold - currentSimPoints);
  const pointsToDiamondNext = Math.max(0, diamondThreshold - currentSimPoints);

  const selectedGoldCompleted = currentSimPoints >= goldThreshold;
  const selectedDiamondCompleted = currentSimPoints >= diamondThreshold;

  const activePointsDiff = targetTier === "gold" ? pointsToGoldNext : pointsToDiamondNext;
  const activeCompleted = targetTier === "gold" ? selectedGoldCompleted : selectedDiamondCompleted;
  const targetThresholdValue = targetTier === "gold" ? goldThreshold : diamondThreshold;
  const progressPercent = Math.min(100, (currentSimPoints / targetThresholdValue) * 100);

  return (
    <Card id="tier-comparison-matrix" className="p-6 md:p-8 border border-border/80 bg-background/50 dark:bg-zinc-950/40 backdrop-blur-md rounded-3xl shadow-xl text-left overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Header section with fine typography */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-border/10 pb-6 relative z-10">
        <div>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 mb-2 inline-block">
            Độc Quyền Thượng Lưu
          </span>
          <h3 className="text-xl md:text-2xl font-black font-heading text-foreground tracking-tight flex items-center gap-2 mt-1">
            <Crown className="w-6 h-6 text-amber-500 fill-amber-500/10" /> Bảng So Sánh Quyền Lợi Hạng VIP
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Hệ thống phân chia ba cấp bậc đặc quyền vàng: <strong className="text-zinc-400">Silver (Bạc)</strong>, <strong className="text-amber-500">Gold (Vàng)</strong> và <strong className="text-sky-400">Diamond (Kim Cương)</strong> giúp quý khách hàng dễ dàng theo dõi mục tiêu, thăng hạng vị thế và mở khóa những trải nghiệm nghệ thuật độc nhất thế giới.
          </p>
        </div>

        {/* Quick Simulator Controller */}
        <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 max-w-xs w-full lg:w-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Giả lập điểm tích:
            </span>
            <span className="text-xs font-extrabold text-foreground">{currentSimPoints.toLocaleString()} pts</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="4000" 
            step="50"
            value={currentSimPoints} 
            onChange={(e) => setCurrentSimPoints(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-muted-foreground/25 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
            <span>0 pts</span>
            <span>Gold (500 pts)</span>
            <span>Dia (2500 pts)</span>
          </div>
        </div>
      </div>

      {/* Grid Comparison Matrix for Large/Medium screen */}
      <div className="hidden md:block overflow-x-auto relative z-10 border border-border/50 rounded-2xl bg-card/60 backdrop-blur-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-sidebar/55">
              <th className="p-4 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider w-1/3">
                Đỉnh cao Đặc Quyền
              </th>
              
              <th className="p-4 text-center w-1/5 relative group border-l border-border/10">
                <div className="flex flex-col items-center gap-1">
                  <span className="p-1 px-2 text-[9px] font-black uppercase text-zinc-500 bg-zinc-500/10 rounded-md">
                    CƠ BẢN
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400 mt-1">
                    <Award className="w-4 h-4" />
                    <span className="font-extrabold text-sm tracking-tight">Silver (Bạc)</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-muted-foreground font-semibold mt-0.5">Từ 0 - 499 pts</span>
                </div>
              </th>

              <th className={`p-4 text-center w-1/5 relative group border-l border-border/10 transition-all ${currentSimPoints >= 500 && currentSimPoints < 2500 ? 'bg-amber-500/5' : ''}`}>
                <div className="flex flex-col items-center gap-1">
                  {currentSimPoints >= 500 && currentSimPoints < 2500 ? (
                    <span className="p-0.5 px-2 text-[8px] font-black uppercase text-amber-500 bg-amber-500/20 rounded-md animate-pulse">
                      HẠNG CỦA BẠN
                    </span>
                  ) : (
                    <span className="p-1 px-2 text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 rounded-md">
                      PHỔ BIỂN
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-amber-500 mt-1">
                    <Sparkles className="w-4 h-4 fill-amber-500/20" />
                    <span className="font-extrabold text-sm tracking-tight">Gold (Vàng)</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-amber-500 font-bold mt-0.5">Đặt từ 500 pts</span>
                </div>
              </th>

              <th className={`p-4 text-center w-1/5 relative group border-l border-border/10 transition-all ${currentSimPoints >= 2500 ? 'bg-indigo-500/5' : ''}`}>
                <div className="flex flex-col items-center gap-1">
                  {currentSimPoints >= 2500 ? (
                    <span className="p-0.5 px-2 text-[8px] font-black uppercase text-indigo-500 bg-indigo-500/20 rounded-md animate-pulse">
                      HẠNG CỦA BẠN
                    </span>
                  ) : (
                    <span className="p-1 px-2 text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 rounded-md">
                      TỐI THƯỢNG
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-sky-400 mt-1">
                    <Gem className="w-4 h-4 fill-sky-400/20" />
                    <span className="font-extrabold text-sm tracking-tight">Diamond (Kim Cương)</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-sky-400 font-bold mt-0.5">Đặt từ 2500 pts</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((row, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
              >
                <td className="p-4 align-top text-left">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block mb-0.5">{row.category}</span>
                  <strong className="text-xs font-bold text-foreground block">{row.name}</strong>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block font-normal leading-relaxed">{row.description}</span>
                </td>

                {/* Silver Value */}
                <td className="p-4 text-center align-middle border-l border-border/10">
                  {typeof row.silver === "boolean" ? (
                    row.silver ? <CheckCircle2 className="w-4 h-4 text-zinc-500 mx-auto" /> : <X className="w-4.5 h-4.5 text-muted-foreground/35 mx-auto" />
                  ) : (
                    <span className="text-xs font-medium text-foreground">{row.silver}</span>
                  )}
                </td>

                {/* Gold Value */}
                <td className={`p-4 text-center align-middle border-l border-border/10 transition-all ${currentSimPoints >= 500 && currentSimPoints < 2500 ? 'bg-amber-500/5' : ''}`}>
                  {typeof row.gold === "boolean" ? (
                    row.gold ? <CheckCircle2 className="w-5 h-5 text-amber-500 mx-auto" /> : <X className="w-4.5 h-4.5 text-muted-foreground/35 mx-auto" />
                  ) : (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{row.gold}</span>
                  )}
                </td>

                {/* Diamond Value */}
                <td className={`p-4 text-center align-middle border-l border-border/10 transition-all ${currentSimPoints >= 2500 ? 'bg-indigo-500/5' : ''}`}>
                  {typeof row.diamond === "boolean" ? (
                    row.diamond ? <CheckCircle2 className="w-5 h-5 text-indigo-500 mx-auto" /> : <X className="w-4.5 h-4.5 text-muted-foreground/35 mx-auto" />
                  ) : (
                    <span className="text-xs font-black text-indigo-600 dark:text-sky-300">{row.diamond}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-Friendly Comparison View (Cards Stack) */}
      <div className="block md:hidden space-y-6 relative z-10">
        <div className="bg-muted p-3 rounded-xl border flex items-center justify-between text-xs font-bold">
          <span className="text-muted-foreground">Chọn Hạng để so sánh Quyền lợi:</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setTargetTier("gold")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${targetTier === "gold" ? 'bg-amber-500 text-white shadow-sm' : 'bg-card text-muted-foreground border'}`}
            >
              Gold
            </button>
            <button 
              onClick={() => setTargetTier("diamond")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${targetTier === "diamond" ? 'bg-indigo-600 text-white shadow-sm' : 'bg-card text-muted-foreground border'}`}
            >
              Diamond
            </button>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${targetTier === "gold" ? "bg-amber-500/5 border-amber-500/20" : "bg-indigo-500/5 border-indigo-500/20"}`}>
          <div className="flex items-center gap-2 mb-4 justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              {targetTier === "gold" ? (
                <Sparkles className="w-5 h-5 text-amber-500" />
              ) : (
                <Gem className="w-5 h-5 text-sky-400" />
              )}
              <h4 className={`text-base font-black ${targetTier === "gold" ? "text-amber-500" : "text-sky-400"}`}>
                Hạng {targetTier === "gold" ? "Gold (Vàng)" : "Diamond (Kim Cương)"}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold bg-card p-1 px-2 border.5 rounded-md">
              Mốc: {targetTier === "gold" ? "500 pts" : "2500 pts"}
            </span>
          </div>

          <div className="space-y-4 text-xs font-medium">
            {COMPARISON_FEATURES.map((row, idx) => (
              <div key={idx} className="border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">{row.name}</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-[11px] font-normal italic">Cơ bản (Silver):</span>
                  <span className="text-zinc-500 font-bold">{row.silver || "—"}</span>
                </div>
                <div className="flex justify-between items-center mt-1 bg-card/45 p-1.5 rounded-lg border border-border/10 mt-1.5">
                  <span className={targetTier === "gold" ? "text-amber-500 font-extrabold" : "text-sky-400 font-extrabold"}>Quyền lợi {targetTier === "gold" ? "Gold" : "Diamond"}:</span>
                  <span className={targetTier === "gold" ? "text-amber-600 dark:text-amber-400 font-bold" : "text-indigo-600 dark:text-sky-300 font-bold"}>
                    {targetTier === "gold" ? row.gold : row.diamond}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Pursuit Interactive Calculator Dashboard */}
      <div className="mt-8 border-t border-border/20 pt-6 relative z-10 bg-sidebar/35 p-5 rounded-3xl border border-border/40">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-amber-500" /> Bản đồ thăng hạng của bạn
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Progress gauge tracking */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-semibold">Mục tiêu phấn đấu của bạn:</span>
              <div className="flex gap-2">
                <span 
                  onClick={() => setTargetTier("gold")}
                  className={`cursor-pointer px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border ${targetTier === "gold" ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' : 'bg-transparent text-muted-foreground'}`}
                >
                  Thăng hạng Gold
                </span>
                <span 
                  onClick={() => setTargetTier("diamond")}
                  className={`cursor-pointer px-3 py-1 rounded-full text-[11px] font-extrabold transition-all border ${targetTier === "diamond" ? 'bg-indigo-600/10 border-indigo-500 text-indigo-500' : 'bg-transparent text-muted-foreground'}`}
                >
                  Thăng hạng Diamond
                </span>
              </div>
            </div>

            {/* Simulated Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-end text-xs">
                <span className="text-muted-foreground font-bold">Điểm hiện tại: <strong className="text-foreground">{currentSimPoints}</strong> pts</span>
                <span className="text-xs font-extrabold font-heading text-foreground">
                  {targetTier === "gold" ? "Gold (500 pts)" : "Diamond (2500 pts)"}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/50 relative p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${targetTier === "gold" ? 'bg-amber-500' : 'bg-indigo-600'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/80">
                <span>Khởi đầu</span>
                <span className="font-bold">{progressPercent.toFixed(1)}% Hoàn thành</span>
              </div>
            </div>
          </div>

          {/* Upgrade Goal Verdict Info card */}
          <div className="lg:col-span-1 p-4 rounded-2xl bg-card border border-border/60">
            {activeCompleted ? (
              <div className="space-y-1 text-center lg:text-left">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5 mb-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-500/10" /> Đã đủ điều kiện hạng!
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Chúc mừng! Điểm tích lũy {currentSimPoints.toLocaleString()} pts đã vượt ngưỡng tối thiểu của hạng <strong className="text-foreground capitalize">{targetTier}</strong> ({targetThresholdValue} pts). Quý khách đã sẵn sàng tận hưởng trọn vẹn đặc quyền hạng cao cấp này.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-center lg:text-left">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Cần Phấn Đấu Thêm</span>
                <div className="text-xl font-heading font-black text-foreground">
                  +{activePointsDiff.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Quý khách chỉ còn cách mục tiêu thăng hạng <strong className={`capitalize ${targetTier === "gold" ? 'text-amber-500' : 'text-sky-400'}`}>{targetTier}</strong> chỉ <strong>{activePointsDiff}</strong> điểm. Sắm thêm trang sức, đính hôn nhân cưới hoặc nhận tư vấn phong mỹ để dọn đường nâng tầm vị thế di sản của mình!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
