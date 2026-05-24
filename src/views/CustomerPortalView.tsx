import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Gift, History, User as UserIcon, ArrowLeft, Ticket, CheckCircle2, ShoppingBag, Scissors } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RedemptionRule } from "@/types";
import { toast } from "sonner";

interface PortalProps {
  onBack?: () => void;
}

export function CustomerPortalView({ onBack }: PortalProps) {
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'history'>('home');
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [customerPoints, setCustomerPoints] = useState(125000); // Mocked for demo

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/redemptionRules`), orderBy("pointsRequired", "asc"));
    return onSnapshot(q, (snapshot) => {
      setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedemptionRule)));
    });
  }, [user]);

  const handleRedeem = (rule: RedemptionRule) => {
    if (customerPoints < rule.pointsRequired) {
      toast.error("Không đủ điểm để đổi ưu đãi này");
      return;
    }
    
    // In a real app, this would create a 'redemption' record and deduct points
    toast.success(`Đã đổi thành công: ${rule.name}`, {
      description: "Mã ưu đãi đã được gửi vào mục Lịch sử của bạn.",
    });
    setCustomerPoints(prev => prev - rule.pointsRequired);
  };

  return (
    <div className="flex-1 bg-zinc-50 flex items-center justify-center p-4 sm:p-8 min-h-screen">
      {/* Mobile Frame Simulation */}
      <div className="w-full max-w-[400px] h-[800px] max-h-screen bg-[#111111] rounded-[3rem] shadow-2xl overflow-hidden relative border-8 border-[#333333] flex flex-col">
        
        {/* Dynamic Island / Notch Simulation */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
          <div className="w-32 h-6 bg-[#333333] rounded-b-xl"></div>
        </div>

        {/* Portal Header */}
        <div className="pt-12 pb-4 px-6 relative z-10 flex items-center justify-between">
            <button 
              onClick={activeTab === 'home' ? onBack : () => setActiveTab('home')} 
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <span className="font-heading font-bold tracking-widest text-[#D4AF37]">
              {activeTab === 'home' ? 'SEVA' : activeTab === 'rewards' ? 'ƯU ĐÃI' : 'LỊCH SỬ'}
            </span>
            <div className="w-5"></div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-6 space-y-6"
          >
            {activeTab === 'home' && (
              <>
                {/* Greeting & Points Ratio */}
                <div className="mt-4">
                  <h2 className="text-3xl font-heading text-white leading-tight">Chào bạn, <br/><span className="text-[#D4AF37] font-serif italic text-4xl">Eleanor.</span></h2>
                  <p className="text-zinc-400 mt-2 text-sm">Thành viên Kim cương</p>
                </div>

                {/* Loyalty Card Element */}
                <div className="mt-6 aspect-[1.586/1] bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl relative overflow-hidden border border-white/10 shadow-xl flex flex-col justify-between p-6">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#D4AF37] opacity-10 rounded-full blur-3xl"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className="font-heading font-bold text-[#D4AF37] tracking-widest text-lg">SEVA</span>
                    <QrCode className="text-white/50 w-8 h-8"/>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold">Số điểm hiện có</p>
                    <p className="text-white text-4xl font-mono mt-1">{customerPoints.toLocaleString()}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setActiveTab('rewards')}
                    className="flex flex-col items-center justify-center p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 hover:bg-[#2A2A2A] transition-colors"
                  >
                    <Gift className="w-6 h-6 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] text-zinc-300 font-bold tracking-wide uppercase">Đổi quà</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 hover:bg-[#2A2A2A] transition-colors">
                    <History className="w-6 h-6 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] text-zinc-300 font-bold tracking-wide uppercase">Lịch sử</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 hover:bg-[#2A2A2A] transition-colors">
                    <UserIcon className="w-6 h-6 text-[#D4AF37] mb-2" />
                    <span className="text-[10px] text-zinc-300 font-bold tracking-wide uppercase">Hồ sơ</span>
                  </button>
                </div>

                {/* VIP & AI Experience Promotion */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium text-sm">Trải nghiệm VIP</h3>
                    <button className="text-[10px] text-[#D4AF37] font-bold uppercase">Khám phá</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/20">
                      <Scissors className="w-5 h-5 text-indigo-400 mb-2" />
                      <p className="text-white text-xs font-bold leading-tight">AI Stylist</p>
                      <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">+500 PTS / LẦN</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <Ticket className="w-5 h-5 text-emerald-400 mb-2" />
                      <p className="text-white text-xs font-bold leading-tight">Trade-in</p>
                      <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">ƯU TIÊN DIAMOND</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-medium">Hoạt động gần đây</h3>
                    <button className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Xem tất cả</button>
                  </div>
                  <div className="space-y-6">
                    {[
                      { title: "Mua sắm tại cửa hàng", date: "Hôm nay, 14:45", points: "+2,400", type: "earn" },
                      { title: "Thưởng sinh nhật", date: "12 thg 10, 2023", points: "+1,000", type: "earn" },
                      { title: "Đã đổi phần thưởng", date: "10 thg 10, 2023", points: "-5,000", type: "redeem" }
                    ].map((act, i) => (
                      <React.Fragment key={i}>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-sm text-zinc-300 font-medium">{act.title}</span>
                            <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">{act.date}</span>
                          </div>
                          <span className={act.type === 'earn' ? 'text-[#D4AF37] text-sm font-mono font-medium' : 'text-zinc-500 text-sm font-mono'}>
                            {act.points} pts
                          </span>
                        </div>
                        {i < 2 && <div className="w-full h-px bg-white/5"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-white font-medium text-lg">Sử dụng điểm</h3>
                    <p className="text-zinc-500 text-xs">Đổi điểm lấy đặc quyền độc quyền</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Số dư</p>
                    <p className="text-[#D4AF37] font-mono font-bold">{customerPoints.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rules.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Gift className="w-12 h-12 text-zinc-800 mx-auto" />
                      <p className="text-zinc-500 text-sm">Hiện chưa có ưu đãi nào khả dụng.</p>
                    </div>
                  ) : (
                    rules.map((rule) => {
                      const canRedeem = customerPoints >= rule.pointsRequired;
                      return (
                        <div 
                          key={rule.id}
                          className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-[#222] transition-colors"
                        >
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] flex items-center justify-center border border-white/10 shrink-0">
                            {rule.rewardType === 'discount' ? (
                              <Ticket className="w-7 h-7 text-[#D4AF37]" />
                            ) : rule.rewardType === 'voucher' ? (
                              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            ) : (
                              <ShoppingBag className="w-7 h-7 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{rule.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#D4AF37] text-xs font-mono font-bold">{rule.pointsRequired.toLocaleString()} pts</span>
                              <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                              <span className="text-zinc-500 text-[10px] uppercase font-bold">
                                {rule.rewardType === 'discount' ? `Giảm $${rule.value}` : rule.rewardType === 'voucher' ? `Voucher ${rule.value}%` : 'Hiện vật'}
                              </span>
                            </div>
                            
                            {/* Progress bar */}
                            {!canRedeem && (
                              <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-zinc-600"
                                  style={{ width: `${(customerPoints / rule.pointsRequired) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                          <button 
                            disabled={!canRedeem}
                            onClick={() => handleRedeem(rule)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                              canRedeem 
                                ? 'bg-[#D4AF37] text-black hover:scale-105 active:scale-95' 
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            {canRedeem ? 'Đổi ngay' : 'Thêm điểm'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 inset-x-0 h-1 flex justify-center z-50 pointer-events-none">
          <div className="w-1/3 bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
