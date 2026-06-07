import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Gift, Crown, ArrowRight, Shield, Award } from 'lucide-react';
import * as motion from "motion/react-client";
import { TierConfig } from '@/types';

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

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'icon': return Shield;
      case 'atelier': return Crown;
      case 'essential': return Award;
      default: return Star;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold font-heading flex items-center">
          <Crown className="w-5 h-5 mr-3 text-primary" /> Cấu trúc Phân hạng
        </h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier, index) => {
          const benefits = tier.benefits?.map(b => b.name) || getBenefits(tier.name);
          const Icon = getTierIcon(tier.name);
          
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card
                className="relative overflow-hidden group border border-border/50 bg-card/50 backdrop-blur-sm p-0 h-full transition-shadow hover:shadow-lg flex flex-col"
              >
                <div 
                  className="h-2 w-full absolute top-0 left-0" 
                  style={{ backgroundColor: tier.color || 'var(--primary)' }} 
                />
                
                <CardHeader className="pt-6 relative pb-4">
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="w-16 h-16 text-primary" style={{ color: tier.color }} />
                  </div>
                  <Badge 
                    variant="outline" 
                    className="w-fit mb-3 border-none text-xs font-bold font-mono px-2 py-1"
                    style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
                  >
                    {tier.threshold > 0 ? `${tier.threshold.toLocaleString()} ĐIỂM` : 'MẶC ĐỊNH'}
                  </Badge>
                  <CardTitle className="text-2xl font-black font-heading tracking-tight" style={{ color: tier.color }}>
                    {tier.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-6">
                  <div className="flex items-baseline gap-2 pb-5 border-b border-border/40">
                    <span
                      className="text-4xl font-black font-mono tracking-tighter"
                      style={{ color: tier.color }}
                    >
                      {tier.multiplier || 1}x
                    </span>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      Tốc độ tích lũy
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5" /> Đặc quyền
                    </h5>
                    <ul className="space-y-3">
                      {benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: tier.color || 'var(--primary)' }} />
                          <span className="text-sm leading-tight text-foreground/90">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
