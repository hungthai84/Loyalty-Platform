import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Gift, Crown, ArrowRight, Shield, Award, Check, Gem, Trophy, Diamond, User } from 'lucide-react';
import * as motion from "motion/react-client";
import { TierConfig } from '@/types';

const ICON_MAP: Record<string, any> = {
  star: Star,
  gift: Gift,
  crown: Crown,
  shield: Shield,
  award: Award,
  gem: Gem,
  trophy: Trophy,
  diamond: Diamond,
  user: User,
};

interface LoyaltyTiersProps {
  tiers: TierConfig[];
}

export function LoyaltyTiers({ tiers }: LoyaltyTiersProps) {
  // We can supplement default benefits if they are missing from DB
  const getBenefits = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'member':
        return ['Tích lũy điểm khi mua hàng', 'Nhận thông tin bộ sưu tập mới', 'Quà tặng sinh nhật cơ bản'];
      case 'essential':
        return ['Tất cả đặc quyền Member', 'Ưu tiên mua các sản phẩm limited', 'Miễn phí giao hàng toàn quốc', 'Quà tặng sinh nhật cao cấp'];
      case 'icon':
        return ['Tất cả đặc quyền Essential', 'Có stylist tư vấn riêng 1-1', 'Tham dự Private Event', 'Phiếu mua hàng tự động hàng quý'];
      case 'atelier':
        return ['Tất cả đặc quyền Icon', 'Thiết kế trang sức độc bản', 'Dịch vụ Spa trang sức trọn đời', 'Limousine đưa đón mua sắm'];
      default:
        return ['Tích lũy điểm khi mua hàng', 'Hỗ trợ khách hàng ưu tiên'];
    }
  };

  const getRequirements = (tier: TierConfig) => {
     if (tier.threshold === 0) return "Tự động kích hoạt khi tham gia.";
     return `Yêu cầu đạt tối thiểu ${tier.threshold.toLocaleString()} điểm tích lũy trong vòng 12 tháng.`;
  };

  const getTierIcon = (tier: TierConfig) => {
    if (tier.icon && ICON_MAP[tier.icon]) {
      return ICON_MAP[tier.icon];
    }
    switch (tier.name.toLowerCase()) {
      case 'icon': return Shield;
      case 'atelier': return Crown;
      case 'essential': return Award;
      default: return Star;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold font-heading flex items-center">
          <Crown className="w-6 h-6 mr-3 text-rose-500" /> Cấu trúc Phân hạng
        </h3>
        <p className="text-xs text-muted-foreground font-medium italic">Di chuột lên thẻ để xem đặc quyền & điều kiện</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {tiers.map((tier, index) => {
          const benefits = tier.benefits?.map(b => b.name) || getBenefits(tier.name);
          const Icon = getTierIcon(tier);
          const requirements = getRequirements(tier);
          
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-[420px] [perspective:1000px] group"
            >
              <motion.div 
                className="relative w-full h-full [transform-style:preserve-3d] transition-all duration-700 group-hover:[transform:rotateY(180deg)] cursor-pointer"
              >
                {/* FRONT SIDE */}
                <Card className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-none bg-white p-0 shadow-sm rounded-[32px] flex flex-col">
                  <div 
                    className="h-3 w-full absolute top-0 left-0" 
                    style={{ backgroundColor: tier.color || 'var(--primary)' }} 
                  />
                  
                  <CardHeader className="pt-10 relative pb-4 px-8">
                    <div className="absolute top-8 right-8 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-20 h-20" style={{ color: tier.color }} />
                    </div>
                    <Badge 
                      variant="outline" 
                      className="w-fit mb-4 border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5"
                      style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
                    >
                      {tier.threshold > 0 ? `${tier.threshold.toLocaleString()} ĐIỂM` : 'MẶC ĐỊNH'}
                    </Badge>
                    <CardTitle className="text-[32px] font-black tracking-tighter" style={{ color: tier.color }}>
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">
                       {tier.threshold === 0 ? "Thành viên ban đầu" : "Thành viên hạng cấp"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col justify-center gap-8 px-8 pb-12">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Tỷ lệ tích lũy</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black tracking-tighter" style={{ color: tier.color }}>{tier.multiplier || 1}x</span>
                          <span className="text-xs text-muted-foreground font-medium">Extra Points</span>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-dashed border-muted">
                        <div className="flex items-center gap-3 text-[#2f6cf5]">
                           <div className="w-8 h-8 rounded-full bg-[#2f6cf5]/10 flex items-center justify-center">
                              <ArrowRight className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold">Xem chi tiết đặc quyền</span>
                        </div>
                     </div>
                  </CardContent>
                </Card>

                {/* BACK SIDE */}
                <Card 
                  className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden border-none p-0 shadow-xl rounded-[32px] flex flex-col"
                  style={{ backgroundColor: tier.color || 'var(--primary)' }}
                >
                   <CardHeader className="pt-8 pb-4 px-8 text-white">
                      <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                         <Gift className="w-6 h-6" /> Đặc quyền {tier.name}
                      </CardTitle>
                      <div className="h-0.5 w-12 bg-white/40 rounded-full mt-2" />
                   </CardHeader>

                   <CardContent className="flex-1 px-8 pb-8 flex flex-col gap-6 text-white/90">
                      <ul className="space-y-3">
                        {benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={3} />
                            <span className="text-sm font-medium leading-tight">{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-6 border-t border-white/20">
                         <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-white/70" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Điều kiện duy trì</span>
                         </div>
                         <p className="text-[11px] font-medium leading-relaxed italic text-white/80">
                            {requirements}
                         </p>
                      </div>
                   </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
