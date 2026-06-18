import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Customer } from "@/types";
import { 
  History, 
  ShoppingCart, 
  Award, 
  CheckCircle2, 
  Gift, 
  Clock,
  ArrowUpRight,
  TrendingUp,
  CircleDot
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CustomerActivityLogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerActivityLog({ customer, isOpen, onClose }: CustomerActivityLogProps) {
  if (!customer) return null;

  // Derive some mock activities if the data is sparse
  const activities = [
    ...(customer.orders || []).map(order => ({
      id: order.id || Math.random().toString(),
      type: 'purchase' as const,
      title: 'Đơn hàng mới',
      description: `Đã mua hàng giá trị ${(order.total || 0).toLocaleString()}đ`,
      date: order.createdAt || new Date(),
      icon: ShoppingCart,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    })),
    ...(customer.statusHistory || []).map(status => ({
      id: Math.random().toString(),
      type: 'tier' as const,
      title: 'Thăng hạng hội viên',
      description: `Đã chuyển từ hạng cũ sang hạng ${status.toTier || 'Member'}`,
      date: status.timestamp || new Date(),
      icon: Award,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    })),
    ...(customer.redemptions || []).map(red => ({
      id: red.id || Math.random().toString(),
      type: 'redemption' as const,
      title: 'Đổi quà tặng',
      description: `Đã sử dụng ${red.pointsUsed || 0} điểm để đổi ${red.rewardName || 'Quà tặng'}`,
      date: red.redeemedAt || new Date(),
      icon: Gift,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }))
  ];

  // If no data, add some demo items
  if (activities.length === 0) {
    const joinDate = customer.createdAt ? 
      (typeof customer.createdAt.toDate === 'function' ? customer.createdAt.toDate() : new Date(customer.createdAt)) 
      : new Date();
      
    activities.push(
      {
        id: 'join',
        type: 'purchase' as const,
        title: 'Gia nhập cộng đồng SEVA',
        description: 'Tài khoản khách hàng được tạo thành công trên hệ thống.',
        date: joinDate,
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
      }
    );
  }

  // Sort activities by date descending
  const sortedActivities = activities.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const parseSafeDate = (val: any) => {
    if (!val) return "—";
    try {
      const d = typeof val.toDate === 'function' ? val.toDate() : new Date(val);
      return format(d, "HH:mm, dd/MM/yyyy", { locale: vi });
    } catch {
      return "—";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2f6cf5]/10 rounded-[10px]">
              <History className="w-5 h-5 text-[#2f6cf5]" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold font-heading">Nhật ký hoạt động</SheetTitle>
              <SheetDescription className="text-xs">
                Lịch sử tương tác của {customer.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-8 relative">
          {/* Vertical line connector */}
          <div className="absolute left-6 top-2 bottom-0 w-0.5 bg-border/40" />

          {sortedActivities.length > 0 ? (
            sortedActivities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id || idx} className="relative pl-14 flex flex-col gap-1">
                  {/* Timeline point */}
                  <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 border-background ${activity.bg} flex items-center justify-center z-10`}>
                    <CircleDot className={`w-2 h-2 ${activity.color}`} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                      {parseSafeDate(activity.date)}
                    </span>
                    {activity.type === 'purchase' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded-full border border-blue-500/10">
                        Giao dịch <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {activity.type === 'tier' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                        Hạng <TrendingUp className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="bg-muted/30 p-4 rounded-[10px] border border-border/40 hover:border-[#2f6cf5]/30 transition-all group/card">
                    <div className="flex items-center gap-3 mb-2">
                       <div className={`p-1.5 rounded-[10px] ${activity.bg} ${activity.color}`}>
                          <Icon className="w-4 h-4" />
                       </div>
                       <h4 className="text-sm font-bold text-foreground">{activity.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Chưa có hoạt động nào được ghi nhận.</p>
            </div>
          )}
        </div>

        <div className="mt-12 p-6 bg-[#2f6cf5]/5 rounded-[10px] border border-[#2f6cf5]/10 space-y-3">
          <h5 className="text-xs font-bold text-[#2f6cf5] flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Thống kê tóm tắt
          </h5>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Tổng chi</span>
                <p className="text-sm font-bold">{(customer.customFields?.clv || 0).toLocaleString()}đ</p>
             </div>
             <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black">Tỷ lệ quay lại</span>
                <p className="text-sm font-bold">{(customer.customFields?.repeat_rate || 0)}%</p>
             </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
