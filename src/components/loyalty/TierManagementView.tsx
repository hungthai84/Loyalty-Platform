import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Plus, Settings, TrendingUp, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { TierConfig } from "@/types";
import { TierConfigDialog } from "@/components/loyalty/TierConfigDialog";
import { getGuestTiers } from "@/data/guestData";
import { toast } from "sonner";

export function TierManagementView() {
  const { user } = useFirebase();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierConfig | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    if (user.isLocal) {
      setTiers(getGuestTiers());
      setLoading(false);
      return;
    }

    const path = `tier_configs`;
    const q = query(collection(db, path), orderBy("threshold", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTiers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TierConfig)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const seedDemoData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { GUEST_TIERS } = await import("@/data/guestData");
      if (user.isLocal) {
        const { setLocalStorageData } = await import("@/data/guestData");
        setLocalStorageData("crm_guest_tiers_v6", GUEST_TIERS);
        setTiers(GUEST_TIERS);
        toast.success("Đã khởi tạo phân hạng mẫu (Chế độ Local) thành công");
      } else {
        for (const tier of GUEST_TIERS) {
          const { id, ...data } = tier;
          await setDoc(doc(db, "tier_configs", id), {
            ...data,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
        toast.success("Đã đồng bộ phân hạng mẫu lên hệ thống thành công");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khởi tạo dữ liệu mẫu");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground col-span-full">Đang tải cấu hình...</div>
        ) : tiers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl space-y-6 flex flex-col items-center justify-center col-span-full">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold">Chưa có cấp bậc nào</p>
              <p className="text-sm text-muted-foreground mb-6">Hãy bắt đầu bằng cách tạo Hạng Đồng hoặc Hạng Bạc đầu tiên.</p>
              <button 
                onClick={seedDemoData}
                className="px-8 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-sm font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Khởi tạo phân hạng mẫu (Member, Essential, Icon, Atelier)
              </button>
            </div>
          </div>
        ) : (
          tiers.map((tier) => (
            <div
              key={tier.id}
              className="h-full"
            >
              <Card className="h-full border border-border bg-card shadow-sm rounded-3xl overflow-hidden relative border-t-8 flex flex-col" style={{ borderTopColor: tier.color }}>
                <CardContent className="p-0 flex-1 flex flex-col">
                  {/* Header Section */}
                  <div className="p-6 pb-4 bg-muted/5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: tier.color }}>
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black font-heading tracking-tight">{tier.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Hệ số: {tier.multiplier}x</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedTier(tier); setShowDialog(true); }}
                        className="p-2 hover:bg-muted bg-white/50 backdrop-blur-sm rounded-xl transition-colors shadow-sm"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 flex-1">
                    {/* Threshold */}
                    <div>
                      <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 opacity-60">Điều kiện thăng hạng</h5>
                      <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Tích lũy</span>
                        <span className="text-xl font-black text-primary">{tier.threshold.toLocaleString()} PTS</span>
                      </div>
                    </div>
                    
                    {/* Dynamic Conditions if any */}
                    {tier.conditions && tier.conditions.length > 0 && (
                      <div className="space-y-1.5">
                        {tier.conditions.map((c, i) => (
                          <div key={i} className="px-3 py-2 bg-muted/20 rounded-xl border border-border/40 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.field === 'custom_attribute' ? c.attributeKey : c.field}</span>
                            <span className="text-xs font-bold">{c.operator} {c.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Benefits */}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 opacity-60">Đặc quyền cấp bậc</h5>
                        <div className="grid grid-cols-1 gap-1.5">
                          {tier.benefits.slice(0, 3).map((benefit, i) => (
                            <div key={i} className="flex justify-between items-center bg-muted/10 px-3 py-1.5 rounded-lg border border-border/20">
                              <span className="text-[10px] font-bold text-foreground line-clamp-1">{benefit.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">{benefit.value}</span>
                            </div>
                          ))}
                          {tier.benefits.length > 3 && (
                            <p className="text-[10px] text-center text-muted-foreground font-bold italic pt-1">+ {tier.benefits.length - 3} đặc quyền khác</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 bg-muted/5 border-t border-border/50 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-1.5 opacity-50">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Quy mô</span>
                    </div>
                    <span className="text-sm font-black text-muted-foreground">1,240 <span className="text-[10px] uppercase font-bold ml-1 opacity-50">Pax</span></span>
                  </div>
                </CardContent>
              </Card>
            </div>
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
