import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Customer, TierConfig } from "@/types";
import { User, ChevronRight, TrendingUp } from "lucide-react";

interface CustomerProgressGridProps {
  customers: Customer[];
  tiers: TierConfig[];
}

export function CustomerProgressGrid({ customers, tiers }: CustomerProgressGridProps) {
  // Sort tiers by threshold
  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  const getNextTier = (currentPoints: number) => {
    return sortedTiers.find(t => t.threshold > currentPoints);
  };

  const getCurrentTier = (currentPoints: number) => {
    return [...sortedTiers].reverse().find(t => t.threshold <= currentPoints) || sortedTiers[0];
  };

  // Find top 6 customers closest to next tier
  const progressData = customers
    .map(c => {
      const currentPoints = c.points || 0;
      const currentTier = getCurrentTier(currentPoints);
      const nextTier = getNextTier(currentPoints);
      
      if (!nextTier) return null;

      const range = nextTier.threshold - currentTier.threshold;
      const progressValue = range > 0 ? ((currentPoints - currentTier.threshold) / range) * 100 : 0;
      const pointsToNext = nextTier.threshold - currentPoints;

      return {
        customer: c,
        currentTier,
        nextTier,
        progress: Math.min(100, Math.max(0, progressValue)),
        pointsToNext
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => (100 - a.progress) - (100 - b.progress)) // Sort by % completion
    .slice(0, 6);

  if (progressData.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-heading flex items-center">
          <TrendingUp className="w-5 h-5 mr-3 text-indigo-500" /> Theo dõi thăng hạng
        </h3>
        <p className="text-xs text-muted-foreground font-medium">Top 6 thành viên sắp thăng hạng</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {progressData.map((data, idx) => (
          <Card key={data.customer.id} className="border-border/40 hover:border-primary/30 transition-all bg-card/40 backdrop-blur-sm group overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                {data.nextTier.name.toLowerCase().includes('crown') || data.nextTier.name.toLowerCase().includes('atelier') ? '👑' : '⭐'}
             </div>
             <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate text-foreground">{data.customer.name}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Hạng: <span className="font-bold uppercase" style={{ color: data.currentTier.color }}>{data.currentTier.name}</span>
                      </p>
                   </div>
                </div>

                <div className="space-y-1.5">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">{data.customer.points} pts</span>
                      <span className="text-primary">{data.nextTier.name} ({data.nextTier.threshold} pts)</span>
                   </div>
                   <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-primary transition-all duration-1000" 
                         style={{ width: `${data.progress}%`, backgroundColor: data.nextTier.color }}
                      />
                   </div>
                   <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
                      <span>{data.progress.toFixed(1)}% Hoàn thành</span>
                      <span>Còn {data.pointsToNext.toLocaleString()} pts</span>
                   </div>
                </div>

                <div className="pt-1 flex justify-end">
                   <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      Hỗ trợ khách hàng <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
