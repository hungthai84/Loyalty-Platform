import React, { useState } from 'react';
import { TierConfig } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Shield, Medal, Award, Gem, Crown, ChevronRight, Check, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierJourneyMapProps {
  tiers: TierConfig[];
}

export function TierJourneyMap({ tiers }: TierJourneyMapProps) {
  const [activePreviewTier, setActivePreviewTier] = useState<string | null>(null);

  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  // Set default active preview tier to the first/second one to guide the user
  const currentPreviewTier = sortedTiers.find(t => t.id === activePreviewTier) || sortedTiers[0];

  const getTierIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("member") || nameLower.includes("đồng") || nameLower.includes("bronze")) return Shield;
    if (nameLower.includes("essential") || nameLower.includes("bạc") || nameLower.includes("silver")) return Medal;
    if (nameLower.includes("icon") || nameLower.includes("vàng") || nameLower.includes("gold") || nameLower.includes("vip")) return Award;
    if (nameLower.includes("atelier") || nameLower.includes("bạch kim") || nameLower.includes("platinum")) return Gem;
    return Crown;
  };

  return (
    <div className="bg-card border border-border/70 rounded-[12px] p-6 mb-8 shadow-sm transition-all relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.02] dark:bg-primary/[0.01] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border/40">
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#2f6cf5] bg-[#2f6cf5]/10 px-2.5 py-1 rounded-md mb-2 inline-block">
            Lộ trình khách hàng
          </span>
          <h3 className="text-lg md:text-xl font-black font-heading flex items-center gap-2 text-foreground mt-1">
            <Trophy className="w-5.5 h-5.5 text-amber-500 animate-pulse" /> Bản Đồ Thăng Hạng Hội Viên
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng quan vòng đời thăng cấp và tích lũy hệ số của từng phân hạng đặc quyền.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-xs text-muted-foreground/80 italic font-medium bg-muted/30 px-3 py-1.5 rounded-md border border-border/40">
          💡 Click vào từng hạng để tương tác và xem nhanh quyền lợi
        </div>
      </div>

      {/* --- DESKTOP HORIZONTAL VIEW --- */}
      <div className="hidden lg:block py-14 px-12 relative">
        {/* Connection Line with Gradient */}
        <div className="absolute top-1/2 left-16 right-16 h-2 bg-muted dark:bg-zinc-800 rounded-full -translate-y-1/2 shadow-inner overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r transition-all duration-700"
            style={{
              backgroundImage: `linear-gradient(to right, ${sortedTiers.map(t => t.color).join(', ')})`,
              width: '100%'
            }}
          />
        </div>

        {/* Nodes Grid */}
        <div className="relative flex justify-between items-center z-10">
          {sortedTiers.map((tier, idx) => {
            const TierIcon = getTierIcon(tier.name);
            const isSelected = currentPreviewTier.id === tier.id;

            return (
              <div 
                key={tier.id}
                onClick={() => setActivePreviewTier(tier.id)}
                className="flex flex-col items-center relative cursor-pointer group"
              >
                {/* Threshold Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "absolute -top-12 text-[10px] font-black tracking-wider px-3 py-1 rounded-full border shadow-sm transition-all duration-300 pointer-events-none whitespace-nowrap",
                    isSelected 
                      ? "bg-foreground text-background border-foreground font-black scale-105" 
                      : "bg-card text-muted-foreground border-border group-hover:border-foreground/30"
                  )}
                  style={{ color: isSelected ? undefined : tier.color }}
                >
                  {tier.threshold === 0 ? "MỞ ĐẦU" : `${tier.threshold.toLocaleString()} PTS`}
                </motion.div>

                {/* Node Orb with Glow */}
                <div 
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center bg-card border-4 z-10 transition-all duration-300 relative shadow-md",
                    isSelected ? "scale-115 shadow-xl shadow-primary/10" : "hover:scale-105"
                  )}
                  style={{ 
                    borderColor: tier.color, 
                    backgroundColor: isSelected ? `${tier.color}25` : `${tier.color}08`,
                  }}
                >
                  <TierIcon 
                    className="w-7 h-7 transition-all duration-300" 
                    style={{ 
                      color: tier.color,
                      transform: isSelected ? 'scale(1.1) rotate(5deg)' : 'none'
                    }} 
                  />
                  
                  {/* Luxury dynamic outer halo on selection or hover */}
                  <div 
                    className={cn(
                      "absolute -inset-1 rounded-full opacity-0 blur-md -z-10 transition-opacity duration-300",
                      isSelected ? "opacity-30 animate-pulse" : "group-hover:opacity-15"
                    )}
                    style={{ backgroundColor: tier.color }}
                  />
                  
                  {/* Small check if reached (simulate progress highlight) */}
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-foreground border border-background flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 text-background stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Info Text below Node */}
                <div className="absolute -bottom-14 flex flex-col items-center">
                  <span className={cn(
                    "text-xs font-bold whitespace-nowrap transition-colors",
                    isSelected ? "text-foreground font-extrabold text-sm" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {tier.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-tighter mt-0.5">
                    Hệ số x{tier.multiplier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MOBILE/TABLET STACK TIMELINE --- */}
      <div className="lg:hidden relative py-6 left-1 text-left space-y-6">
        <div className="absolute top-4 bottom-4 left-6.5 w-1 bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b h-full"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${sortedTiers.map(t => t.color).join(', ')})`
            }}
          />
        </div>

        <div className="space-y-6 relative z-10">
          {sortedTiers.map((tier) => {
            const TierIcon = getTierIcon(tier.name);
            const isSelected = currentPreviewTier.id === tier.id;

            return (
              <div 
                key={tier.id}
                onClick={() => setActivePreviewTier(tier.id)}
                className={cn(
                  "flex gap-4 items-start cursor-pointer rounded-[10px] p-2 transition-all duration-200",
                  isSelected ? "bg-muted/40" : "hover:bg-muted/10"
                )}
              >
                {/* Node icon */}
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-card border-4 relative transition-all duration-300",
                    isSelected ? "scale-105" : ""
                  )}
                  style={{ 
                    borderColor: tier.color, 
                    backgroundColor: isSelected ? `${tier.color}25` : `${tier.color}08`,
                  }}
                >
                  <TierIcon className="w-5.5 h-5.5" style={{ color: tier.color }} />
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-foreground border border-background flex items-center justify-center">
                      <Check className="w-3 text-background stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Preview text */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-foreground font-heading">{tier.name}</h4>
                    <span 
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border" 
                      style={{ 
                        backgroundColor: `${tier.color}15`, 
                        color: tier.color, 
                        borderColor: `${tier.color}30` 
                      }}
                    >
                      Hệ số {tier.multiplier}x
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5 font-bold">
                    {tier.threshold === 0 ? "Giai đoạn bắt đầu" : `Đạt ngưỡng từ ${tier.threshold.toLocaleString()} PTS`}
                  </p>
                  <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-1 leading-relaxed">
                    {tier.description || "Hành trình thăng tiến thông minh cùng chính sách CSKH Seva Retail."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- LIVE INTERACTIVE VALUE DRAWER / HIGHLIGHT PANEL --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPreviewTier.id}
          initial={{ opacity: 0, height: 0, y: 10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="mt-14 pt-6 border-t border-border/40 text-left overflow-hidden"
        >
          <div className="bg-muted/30 dark:bg-zinc-900/30 p-5 rounded-[10px] border border-border/50 relative">
            <div className="absolute top-4 right-4 text-[10px] font-mono opacity-25 uppercase font-bold tracking-widest">
              Giao diện Đặc quyền
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-stretch">
              {/* Visual mini-banner representing the card aspect of the tier */}
              <div 
                className="w-full md:w-56 rounded-[8px] p-5 text-white flex flex-col justify-between aspect-[1.58/1] md:aspect-auto md:h-36 shrink-0 relative overflow-hidden shadow-md"
                style={{ backgroundColor: currentPreviewTier.color }}
              >
                {/* Floating decor decorative circles */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-start relative z-10">
                  <span className="font-heading font-black tracking-widest text-sm text-opacity-90">SEVA PREMIUM</span>
                  <Sparkles className="w-4 h-4 text-white/50" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-lg font-black tracking-tight leading-none">{currentPreviewTier.name}</p>
                  <p className="text-[10px] text-white/70 font-mono tracking-wider uppercase mt-1">Multi Rate: x{currentPreviewTier.multiplier}</p>
                </div>
                
                <div className="flex justify-between items-end relative z-10 text-[10px] text-white/80 font-mono">
                  <span>THƯỜNG NIÊN</span>
                  <span>{currentPreviewTier.threshold === 0 ? "Member" : `${currentPreviewTier.threshold.toLocaleString()} PTS`}</span>
                </div>
              </div>

              {/* Tier Details Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentPreviewTier.color }} />
                    <h4 className="text-base font-bold font-heading text-foreground">
                      Thông số {currentPreviewTier.name} Elite
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {currentPreviewTier.description || "Hãy trải nghiệm sự vượt bậc của hệ sinh thái VIP, tối đa hóa giá trị từng đơn hàng và nhận cơ hội đổi quà phong phú định kỳ."}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-border/40 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Ngưỡng tối thiểu</span>
                    <span className="text-sm font-extrabold text-foreground mt-0.5 block">{currentPreviewTier.threshold.toLocaleString()} PTS</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Tỉ lệ điểm cộng</span>
                    <span className="text-sm font-extrabold text-[#2f6cf5] mt-0.5 block" style={{ color: currentPreviewTier.color }}>
                      x{currentPreviewTier.multiplier} Trọng số
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Đặc quyền phát hành</span>
                    <span className="text-xs font-bold text-foreground mt-1 truncate block">
                      {currentPreviewTier.benefits && currentPreviewTier.benefits.length > 0 
                        ? `${currentPreviewTier.benefits.length} Quyền lợi hoạt động`
                        : "Chưa cấu hình đặc quyền"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* List inner actual benefits horizontally/grid if there are any */}
            {currentPreviewTier.benefits && currentPreviewTier.benefits.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  Khóa danh sách quyền lợi chi tiết của phân hạng:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentPreviewTier.benefits.map((benefit, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/40 text-xs font-medium text-foreground transition-all hover:border-[#2f6cf5]/20 hover:shadow-sm"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${currentPreviewTier.color}15` }}>
                        <Check className="w-3 h-3" style={{ color: currentPreviewTier.color }} />
                      </div>
                      <div className="truncate text-left flex-1 min-w-0">
                        <span className="font-bold mr-1.5">{benefit.name}:</span>
                        <span className="text-muted-foreground font-semibold text-[10px]">{benefit.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
