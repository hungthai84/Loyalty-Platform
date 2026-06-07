import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { recentActivityData } from "@/data/mockData";
import { Activity, ArrowUpCircle, Gift, Settings, UserPlus, ShoppingCart } from "lucide-react";
import * as motion from "motion/react-client";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sign_up":
      return <UserPlus className="w-4 h-4 text-emerald-500" />;
    case "upgrade":
      return <ArrowUpCircle className="w-4 h-4 text-blue-500" />;
    case "redeem":
      return <Gift className="w-4 h-4 text-purple-500" />;
    case "rule_trigger":
      return <Settings className="w-4 h-4 text-amber-500" />;
    case "purchase":
      return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

export function RecentActivity() {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="text-left pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Hoạt động gần đây
        </CardTitle>
        <CardDescription>
          Cập nhật tức thời các sự kiện loyalty, đăng ký mới và kích hoạt chiến dịch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentActivityData.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={activity.id}
              className="flex items-start gap-4 relative"
            >
              <div className="mt-0.5 relative z-10 flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-muted border border-border">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-left">
                  <span className="font-semibold text-foreground">
                    {activity.user}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {activity.description}
                  </span>
                </p>
                <div className="text-xs text-muted-foreground text-left flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-border/80 inline-block"></span>
                  {activity.time}
                </div>
              </div>
              {index !== recentActivityData.length - 1 && (
                <div className="absolute top-8 left-4 bottom-[-24px] w-px bg-border/50"></div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
