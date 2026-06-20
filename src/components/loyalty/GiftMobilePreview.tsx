import React from 'react';
import { Smartphone, ChevronLeft, Search, Bell, Sparkles, Coins, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { GiftItem } from './GiftsManagementView';

interface GiftMobilePreviewProps {
  gifts: GiftItem[]; 
}

export function GiftMobilePreview({ gifts }: GiftMobilePreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-6 text-center">
        <h4 className="font-heading text-lg font-bold flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5 text-rose-500" />
          Xem trước App Đổi Quà
        </h4>
        <p className="text-xs text-muted-foreground mt-1">Trải nghiệm tính năng đổi quà tặng trên di động cho Khách hàng hạng thành viên</p>
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
          <span className="font-bold text-[15px]">Kho Quà Tặng</span>
          <Bell className="w-5 h-5" />
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-muted/20 pb-20 no-scrollbar">
          
          {/* User Points Card */}
          <div className="p-4 pt-6">
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
               <div className="relative z-10">
                 <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Điểm Tích Lũy</p>
                 <div className="flex items-center gap-2 mb-3">
                   <Coins className="w-6 h-6 text-yellow-300" />
                   <span className="text-3xl font-black font-heading">8,500</span>
                 </div>
                 
                 <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-300" /> Hạng Atelier
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="px-4 pb-2">
            <h3 className="font-bold text-[15px] mb-3">Quà Đặc Quyền Chờ Đón</h3>
          </div>
          
          {/* Gifts List */}
          <div className="px-4 grid grid-cols-2 gap-3">
             {gifts.map((gift, idx) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 key={gift.id} 
                 className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col"
               >
                 <div className="h-28 w-full relative">
                   <img 
                    src={gift.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(gift.id || gift.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt="" 
                    className="w-full h-full object-cover" 
                   />
                   <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-sm border border-white/10">
                     Còn: {gift.stockQuantity} món
                   </div>
                 </div>
                 <div className="p-3 flex-1 flex flex-col justify-between">
                   <div>
                     <h4 className="font-bold text-xs text-foreground mb-1 line-clamp-2">{gift.name}</h4>
                   </div>
                   
                   <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-border/50">
                     <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {Number(gift.pointsRequired).toLocaleString()}
                     </span>
                     <button className="bg-rose-500 text-white hover:bg-rose-600 transition text-[10px] font-bold px-4 py-1.5 rounded-full w-full">
                       Đổi Ngay
                     </button>
                   </div>
                 </div>
               </motion.div>
             ))}
             
             {gifts.length === 0 && (
               <div className="col-span-2 py-10 text-center flex flex-col items-center justify-center opacity-50 border border-dashed border-border rounded-xl">
                 <Gift className="w-8 h-8 mb-2" />
                 <span className="text-xs">Bạn đã đổi hết quà!</span>
               </div>
             )}
          </div>

        </div>
        
        {/* Bottom Nav */}
        <div className="h-16 bg-background border-t border-border/50 flex items-center justify-around absolute bottom-0 w-full z-40 pb-2">
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-5 border-2 border-current rounded-sm"></div></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-5 border-2 border-current rounded-full"></div></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500"><Gift className="w-5 h-5" /></div>
           <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-40"><div className="w-5 h-1 border-b-2 border-t-2 border-current"></div></div>
        </div>
      </div>
    </div>
  );
}
