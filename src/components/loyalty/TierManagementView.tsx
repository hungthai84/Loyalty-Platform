import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Plus, Settings, TrendingUp, Users, ChevronRight, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { TierConfig } from "@/types";
import { TierConfigDialog } from "@/components/loyalty/TierConfigDialog";
import { cn } from "@/lib/utils";

export function TierManagementView() {
  const { user } = useFirebase();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierConfig | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/tierConfigs`;
    const q = query(collection(db, path), orderBy("threshold", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTiers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TierConfig)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 sticky top-0 z-10 shadow-sm">
        <div>
          <h3 className="text-xl font-bold font-heading flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Cấu hình Cấp bậc Hội viên
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Xây dựng hệ thống hạng VIP với điều kiện thăng hạng động.</p>
        </div>
        <button 
          onClick={() => { setSelectedTier(undefined); setShowDialog(true); }}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm hạng mới
        </button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Đang tải cấu hình...</div>
        ) : tiers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">Chưa có cấp bậc nào</p>
              <p className="text-sm text-muted-foreground">Hãy bắt đầu bằng cách tạo Hạng Đồng hoặc Hạng Bạc đầu tiên.</p>
            </div>
          </div>
        ) : (
          tiers.map((tier, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key={tier.id}
            >
              <Card className="group border-none bg-card hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden relative border-l-8" style={{ borderLeftColor: tier.color }}>
                <CardContent className="p-0">
                   <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="p-8 md:w-1/3 flex flex-col justify-center bg-muted/5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: tier.color }}>
                              <Star className="w-6 h-6 fill-current" />
                           </div>
                           <h4 className="text-2xl font-black font-heading tracking-tight">{tier.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Hệ số tích lũy: <span className="text-foreground font-bold">{tier.multiplier}x</span></p>
                      </div>

                      <div className="p-8 flex-1 space-y-4 bg-background">
                         <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Điều kiện đạt hạng</h5>
                            <button 
                              onClick={() => { setSelectedTier(tier); setShowDialog(true); }}
                              className="p-2 hover:bg-muted rounded-xl transition-colors"
                            >
                              <Settings className="w-4 h-4 text-muted-foreground" />
                            </button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-3 bg-muted/30 rounded-xl border border-border">
                               <p className="text-[10px] text-muted-foreground font-bold uppercase">Tổng điểm</p>
                               <p className="text-lg font-mono font-bold text-primary">{tier.threshold.toLocaleString()} PTS</p>
                            </div>
                            {tier.conditions?.map((c, i) => (
                              <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border relative overflow-hidden">
                                 <Zap className="absolute -right-2 -bottom-2 w-10 h-10 text-primary/5 -rotate-12" />
                                 <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                   {c.field === 'custom_attribute' ? c.attributeKey : c.field}
                                 </p>
                                 <p className="text-sm font-bold flex items-center gap-1">
                                    {c.operator} {c.value}
                                 </p>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="p-8 md:w-64 bg-primary/5 flex flex-col justify-center items-center text-center">
                         <TrendingUp className="w-8 h-8 text-primary/40 mb-2" />
                         <p className="text-2xl font-black font-heading text-primary">1,240</p>
                         <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Hội viên hiện tại</p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {showDialog && (
        <TierConfigDialog 
          onClose={() => setShowDialog(false)} 
          tier={selectedTier} 
        />
      )}
    </div>
  );
}
