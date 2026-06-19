import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Sparkles, 
  Crown, 
  Gem, 
  Award, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Coins, 
  Zap, 
  Heart, 
  ShieldCheck,
  Percent
} from "lucide-react";
import * as motion from "motion/react-client";

interface BenefitItem {
  icon: any;
  label: string;
  value: string;
  isCustomReward: boolean;
}

interface TierDetails {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeTextColor: string;
  badgeBgColor: string;
  pointsReq: string;
  icon: any;
  multiplier: string;
  summary: string;
  rewards: BenefitItem[];
}

export function BenefitsPreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTier, setActiveTier] = useState<"member" | "essential" | "icon" | "atelier">("essential");

  const TIERS: Record<string, TierDetails> = {
    member: {
      name: "Member",
      color: "text-slate-500",
      bgColor: "bg-slate-500/5",
      borderColor: "border-slate-500/20",
      badgeTextColor: "text-slate-600",
      badgeBgColor: "bg-slate-600/10",
      pointsReq: "Từ 0 pts",
      icon: Award,
      multiplier: "1.0x",
      summary: "Khởi đầu tuyệt vời cho hành trình phong cách của bạn.",
      rewards: [
        { icon: Coins, label: "Tỉ lệ tích lũy điểm", value: "1.0x (Cơ bản)", isCustomReward: false },
        { icon: Gift, label: "Món quà thăng hạng", value: "Thiệp tay Seva Heritage", isCustomReward: true },
        { icon: Heart, label: "Ưu đãi sinh nhật", value: "Một phần quà lưu niệm Seva", isCustomReward: true },
        { icon: ShieldCheck, label: "Vệ sinh trang sức", value: "Chiết khấu 20% dịch vụ Spa", isCustomReward: false },
        { icon: Sparkles, label: "Sự kiện mua sắm", value: "Nhận thông tin sớm về BST mới", isCustomReward: false },
      ]
    },
    essential: {
      name: "Essential",
      color: "text-amber-500",
      bgColor: "bg-amber-500/5",
      borderColor: "border-amber-500/20",
      badgeTextColor: "text-amber-600",
      badgeBgColor: "bg-amber-600/10",
      pointsReq: "Từ 500 pts",
      icon: Crown,
      multiplier: "1.25x",
      summary: "Trải nghiệm nâng tầm với nhiều voucher giảm giá giá trị.",
      rewards: [
        { icon: Coins, label: "Tỉ lệ tích lũy điểm", value: "1.25x (Tăng 25%)", isCustomReward: false },
        { icon: Percent, label: "Món quà thăng hạng", value: "Voucher giảm giá 500k", isCustomReward: true },
        { icon: Gift, label: "Ưu đãi sinh nhật", value: "Voucher trị giá 1M", isCustomReward: true },
        { icon: ShieldCheck, label: "Vệ sinh trang sức", value: "Miễn phí đánh bóng trang sức", isCustomReward: false },
        { icon: Sparkles, label: "Đặc quyền mua trước", value: "Được đặt trước sản phẩm limited", isCustomReward: true },
      ]
    },
    icon: {
      name: "Icon",
      color: "text-sky-500",
      bgColor: "bg-sky-500/5",
      borderColor: "border-sky-500/20",
      badgeTextColor: "text-sky-600",
      badgeBgColor: "bg-sky-600/10",
      pointsReq: "Từ 2,000 pts",
      icon: Gem,
      multiplier: "1.5x",
      summary: "Biểu tượng phong cách đích thực với dịch vụ cá nhân đặt riêng.",
      rewards: [
        { icon: Coins, label: "Tỉ lệ tích lũy điểm", value: "1.5x (Tăng 50%)", isCustomReward: false },
        { icon: Percent, label: "Món quà thăng hạng", value: "Voucher 1.5M + Nến thơm cao cấp", isCustomReward: true },
        { icon: Gift, label: "Ưu đãi sinh nhật", value: "Hộp quà hoa di sản Seva độc bản", isCustomReward: true },
        { icon: ShieldCheck, label: "Vệ sinh trang sức", value: "Bộ đệm đánh bóng chuyên nghiệp trọn đời", isCustomReward: false },
        { icon: Sparkles, label: "Phòng Lounge VIP", value: "Ưu đãi giảm 50% khi dùng Private Lounge", isCustomReward: true },
        { icon: Crown, label: "Tư vấn thiết kế", value: "Chuyên viên stylist hỗ trợ phong cách riêng", isCustomReward: true },
      ]
    },
    atelier: {
      name: "Atelier",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/5",
      borderColor: "border-indigo-500/20",
      badgeTextColor: "text-indigo-600",
      badgeBgColor: "bg-indigo-600/10",
      pointsReq: "Từ 5,000 pts",
      icon: Sparkles,
      multiplier: "2.0x",
      summary: "Phục vụ tối thượng dành riêng cho những nhà sưu tầm xa xỉ bậc nhất.",
      rewards: [
        { icon: Coins, label: "Tỉ lệ tích lũy điểm", value: "2.0x (Tối đa toàn diện)", isCustomReward: false },
        { icon: Percent, label: "Món quà thăng hạng", value: "Tráp quà lụa thượng hạng Seva Premium", isCustomReward: true },
        { icon: Gift, label: "Ưu đãi sinh nhật", value: "Bộ trang sức bespoke đính đá quý quý hiếm", isCustomReward: true },
        { icon: ShieldCheck, label: "Vệ sinh trang sức", value: "Đặc trị vết xước & xi mạ bạch kim miễn phí", isCustomReward: false },
        { icon: Sparkles, label: "Phòng Lounge VIP", value: "Miễn phí 100% Private Lounge kèm tiệc trà", isCustomReward: true },
        { icon: Crown, label: "Stylist 1-1 tối thượng", value: "Quản lý showroom toàn hệ thống hỗ trợ 24/7", isCustomReward: true },
      ]
    }
  };

  const selectedTier = TIERS[activeTier];
  const SelectedIcon = selectedTier.icon;

  return (
    <Card id="benefits-preview-card" className="border border-border/70 bg-card hover:border-primary/30 transition-all rounded-[10px] shadow-sm text-left overflow-hidden relative">
      {/* Decorative Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-amber-400 via-sky-400 to-indigo-500" />
      
      {/* Header section with toggle button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 md:p-6 flex items-center justify-between cursor-pointer select-none hover:bg-muted/20 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-[8px] text-primary">
            <Gift className="w-5 h-5 text-[#2f6cf5]" />
          </div>
          <div>
            <h4 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              Bản Xem Trước Đặc Quyền Hội Viên (Benefits Preview)
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/5 font-extrabold px-1.5 py-0.5 rounded-sm">
                Real-time
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tra cứu nhanh các dòng voucher chào mừng, chiết khấu dịch vụ và hạn mức tối đa cho từng phân hạng.
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="p-1.5 rounded-[8px] bg-muted hover:bg-muted-foreground/10 transition-colors text-muted-foreground"
          aria-label={isOpen ? "Thu nhỏ đặc quyền" : "Mở rộng đặc quyền"}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="px-5 pb-6 md:px-6 border-t border-border/40"
        >
          {/* Tier Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-5 pb-4">
            {Object.entries(TIERS).map(([key, value]) => {
              const TierIcon = value.icon;
              const isSelected = activeTier === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTier(key as any)}
                  className={`flex items-center justify-between p-3 rounded-[10px] border transition-all text-left ${
                    isSelected 
                      ? `${value.borderColor} ${value.bgColor} ring-1 ring-primary/10` 
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TierIcon className={`w-4 h-4 shrink-0 ${isSelected ? value.color : "text-muted-foreground/70"}`} />
                    <span className={`text-xs font-bold truncate ${isSelected ? "text-foreground font-black" : ""}`}>
                      {value.name}
                    </span>
                  </div>
                  <Badge className={`text-[9px] font-mono font-bold shrink-0 leading-none py-0.5 px-1.5 rounded-full ${
                    isSelected ? `${value.badgeTextColor} ${value.badgeBgColor}` : "bg-muted text-muted-foreground"
                  }`}>
                    {value.multiplier}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Detailed benefits container */}
          <div className={`p-5 rounded-[12px] border ${selectedTier.borderColor} ${selectedTier.bgColor} transition-all duration-300 relative`}>
            {/* Background design elements */}
            <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
              <SelectedIcon className={`w-28 h-28 ${selectedTier.color}`} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/10 relative z-10">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <SelectedIcon className={`w-5 h-5 ${selectedTier.color}`} />
                  <h5 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
                    Hạng Vàng: {selectedTier.name}
                  </h5>
                  <Badge variant="outline" className={`text-[10px] font-mono leading-none ${selectedTier.badgeTextColor} ${selectedTier.badgeBgColor}`}>
                    Hệ số tích điểm: {selectedTier.multiplier}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground/90 mt-1">
                  {selectedTier.summary}
                </p>
              </div>

              <div className="shrink-0 text-left md:text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Yêu cầu duy trì</span>
                <span className="text-xs font-black text-foreground">{selectedTier.pointsReq}</span>
              </div>
            </div>

            {/* List of precise rewards & discounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {selectedTier.rewards.map((reward, i) => {
                const RewardIcon = reward.icon;
                return (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded-[8px] bg-background/55 dark:bg-zinc-950/25 border border-border/40 hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-[6px] ${selectedTier.badgeBgColor} ${selectedTier.badgeTextColor}`}>
                        <RewardIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-foreground block">
                          {reward.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          {reward.isCustomReward ? "Quà độc quyền Seva" : "Tính năng hệ thống"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right pl-2">
                      <span className={`text-xs font-black ${reward.isCustomReward ? "text-emerald-500" : "text-[#2f6cf5]"}`}>
                        {reward.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Loyalty statement summary */}
            <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Đồng bộ tự động với chính sách giảm giá & ưu đãi Seva Premium.
              </span>
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-[#2f6cf5]">
                Seva Club
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
