import React from 'react';
import { Smartphone, ChevronLeft, Search, Bell, Sparkles, Coins, Gift } from 'lucide-react';
import { RedemptionRule } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface OfferMobilePreviewProps {
  rules: any[]; 
}

export function OfferMobilePreview({ rules }: OfferMobilePreviewProps) {
  const activeRules = rules.filter(r => r.isEnabled !== false);
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-6 text-center">
        <h4 className="font-heading text-lg font-bold flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-500" />
          Xem trước Giao diện App Khách Hàng
        </h4>
        <p className="text-xs text-muted-foreground mt-1">Giao diện mà khách hàng sẽ thấy khi truy cập mục Đổi Ưu Đãi</p>
      </div>
      
      {/* Mobile Device Mockup */}
      <div className="w-[375px] h-[750px] bg-background border-[8px] border-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-50"></div>
        
        {/* Status Bar */}
        <div className="h-12 bg-background flex items-center justify-between px-6 pt-3 relative z-40">
          <span className="text-[10px] font-bold">9:41</span>
          <div className="flex items-center gap-1.5">
             <div className="w-3.5 h-3.5 bg-foreground rounded-full opacity-20"></div>
             <div className="w-3.5 h-3.5 bg-foreground rounded-full opacity-20"></div>
             <div className="w-5 h-2.5 bg-foreground rounded-sm opacity-20"></div>
          </div>
        </div>
        
        {/* App Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur z-40">
          <ChevronLeft className="w-6 h-6" />
          <span className="font-bold text-[15px]">Cửa hàng Ưu Đãi</span>
          <Bell className="w-5 h-5" />
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-muted/20 pb-20 no-scrollbar">
          
          {/* User Points Card */}
          <div className="p-4 pt-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
               <div className="relative z-10">
                 <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Điểm hiện có</p>
                 <div className="flex items-center gap-2 mb-3">
                   <Coins className="w-6 h-6 text-amber-300" />
                   <span className="text-3xl font-black font-heading">4,250</span>
                 </div>
                 
                 <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div className="text-[10px] text-white/80">Sắp hết hạn:  <span className="font-bold text-white">0</span></div>
                    <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Hạng Vàng
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="px-4 pb-2">
            <h3 className="font-bold text-[15px] mb-3">Đặc Quyền Dành Riêng Bạn</h3>
          </div>
          
          {/* Offers List */}
          <div className="px-4 space-y-4">
             {activeRules.map((rule, idx) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 key={rule.id} 
                 className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
               >
                 <div className="h-32 w-full relative">
                   <img 
                    src={rule.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(rule.id || rule.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt="" 
                    className="w-full h-full object-cover" 
                   />
                   <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-sm border border-white/10">
                     Hết hạn: {rule.expiryDays} ngày
                   </div>
                 </div>
                 <div className="p-3">
                   <h4 className="font-bold text-sm text-foreground mb-1 line-clamp-1">{rule.name}</h4>
                   <p className="text-[11px] text-muted-foreground line-clamp-2 h-8 leading-snug mb-3">
                     {rule.description || "Đây là ưu đãi dành cho khách hàng thân thiết."}
                   </p>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-border/50">
                     <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {Number(rule.pointsRequired).toLocaleString()}
                     </span>
                     <button className="bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-full">
                       Đổi Ngay
                     </button>
                   </div>
                 </div>
               </motion.div>
             ))}
             
             {activeRules.length === 0 && (
               <div className="py-10 text-center flex flex-col items-center justify-center opacity-50">
                 <Gift className="w-10 h-10 mb-2" />
                 <span className="text-sm">Chưa có ưu đãi nào</span>
               </div>
             )}
          </div>

        </div>
        
        {/* Bottom Nav */}
        <div className="h-16 bg-background border-t border-border/50 flex items-center justify-around absolute bottom-0 w-full z-40 pb-2">
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-5 border-2 border-current rounded-sm"></div></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-5 border-2 border-current rounded-full"></div></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary"><Gift className="w-5 h-5" /></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-1 border-b-2 border-t-2 border-current"></div></div>
        </div>
      </div>
    </div>
  );
}
