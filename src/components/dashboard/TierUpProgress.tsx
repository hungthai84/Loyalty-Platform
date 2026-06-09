import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { getGuestCustomers } from "@/data/guestData";

export function TierUpProgress() {
  const customers = getGuestCustomers();
  
  // Find customers close to next tier
  const TIER_THRESHOLDS = [
    { name: "Essential", threshold: 500, color: "bg-emerald-500" },
    { name: "Icon", threshold: 2500, color: "bg-amber-500" },
    { name: "Atelier", threshold: 10000, color: "bg-blue-500" }
  ];

  const candidates = customers.map(c => {
    let nextTierName = "";
    let nextThreshold = -1;
    let targetColor = "";
    const pts = c.points || 0;

    for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
       if (pts < TIER_THRESHOLDS[i].threshold) {
          nextTierName = TIER_THRESHOLDS[i].name;
          nextThreshold = TIER_THRESHOLDS[i].threshold;
          targetColor = TIER_THRESHOLDS[i].color;
          break;
       }
    }

    if (nextThreshold !== -1) {
       const remaining = nextThreshold - pts;
       const progress = (pts / nextThreshold) * 100;
       return { ...c, nextTierName, nextThreshold, remaining, progress, targetColor };
    }
    return null;
  }).filter(Boolean).sort((a, b) => (a!.remaining) - (b!.remaining)).slice(0, 4);

  return (
    <Card className="rounded-[10px] shadow-sm border-border bg-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Sắp Lên Hạng
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {candidates.map(c => (
          <div key={c?.id} className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground truncate max-w-[120px]">{c?.name}</span>
              <span className="text-muted-foreground font-medium">
                Cần <span className="font-bold text-foreground">{c?.remaining} pts</span> &rarr; <span className="font-bold">{c?.nextTierName}</span>
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
               <div className={`h-full ${c?.targetColor} rounded-full`} style={{ width: `${Math.min(c?.progress || 0, 100)}%` }}></div>
            </div>
          </div>
        ))}
        {candidates.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">Không có dữ liệu.</div>
        )}
      </CardContent>
    </Card>
  );
}
