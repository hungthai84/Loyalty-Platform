import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Gift, 
  Sparkles, 
  Cake, 
  UserPlus, 
  ChevronRight,
  Clock,
  Navigation
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from "@/lib/utils";

const timelineEvents = [
  {
    id: "e1",
    type: "Chào mừng",
    title: "Thành viên mới (Welcome)",
    description: "Tặng ngay 50 Điểm Thưởng và Voucher Giảm 10% cho đơn hàng đầu tiên sau khi đăng ký thành công.",
    icon: UserPlus,
    img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&h=300&auto=format&fit=crop",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    time: "Đăng ký mới"
  },
  {
    id: "e2",
    type: "Ưu đãi",
    title: "Mã Ưu đãi & Dịch vụ",
    description: "Kích hoạt các mã ưu đãi độc quyền, dịch vụ VIP và đặc quyền thăng hạng dựa trên điểm tích lũy.",
    icon: Sparkles,
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&h=300&auto=format&fit=crop",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    time: "Tích điểm"
  },
  {
    id: "e3",
    type: "Sinh nhật",
    title: "Thành viên sắp sinh nhật",
    description: "Gửi quà tặng bất ngờ, nhân đôi điểm thưởng và ưu đãi riêng biệt cho khách hàng trong tháng sinh nhật.",
    icon: Cake,
    img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1a?q=80&w=400&h=300&auto=format&fit=crop",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    time: "Tháng sinh nhật"
  },
  {
    id: "e4",
    type: "Quà tặng",
    title: "Quà tặng Đặc quyền",
    description: "Đạt mốc điểm cao hoặc hạng VIP để nhận các món quà vật phẩm cao cấp và quyền lợi chăm sóc đặc biệt.",
    icon: Gift,
    img: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&h=300&auto=format&fit=crop",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    time: "Đạt mốc VIP"
  }
];

export function InteractiveRoadmapView() {
  return (
    <div className="space-y-6">
      {/* Horizontal Timeline Layout */}
      <div className="bg-card w-full py-10 px-8 rounded-[10px] border border-border shadow-sm overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] flex items-start relative px-4">
          
          {/* Main timeline line spanning through */}
          <div className="absolute top-[32px] left-12 right-12 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/50 w-full animate-pulse opacity-50" />
          </div>

          {timelineEvents.map((event, idx) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="relative flex-1 text-center group">
                
                {/* Time Indicator */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap bg-background px-2 py-0.5 rounded-full border border-border/50">
                  <Clock className="w-3 h-3 inline mr-1 opacity-50" /> {event.time}
                </span>

                {/* Node */}
                <div className="relative z-10 flex justify-center mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      "w-16 h-16 rounded-[10px] flex items-center justify-center border-4 border-background shadow-xl shrink-0 transition-transform cursor-pointer",
                      event.bg,
                      event.color
                    )}
                  >
                    <Icon className="w-7 h-7" />
                  </motion.div>
                </div>

                {/* Content Card below node */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="px-4"
                >
                  <Card className={cn("p-0 border text-left bg-background/80 hover:bg-card transition-all w-full h-full shadow-md overflow-hidden", event.border)}>
                    {event.img && (
                      <div className="h-28 overflow-hidden relative">
                         <img 
                           src={event.img} 
                           alt={event.title} 
                           className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                           referrerPolicy="no-referrer"
                         />
                         <div className={cn("absolute inset-0 opacity-20", event.bg)} />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                       <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                          <span className={cn("inline-block w-2 h-2 rounded-full", event.bg.replace('/10', ''))} />
                          <span className="font-bold text-muted-foreground uppercase tracking-wider">{event.type}</span>
                       </div>
                       <h4 className="font-extrabold text-sm text-foreground line-clamp-2">
                         {event.title}
                       </h4>
                       <p className="text-xs text-muted-foreground leading-relaxed">
                         {event.description}
                       </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Arrow Connector except last */}
                {idx < timelineEvents.length - 1 && (
                  <div className="absolute top-[28px] -right-3 z-0">
                     <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
