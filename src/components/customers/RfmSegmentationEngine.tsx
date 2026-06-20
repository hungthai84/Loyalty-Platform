import React, { useMemo } from "react";
import { Customer } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import { Crown, Heart, AlertCircle, ShoppingBag, Zap, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RfmSegmentationEngineProps {
  customers: Customer[];
}

interface Segment {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  count: number;
  color: string;
  bgColor: string;
  borderClass: string;
}

export function RfmSegmentationEngine({ customers }: RfmSegmentationEngineProps) {
  // RFM Computed (Using spend/points as 'Monetary', and a simulated frequency based on status / totalOrders if available)
  // For this generic CRM, we'll implement the logic based on totalPoints and status.
  const segments = useMemo(() => {
    let champions = 0; // high points, active
    let loyal = 0; // medium/high points, active
    let newUsers = 0; // new
    let atRisk = 0; // churn_risk status, dormant
    let others = 0;

    customers.forEach((c) => {
      const status = c.status?.toLowerCase() || '';
      const points = c.points || 0;
      
      if (status.includes("churn") || status.includes("dormant") || status.includes("nguy cơ")) {
        atRisk++;
      } else if (status.includes("new") || status.includes("mới")) {
        newUsers++;
      } else {
        if (points > 5000) {
          champions++;
        } else if (points > 1000) {
          loyal++;
        } else {
          others++;
        }
      }
    });

    return [
      {
        id: "champions",
        name: "Champions (Tinh Anh)",
        icon: Crown,
        description: "Mua thường xuyên, chi tiêu cao nhất.",
        count: champions,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        borderClass: "border-amber-500/20",
      },
      {
        id: "loyal",
        name: "Loyal (Trung Thành)",
        icon: Heart,
        description: "Điểm & tần suất mua sắm ổn định.",
        count: loyal,
        color: "text-[#2f6cf5]",
        bgColor: "bg-[#2f6cf5]/10",
        borderClass: "border-[#2f6cf5]/20",
      },
      {
        id: "new",
        name: "New Customers (Mới)",
        icon: Zap,
        description: "Khách hàng mua lần đầu gần đây.",
        count: newUsers,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderClass: "border-emerald-500/20",
      },
      {
        id: "at-risk",
        name: "At Risk (Nguy Cơ Rời Bỏ)",
        icon: AlertCircle,
        description: "Từng mua nhiều nhưng không quay lại.",
        count: atRisk,
        color: "text-rose-500",
        bgColor: "bg-rose-500/10",
        borderClass: "border-rose-500/20",
      },
      {
        id: "others",
        name: "Needs Attention (Cần Nhắc)",
        icon: TrendingDown,
        description: "Các nhóm khách hàng khác (Điểm thấp).",
        count: others,
        color: "text-zinc-500",
        bgColor: "bg-zinc-500/10",
        borderClass: "border-zinc-500/20",
      }
    ];
  }, [customers]);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center text-primary shadow-xs">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-heading text-foreground">RFM Segmentation Engine</h3>
          <p className="text-xs text-muted-foreground font-medium">Auto-groups users by frequency & spending behavior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {segments.map((seg, idx) => (
          <motion.div
            key={seg.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className={cn("overflow-hidden border group transition-all hover:shadow-md cursor-pointer", seg.borderClass)}>
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", seg.bgColor, seg.color)}>
                    <seg.icon className="w-4 h-4" />
                  </div>
                  <span className={cn("text-xl font-black font-mono", seg.color)}>{seg.count}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground truncate">{seg.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{seg.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
