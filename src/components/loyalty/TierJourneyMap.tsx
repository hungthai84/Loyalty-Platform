import React from 'react';
import { TierConfig } from '@/types';
import { motion } from 'motion/react';
import { ChevronRight, Award, Trophy, Star, Shield, Medal, Gem, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierJourneyMapProps {
  tiers: TierConfig[];
}

export function TierJourneyMap({ tiers }: TierJourneyMapProps) {
  if (!tiers || tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  return (
    <div className="bg-card border border-border rounded-[10px] p-6 mb-8 overflow-x-auto shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-heading flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Bản Đồ Thăng Hạng
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Lộ trình nâng hạng hội viên theo điểm số</p>
        </div>
      </div>
      
      <div className="relative min-w-[700px] py-12 px-8">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-muted rounded-full -translate-y-1/2 overflow-hidden shadow-inner">
           <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 w-full opacity-30" />
        </div>

        <div className="relative flex justify-between items-center z-10">
          {sortedTiers.map((tier, idx) => {
            const nameLower = tier.name.toLowerCase();
            let TierIcon = Star;
            if (nameLower.includes("member")) TierIcon = Shield;
            else if (nameLower.includes("essential") || nameLower.includes("silver")) TierIcon = Medal;
            else if (nameLower.includes("icon") || nameLower.includes("gold") || nameLower.includes("vip")) TierIcon = Award;
            else if (nameLower.includes("atelier") || nameLower.includes("platinum")) TierIcon = Gem;
            else if (nameLower.includes("royal") || nameLower.includes("diamond")) TierIcon = Crown;

            return (
              <motion.div 
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="flex flex-col items-center relative group"
              >
                <div 
                  className="absolute -top-10 text-[10px] font-black tracking-widest text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50"
                  style={{ color: tier.color }}
                >
                  {tier.threshold.toLocaleString()} PTS
                </div>

                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-card border-4 z-10 transition-transform group-hover:scale-110 shadow-lg relative"
                  style={{ borderColor: tier.color, backgroundColor: `${tier.color}15` }}
                >
                  <TierIcon className="w-6 h-6" style={{ color: tier.color }} />
                  
                  {/* Outer glow on hover */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10"
                    style={{ backgroundColor: tier.color }}
                  />
                </div>

                <div className="absolute -bottom-10 flex flex-col items-center">
                  <span className="text-sm font-bold whitespace-nowrap text-foreground">{tier.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">x{tier.multiplier} Rate</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
