import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift, Cake, ChevronRight, Send } from "lucide-react";
import { getGuestCustomers } from "@/data/guestData";
import { toast } from "sonner";
import { Customer } from "@/types";

export function UpcomingBirthdays() {
  const currentMonth = new Date().getMonth();
  const currentData = getGuestCustomers();
  
  // Fake birthday generation if missing or match by some logic
  const birthdays = currentData.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    avatar: c.name?.slice(0, 2).toUpperCase() || "KH",
    tier: "Atelier", // MOCK
    date: `Ngày ${Math.floor(Math.random() * 28) + 1} tháng ${currentMonth + 1}`,
  }));

  const handleSendPromo = (name: string) => {
    toast.success(`Đã gửi mã khuyến mãi sinh nhật cho khách dọc ${name}!`);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="font-heading flex items-center">
            <Cake className="w-5 h-5 mr-2 text-rose-500" />
            Sinh nhật sắp tới
        </CardTitle>
        <CardDescription>
            Khách hàng có sinh nhật trong tháng này.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {birthdays.map((b, i) => (
                <div key={b.id + i} className="flex items-center justify-between p-3 rounded-[10px] border border-border/40 bg-background/40 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {b.avatar}
                        </div>
                        <div>
                            <p className="text-sm font-bold truncate max-w-[120px] sm:max-w-none">{b.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center mt-0.5">
                                {b.date}
                            </p>
                        </div>
                    </div>
                    <button 
                      onClick={() => handleSendPromo(String(b.name))}
                      className="px-3 py-1.5 h-8 bg-black dark:bg-white text-white dark:text-black rounded-[10px] text-xs font-bold hover:opacity-80 transition flex items-center shrink-0 cursor-pointer"
                    >
                        <Gift className="w-3.5 h-3.5 mr-1.5" /> Gửi quà
                    </button>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
