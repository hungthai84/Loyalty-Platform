import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// Simple div-based progress bar below
import { Trophy, Star, ShieldCheck, Crown } from "lucide-react";

const ACHIEVEMENTS = [
  { id: "a1", name: "Top Spender", description: "Chi tiêu vượt mốc 100M trong tháng", icon: "💎", unlocked: true, color: "from-blue-500 to-indigo-600" },
  { id: "a2", name: "Early Bird", description: "Mua sắm trong giờ vàng khai trương", icon: "🐦", unlocked: true, color: "from-amber-400 to-orange-500" },
  { id: "a3", name: "Diamond Member", description: "Đạt hạng Atelier sớm nhất", icon: "💍", unlocked: false, color: "from-purple-500 to-pink-500" },
  { id: "a4", name: "Loyalist", description: "Duy trì hạng Icon trên 12 tháng", icon: "🤝", unlocked: true, color: "from-emerald-400 to-teal-500" },
];

export function GamificationProgress({ currentPoints = 1420, nextTierPoints = 2500, currentTier = 'Essential', nextTier = 'Icon' }) {
    const progressPercent = Math.min(100, Math.max(0, (currentPoints / nextTierPoints) * 100));
    
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <CardHeader className="relative z-10 pb-4">
                <CardTitle className="font-heading flex items-center text-xl">
                    <Trophy className="w-5 h-5 mr-3 text-amber-500" /> Tiến trình hạng thành viên
                </CardTitle>
                <CardDescription>Theo dõi điểm thưởng theo cấu trúc hạng mục hiện tại.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Status */}
                    <div className="col-span-1 border border-border/40 rounded-xl p-5 bg-background/50 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-3 text-[#10b981] ring-4 ring-[#10b981]/5">
                            <Star className="w-8 h-8 fill-[#10b981]/20" />
                        </div>
                        <h4 className="font-bold text-lg text-foreground">{currentTier}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Hạng hiện tại</p>
                    </div>
 
                    {/* Progress Bar */}
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center px-2 sm:px-6 py-4">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Điểm tích lũy</p>
                                <p className="text-3xl font-black font-heading mt-1 text-primary tracking-tight">
                                    {currentPoints.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground ml-1">pts</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-muted-foreground capitalize">Đích đến: {nextTier}</p>
                                <p className="text-sm font-bold mt-1">{nextTierPoints.toLocaleString()} pts</p>
                            </div>
                        </div>
 
                        <div className="relative mb-2 mt-2">
                            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            </div>
                            {/* Marker */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-primary shadow-md transition-all duration-1000"
                                style={{ left: `calc(${progressPercent}% - 8px)` }}
                            />
                        </div>
 
                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground mt-2">
                            <span>{progressPercent.toFixed(1)}% Hoàn thành</span>
                            <span>Cần thêm {Math.max(0, nextTierPoints - currentPoints).toLocaleString()} pts để thăng hạng</span>
                        </div>
                    </div>
                </div>
 
                <div className="mt-10 border-t border-border/40 pt-8">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Huy hiệu thành tựu (Virtual Badges)</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {ACHIEVEMENTS.map((achievement) => (
                            <div 
                                key={achievement.id} 
                                className={`relative group p-4 rounded-2xl border transition-all duration-300 ${
                                    achievement.unlocked 
                                        ? 'bg-gradient-to-br from-background to-muted/30 border-primary/20 shadow-md hover:shadow-lg' 
                                        : 'bg-muted/10 border-transparent opacity-40 grayscale pointer-events-none'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-2xl shadow-inner bg-gradient-to-tr ${achievement.color} text-white`}>
                                    {achievement.icon}
                                </div>
                                <h6 className="text-[11px] font-black tracking-tight mb-1">{achievement.name}</h6>
                                <p className="text-[9px] leading-tight text-muted-foreground line-clamp-2">{achievement.description}</p>
                                
                                {achievement.unlocked && (
                                    <div className="absolute top-3 right-3 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
