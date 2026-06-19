import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Users, Award, Shield } from "lucide-react";
import * as motion from "motion/react-client";
import { Customer, TierConfig } from "@/types";

interface CustomerTierPieChartProps {
  customers: Customer[];
  tiers: TierConfig[];
}

export function CustomerTierPieChart({ customers = [], tiers = [] }: CustomerTierPieChartProps) {
  const chartData = useMemo(() => {
    // Determine thresholds dynamically from tiers
    let silverThreshold = 500;
    let goldThreshold = 2500;

    if (tiers && tiers.length >= 3) {
      const sorted = [...tiers].sort((a, b) => (a.threshold || 0) - (b.threshold || 0));
      silverThreshold = sorted[1]?.threshold ?? 500;
      goldThreshold = sorted[2]?.threshold ?? 2500;
    }

    let bronzeCount = 0;
    let silverCount = 0;
    let goldCount = 0;

    customers.forEach((c) => {
      const pts = c.points || 0;
      if (pts < silverThreshold) {
        bronzeCount++;
      } else if (pts < goldThreshold) {
        silverCount++;
      } else {
        goldCount++;
      }
    });

    const total = bronzeCount + silverCount + goldCount;

    return [
      {
        name: "Bronze (Đồng)",
        value: bronzeCount,
        percentage: total > 0 ? Math.round((bronzeCount / total) * 100) : 0,
        color: "#CD7F32",
        threshold: `0 - ${silverThreshold - 1} pts`,
        icon: Shield,
      },
      {
        name: "Silver (Bạc)",
        value: silverCount,
        percentage: total > 0 ? Math.round((silverCount / total) * 100) : 0,
        color: "#94A3B8", // beautiful silver slate
        threshold: `${silverThreshold} - ${goldThreshold - 1} pts`,
        icon: Award,
      },
      {
        name: "Gold (Vàng)",
        value: goldCount,
        percentage: total > 0 ? Math.round((goldCount / total) * 100) : 0,
        color: "#F59E0B", // luxury warm gold
        threshold: `>= ${goldThreshold} pts`,
        icon: Award,
      },
    ];
  }, [customers, tiers]);

  const totalCustomers = customers.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="h-full border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]/20 group-hover:bg-[#f59e0b] transition-colors duration-500" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-left">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f59e0b]" />
              <span>Cơ cấu Phân hạng</span>
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Bronze, Silver & Gold Distribution
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Pie Chart Representation */}
          <div className="relative h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover/95 border border-border px-3 py-2 rounded-[10px] shadow-lg text-left backdrop-blur-xs">
                          <p className="text-xs font-extrabold" style={{ color: data.color }}>
                            {data.name}
                          </p>
                          <p className="text-xs font-bold text-foreground mt-1">
                            Hội viên: <span className="font-black">{data.value.toLocaleString("vi-VN")}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Chiếm tỷ lệ: <span className="font-extrabold text-foreground">{data.percentage}%</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground italic mt-0.5">
                            Điều kiện: {data.threshold}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-2xl font-black text-foreground">
                {totalCustomers.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Hội viên
              </span>
            </div>
          </div>

          {/* Stats indicator list */}
          <div className="grid grid-cols-3 gap-2 border-t border-border/30 pt-3">
            {chartData.map((tier, idx) => (
              <div key={idx} className="flex flex-col items-center bg-muted/20 p-2 rounded-[8px] border border-border/30">
                <span className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5" style={{ color: tier.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  {tier.name.split(" ")[0]}
                </span>
                <span className="text-sm font-black text-foreground mt-1">
                  {tier.value}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {tier.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
