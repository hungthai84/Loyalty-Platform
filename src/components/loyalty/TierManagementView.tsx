import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Plus, Settings, TrendingUp, Zap, Medal, Award, Crown, Gem, Shield, Search } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { TierConfig } from "@/types";
import { TierConfigDialog } from "@/components/loyalty/TierConfigDialog";
import { getGuestTiers } from "@/data/guestData";
import { toast } from "sonner";
import { LoyaltyTiersBanner } from "./LoyaltyTiersBanner";

interface TierManagementViewProps {
  rules?: any[];
  gifts?: any[];
  searchTerm?: string;
}

export function TierManagementView({ rules = [], gifts = [] }: TierManagementViewProps) {
  const { user } = useFirebase();
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierConfig | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [newBenefit, setNewBenefit] = useState<Record<string, {name: string, value: string}>>({});

  const filteredTiers = tiers.filter(tier => 
    tier.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
    tier.benefits?.some(b => b.name.toLowerCase().includes(localSearchTerm.toLowerCase()) || b.value.toLowerCase().includes(localSearchTerm.toLowerCase()))
  );

  const handleAddInlineBenefit = async (tier: TierConfig) => {
    const input = newBenefit[tier.id];
    if (!input || !input.name.trim() || !input.value.trim()) {
      toast.error("Vui lòng nhập đầy đủ Tên và Nội dung đặc quyền");
      return;
    }

    const updatedBenefits = [...(tier.benefits || []), { name: input.name.trim(), value: input.value.trim() }];
    
    if (!user) return;
    
    try {
      if (user.isLocal) {
        const { getGuestTiers, setLocalStorageData } = await import("@/data/guestData");
        const currentTiers = getGuestTiers();
        const newTiers = currentTiers.map(t => t.id === tier.id ? { ...t, benefits: updatedBenefits } : t);
        setLocalStorageData("crm_guest_tiers_v6", newTiers);
        setTiers(newTiers);
        toast.success("Đã thêm đặc quyền (Local)");
      } else {
        await setDoc(doc(db, "tier_configs", tier.id), {
          benefits: updatedBenefits,
          updatedAt: serverTimestamp()
        }, { merge: true });
        toast.success("Đã thêm đặc quyền");
      }
      setNewBenefit(prev => ({ ...prev, [tier.id]: { name: "", value: "" } }));
    } catch (e) {
      console.error(e);
      toast.error("Thêm đặc quyền thất bại");
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setSelectedTier(undefined);
      setShowDialog(true);
    };
    window.addEventListener('open-add-tier-dialog', handleOpen);
    return () => window.removeEventListener('open-add-tier-dialog', handleOpen);
  }, []);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <LoyaltyTiersBanner
        onAddTier={() => {
            setSelectedTier(undefined);
            setShowDialog(true);
        }}
        searchTerm={localSearchTerm}
        onSearchChange={setLocalSearchTerm}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between px-1">
        <div className="text-left">
          <h5 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest">
            Danh sách phân hạng ({filteredTiers.length})
          </h5>
          <p className="text-xs text-muted-foreground">
            Quản lý đặc quyền & điều kiện thăng hạng
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm hạng hội viên..."
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[10px] text-xs outline-none focus:border-[#2f6cf5]/50 text-foreground"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground col-span-full">Đang tải cấu hình...</div>
        ) : tiers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-[10px] space-y-6 flex flex-col items-center justify-center col-span-full">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold">Chưa có cấp bậc nào</p>
              <p className="text-sm text-muted-foreground mb-6">Hãy bắt đầu bằng cách tạo Hạng Đồng hoặc Hạng Bạc đầu tiên.</p>
              <button 
                onClick={seedDemoData}
                className="px-8 py-3 bg-primary/10 text-primary border border-primary/20 rounded-[10px] text-sm font-bold hover:bg-primary/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Khởi tạo phân hạng mẫu (Member, Essential, Icon, Atelier)
              </button>
            </div>
          </div>
        ) : filteredTiers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-[10px] space-y-4 flex flex-col items-center justify-center col-span-full bg-muted/5">
            <div className="w-12 h-12 bg-muted/40 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Không tìm thấy kết quả</p>
              <p className="text-xs text-muted-foreground">Không tìm thấy hạng hội viên nào khớp với "{localSearchTerm}".</p>
            </div>
          </div>
        ) : (
          filteredTiers.map((tier) => {
            const nameLower = tier.name.toLowerCase();
            let TierIcon = Star;
            if (nameLower.includes("member")) TierIcon = Shield;
            else if (nameLower.includes("essential") || nameLower.includes("silver")) TierIcon = Medal;
            else if (nameLower.includes("icon") || nameLower.includes("gold") || nameLower.includes("vip")) TierIcon = Award;
            else if (nameLower.includes("atelier") || nameLower.includes("platinum")) TierIcon = Gem;
            else if (nameLower.includes("royal") || nameLower.includes("diamond")) TierIcon = Crown;

            return (
              <motion.div
                key={tier.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative cursor-pointer h-full"
                onClick={() => { setSelectedTier(tier); setShowDialog(true); }}
              >
                <Card className="h-full border border-border/80 bg-card overflow-hidden flex flex-col hover:shadow-lg hover:border-primary/20 transition-all rounded-[10px] p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white via-transparent to-transparent opacity-10 pointer-events-none rounded-bl-full" style={{ backgroundImage: `linear-gradient(to bottom left, ${tier.color}, transparent)` }} />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: tier.color }}>
                        <TierIcon className="w-6 h-6 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold font-heading text-foreground">{tier.name}</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">{tier.threshold.toLocaleString()} pts</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full border" style={{ backgroundColor: `${tier.color}15`, color: tier.color, borderColor: `${tier.color}30` }}>
                        Hệ số: {tier.multiplier}x
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 opacity-80">
                        <Zap className="w-3.5 h-3.5 text-primary" /> Ưu đãi gần nhất
                      </h5>
                      <div className="space-y-2">
                        {rules.length > 0 ? rules.slice(0, 2).map((r, i) => (
                          <div key={i} className="text-xs font-semibold px-3 py-2 bg-muted/40 text-foreground border border-border/40 rounded-[10px] truncate transition-all hover:bg-muted/60">
                            ✨ {r.name}
                          </div>
                        )) : (
                          <div className="text-xs text-muted-foreground/60 italic px-3 py-2">Chưa có ưu đãi</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 opacity-80">
                        <Gem className="w-3.5 h-3.5 text-amber-500" /> Quà tặng gần nhất
                      </h5>
                      <div className="space-y-2">
                        {gifts.length > 0 ? gifts.slice(0, 2).map((g, i) => (
                          <div key={i} className="text-xs font-semibold px-3 py-2 bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-[10px] truncate transition-all hover:bg-amber-500/10">
                            🎁 {g.name}
                          </div>
                        )) : (
                          <div className="text-xs text-muted-foreground/60 italic px-3 py-2">Chưa có quà tặng</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-[10px] text-center text-muted-foreground italic opacity-50 z-10 flex-1 flex items-end justify-center">
                    Bấm để xem & cấu hình chi tiết phân hạng
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {showDialog && (
        <TierConfigDialog 
          onClose={() => setShowDialog(false)} 
          tier={selectedTier}
          availableRules={rules}
        />
      )}
    </div>
  );
}
