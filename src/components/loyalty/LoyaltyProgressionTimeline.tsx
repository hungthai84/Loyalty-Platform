import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Award, 
  Gem, 
  Crown, 
  Star,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  label: string;
  points: number;
  icon: React.ReactNode;
  isUnlocked: boolean;
  date?: string;
  reward?: string;
}

interface LoyaltyProgressionTimelineProps {
  currentPoints: number;
  tierName: string;
}

export function LoyaltyProgressionTimeline({ currentPoints, tierName }: LoyaltyProgressionTimelineProps) {
  const milestones: Milestone[] = [
    { 
      id: "m1", 
      label: "Thành viên Mới", 
      points: 0, 
      icon: <Circle className="w-4 h-4" />, 
      isUnlocked: true,
      date: "01/01/2026"
    },
    { 
      id: "m2", 
      label: "Hạng Essential", 
      points: 500, 
      icon: <Star className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 500,
      reward: "Voucher 500k",
      date: currentPoints >= 500 ? "15/02/2026" : undefined
    },
    { 
      id: "m3", 
      label: "Hạng Icon", 
      points: 1000, 
      icon: <Gem className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 1000,
      reward: "Quà tặng Sinh nhật",
      date: currentPoints >= 1000 ? "10/05/2026" : undefined
    },
    { 
      id: "m4", 
      label: "Hạng Atelier", 
      points: 2500, 
      icon: <Crown className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 2500,
      reward: "Dịch vụ Spa trọn đời"
    },
    { 
      id: "m5", 
      label: "Thượng khách Royal", 
      points: 5000, 
      icon: <Award className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 5000,
      reward: "Chuyến du lịch Paris"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Lộ trình thăng cấp (Loyalty Journey)
          </h3>
          <p className="text-xs text-muted-foreground">Theo dõi tiến trình từ khách hàng mới đến thượng khách.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-primary">{currentPoints.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Điểm hiện tại</span>
        </div>
      </div>

      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-muted rounded-full" />
        
        {/* Actual Progress Line */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(100, (currentPoints / 5000) * 100)}%` }}
          className="absolute left-[19px] top-4 w-1 bg-primary rounded-full z-10"
        />

        <div className="space-y-12">
          {milestones.map((ms, idx) => (
            <motion.div 
              key={ms.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-12 flex items-start gap-4 group"
            >
              {/* Point Indicator */}
              <div className={cn(
                "absolute left-0 w-10 h-10 rounded-full border-4 border-background flex items-center justify-center z-20 transition-all duration-500 shadow-sm",
                ms.isUnlocked ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
              )}>
                {ms.isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : ms.icon}
              </div>

              <div className="pt-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "text-sm font-black tracking-tight",
                    ms.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {ms.label}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {ms.points} pts
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-1">
                   {ms.date && (
                     <span className="text-[10px] font-bold text-[#2f6cf5] flex items-center gap-1 bg-blue-500/5 px-2 py-0.5 rounded">
                       <ChevronRight className="w-2.5 h-2.5" /> Đạt được lúc: {ms.date}
                     </span>
                   )}
                   {ms.reward && (
                     <span className={cn(
                       "text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded",
                       ms.isUnlocked ? "text-emerald-500 bg-emerald-500/5" : "text-muted-foreground/60 bg-muted/30"
                     )}>
                       🎁 Quà: {ms.reward} {ms.isUnlocked ? "(Đã mở)" : "(Khóa)"}
                     </span>
                   )}
                </div>

                {idx < milestones.length - 1 && !milestones[idx+1].isUnlocked && ms.isUnlocked && (
                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-2xl animate-pulse">
                    <p className="text-[11px] font-bold text-primary flex items-center gap-2">
                       <ChevronRight className="w-3 h-3" /> Cần thêm {(milestones[idx+1].points - currentPoints).toLocaleString()} điểm để thăng hạng {milestones[idx+1].label}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
