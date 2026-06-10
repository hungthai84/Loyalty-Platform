import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types";
import { AlertTriangle, User, Calendar, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChurnRiskListProps {
  customers: Customer[];
}

export function ChurnRiskList({ customers }: ChurnRiskListProps) {
  // Determine churn risk based on last activity
  const churnRisks = customers
    .map(c => {
      const lastVisitDate = c.updatedAt?.toDate?.() || (c.updatedAt ? new Date(c.updatedAt) : new Date());
      const daysSinceLastVisit = Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let riskScore = 0;
      let reason = "";

      if (daysSinceLastVisit > 60) {
        riskScore = 90;
        reason = "Đã hơn 2 tháng chưa có giao dịch hoặc tương tác.";
      } else if (daysSinceLastVisit > 30) {
        riskScore = 60;
        reason = "Hơn 30 ngày chưa quay lại, dấu hiệu giảm tương tác.";
      } else if (c.points && c.points > 1000 && daysSinceLastVisit > 15) {
        riskScore = 40;
        reason = "Khách hàng VIP chưa quay lại trong 2 tuần.";
      } else {
         return null;
      }

      return {
        customer: c,
        riskScore,
        reason,
        daysSinceLastVisit
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  if (churnRisks.length === 0) return null;

  return (
    <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3 border-b border-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle className="text-lg font-bold">Cảnh báo Tỷ lệ Rời bỏ (Churn Risk)</CardTitle>
          </div>
          <Badge variant="destructive" className="animate-pulse">AI Predicted</Badge>
        </div>
        <CardDescription className="text-xs text-rose-600/80 font-medium">
          Dựa trên lịch sử hoạt động, đây là các khách hàng có rủi ro ngừng sử dụng dịch vụ cao.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-rose-500/10">
          {churnRisks.map((risk) => (
            <div key={risk.customer.id} className="p-4 flex items-center justify-between hover:bg-rose-500/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold border border-rose-200">
                  {risk.customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {risk.customer.name}
                    <Badge className={cn(
                      "text-[9px] px-1.5 py-0 uppercase tracking-tighter",
                      risk.riskScore > 80 ? "bg-rose-500" : "bg-orange-500"
                    )}>
                      {risk.riskScore}% Risk
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-rose-700/70 mt-0.5">{risk.reason}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                  <Calendar className="w-3 h-3" />
                  {risk.daysSinceLastVisit} ngày trước
                </div>
                <button className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline">
                  Gửi ưu đãi phục hồi <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
