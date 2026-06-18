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
      isUnlocked: true
    },
    { 
      id: "m2", 
      label: "Hạng Essential", 
      points: 500, 
      icon: <Star className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 500,
      reward: "Voucher 500k"
    },
    { 
      id: "m3", 
      label: "Hạng Icon", 
      points: 1000, 
      icon: <Gem className="w-4 h-4" />, 
      isUnlocked: currentPoints >= 1000,
      reward: "Quà tặng Sinh nhật"
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
    <div className="space-y-6 overflow-x-auto pb-4">
      <div className="flex items-center justify-between mb-8 min-w-[700px]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Lộ trình thăng cấp (Loyalty Journey)
          </h3>
          <p className="text-xs text-muted-foreground">Theo dõi tiến trình từ khách hàng mới đến thượng khách.</p>
        </div>
      </div>

      <div className="relative min-w-[700px] pt-4">
        {/* Progress Line Background */}
        <div className="absolute top-[34px] left-[10%] right-[10%] h-1 bg-muted rounded-full" />
        
        {/* Actual Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (currentPoints / 5000) * 100)}%` }}
          className="absolute top-[34px] left-[10%] h-1 bg-primary rounded-full z-10"
        />

        <div className="flex justify-between relative mt-0">
          {milestones.map((ms, idx) => (
            <motion.div 
              key={ms.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex flex-col items-center flex-1 group"
            >
              {/* Point Indicator */}
              <div className={cn(
                "w-10 h-10 rounded-full border-4 border-background flex items-center justify-center z-20 transition-all duration-500 shadow-sm relative",
                ms.isUnlocked ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
              )}>
                {ms.isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : ms.icon}
              </div>

              <div className="flex flex-col items-center justify-center text-center -mt-2 px-2 w-full">
                <h4 className={cn(
                  "text-xs font-black tracking-tight mb-1 line-clamp-1",
                  ms.isUnlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {ms.label}
                </h4>
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded min-w-max">
                  {ms.points} pts
                </span>
                
                <div className="flex flex-col items-center gap-1.5 mt-2 h-[40px]">
                   {ms.reward && (
                     <span className={cn(
                       "text-[9px] font-bold flex flex-col items-center px-2 py-1 rounded w-full line-clamp-2",
                       ms.isUnlocked ? "text-emerald-500 bg-emerald-500/5" : "text-muted-foreground/60 bg-muted/30"
                     )}>
                       <span>🎁 Quà:</span>
                       <span>{ms.reward} {ms.isUnlocked ? "(Đã mở)" : "(Khóa)"}</span>
                     </span>
                   )}
                </div>

                {idx < milestones.length - 1 && !milestones[idx+1].isUnlocked && ms.isUnlocked && (
                  <div className="mt-3 p-2 bg-primary/5 border border-primary/20 rounded-[10px] animate-pulse absolute -bottom-[4.5rem] w-[180%] z-20 shadow-md">
                    <p className="text-[10px] font-bold text-primary flex items-center justify-center gap-1 text-center">
                       <ChevronRight className="w-3 h-3 shrink-0" /> Cần {(milestones[idx+1].points - currentPoints).toLocaleString()} điểm để lên hạng
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
