import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Zap, Plus, ArrowRight, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface AutomationRuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: any) => void;
}

const TRIGGER_OPTIONS = [
  { id: "birthday", label: "Sinh nhật khách hàng", icon: "🎂" },
  { id: "signup", label: "Đăng ký thành viên mới", icon: "👋" },
  { id: "no_purchase_30", label: "Không phát sinh đơn hàng > 30 ngày", icon: "⌛" },
  { id: "reached_points", label: "Đạt mốc điểm tích lũy", icon: "🎯" },
];

const ACTION_OPTIONS = [
  { id: "award_points", label: "Tặng điểm thưởng (Bonus Points)", icon: "💎" },
  { id: "send_coupon", label: "Gửi Voucher giảm giá qua SMS/Mail", icon: "🎫" },
  { id: "upgrade_tier", label: "Thăng hạng hội viên đặc thù", icon: "👑" },
  { id: "notify_rep", label: "Thông báo cho nhân viên chăm sóc", icon: "🔔" },
];

export function AutomationRuleBuilder({ isOpen, onClose, onSave }: AutomationRuleBuilderProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const handleSave = () => {
    if (!name || !trigger || !action) {
      toast.error("Vui lòng hoàn thiện tất cả các bước!");
      return;
    }
    
    onSave({
      id: "r" + Math.random().toString(36).substr(2, 9),
      name,
      trigger: TRIGGER_OPTIONS.find(t => t.id === trigger)?.label,
      action: `${ACTION_OPTIONS.find(a => a.id === action)?.label}: ${value}`,
      active: true,
    });
    
    reset();
    onClose();
  };

  const reset = () => {
    setStep(1);
    setName("");
    setTrigger(null);
    setAction(null);
    setValue("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2f6cf5] via-purple-500 to-amber-500" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black italic tracking-tighter">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
               <Zap className="w-6 h-6" />
            </div>
            TRÌNH TẠO QUY TẮC TỰ ĐỘNG
          </DialogTitle>
          <div className="flex items-center gap-2 mt-4">
             {[1, 2, 3].map((s) => (
                <div 
                   key={s} 
                   className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-[#2f6cf5]' : 'bg-slate-800'}`} 
                />
             ))}
          </div>
        </DialogHeader>

        <div className="py-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Đặt tên cho quy tắc</label>
                 <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Tặng quà sinh nhật khách VIP..." 
                    className="bg-slate-900/50 border-slate-800 h-12 text-base font-bold"
                 />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chọn sự kiện kích hoạt (TRIGGER)</label>
                 <div className="grid grid-cols-2 gap-3">
                    {TRIGGER_OPTIONS.map((opt) => (
                       <button
                          key={opt.id}
                          onClick={() => setTrigger(opt.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                             trigger === opt.id 
                             ? 'border-[#2f6cf5] bg-[#2f6cf5]/10 shadow-[0_0_15px_rgba(47,108,245,0.2)]' 
                             : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                          }`}
                       >
                          <div className="text-2xl mb-2">{opt.icon}</div>
                          <div className="text-xs font-bold leading-tight">{opt.label}</div>
                       </button>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hành động thực hiện (ACTION)</label>
                 <div className="grid grid-cols-2 gap-3">
                    {ACTION_OPTIONS.map((opt) => (
                       <button
                          key={opt.id}
                          onClick={() => setAction(opt.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                             action === opt.id 
                             ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                             : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                          }`}
                       >
                          <div className="text-2xl mb-2">{opt.icon}</div>
                          <div className="text-xs font-bold leading-tight">{opt.label}</div>
                       </button>
                    ))}
                 </div>
              </div>

              {action && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Giá trị hành động (Value)</label>
                   <Input 
                      value={value} 
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={action === 'award_points' ? 'Nhập số điểm (ví dụ: 500)' : 'Nhập nội dung hoặc mã...'} 
                      className="bg-slate-900/50 border-slate-800 h-12 text-base font-bold"
                   />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Zap className="w-24 h-24" />
                  </div>
                  
                  <h4 className="text-lg font-bold mb-6 text-[#2f6cf5]">{name}</h4>
                  
                  <div className="space-y-6 relative z-10">
                     <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Khi sự kiện...</p>
                           <p className="text-sm font-bold">{TRIGGER_OPTIONS.find(t => t.id === trigger)?.label}</p>
                        </div>
                     </div>
                     
                     <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <ArrowRight className="w-4 h-4 text-[#2f6cf5]" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Thì thực hiện...</p>
                           <p className="text-sm font-bold text-emerald-400">{ACTION_OPTIONS.find(a => a.id === action)?.label}</p>
                           <p className="text-xs text-muted-foreground mt-1">Giá trị: {value}</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                     <Zap className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-medium text-amber-200/70">
                     Quy tắc này sẽ được kích hoạt ngay lập tức sau khi lưu và tự động xử lý bởi Cloud Functions mỗi 5 phút.
                  </p>
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 rounded-xl border border-slate-800 font-bold text-xs hover:bg-slate-900 transition-all"
            >
              Quay lại
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="px-8 py-3 rounded-xl bg-[#2f6cf5] text-white font-black text-xs hover:bg-[#2f6cf5]/90 transition-all shadow-lg shadow-[#2f6cf5]/20 flex items-center gap-2"
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="px-10 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
            >
              LƯU QUY TẮC & KÍCH HOẠT
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
