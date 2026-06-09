import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// Simple div-based progress bar below
import { Trophy, Star, ShieldCheck, Crown } from "lucide-react";

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
 
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {[
                        { name: "Member", pts: "0", active: currentPoints >= 0, icon: ShieldCheck, color: "text-slate-400" },
                        { name: "Essential", pts: "500", active: currentPoints >= 500, icon: Star, color: "text-[#10b981]" },
                        { name: "Icon", pts: "2,500", active: currentPoints >= 2500, icon: Crown, color: "text-[#f59e0b]" },
                        { name: "Atelier", pts: "10,000+", active: currentPoints >= 10000, icon: Trophy, color: "text-[#2f6cf5]" },
                    ].map((badge, i) => (
                        <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl border ${badge.active ? 'bg-background/80 border-primary/20 shadow-sm' : 'bg-muted/20 border-transparent opacity-50'} transition-all`}>
                            <badge.icon className={`w-8 h-8 mb-2 ${badge.color} ${badge.active ? 'opacity-100 drop-shadow-sm' : 'opacity-40 grayscale'}`} />
                            <span className={`text-xs font-bold ${badge.active ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</span>
                            <span className="text-[10px] text-muted-foreground">{badge.pts} pts</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
