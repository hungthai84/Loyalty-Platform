import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Star, 
  Gift, 
  ChevronRight, 
  Zap, 
  Trophy, 
  Users, 
  Scissors, 
  Smartphone,
  Calendar,
  Camera,
  Share2,
  Gem,
  ArrowUpRight,
  TrendingUp,
  History,
  Tag,
  AlertCircle,
  Sparkles,
  Check,
  CheckCircle2,
  Trash2,
  Award,
  Coins
} from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, setDoc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { TierConfig, RedemptionRule, EarnRule, LoyaltyCampaign, SegmentationRule, Customer } from "@/types";
import { RedemptionRuleDialog } from "@/components/loyalty/RedemptionRuleDialog";
import { EarnRuleDialog } from "@/components/loyalty/EarnRuleDialog";
import { LoyaltyCampaignDialog } from "@/components/loyalty/LoyaltyCampaignDialog";
import { SegmentationRuleDialog } from "@/components/loyalty/SegmentationRuleDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  getGuestTiers, 
  getGuestRedemptionRules, 
  getGuestEarnRules, 
  getGuestCampaigns, 
  getGuestSegmentationRules, 
  getGuestCustomers,
  saveGuestTier,
  saveGuestRedemptionRule,
  deleteGuestRedemptionRule,
  saveGuestEarnRule,
  deleteGuestEarnRule,
  saveGuestCampaign,
  deleteGuestCampaign,
  saveGuestSegmentationRule,
  deleteGuestSegmentationRule,
  saveGuestCustomer
} from "@/data/guestData";

type TabType = 'tiers' | 'segmentation' | 'engagement' | 'automation' | 'vip';

const COLOR_PRESET_MAP: Record<string, { badge: string; text: string; bg: string }> = {
  gold: { badge: 'bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/30', text: 'text-[#2f6cf5]', bg: 'bg-[#2f6cf5]' },
  emerald: { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', text: 'text-emerald-500', bg: 'bg-emerald-500' },
  rose: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30', text: 'text-rose-500', bg: 'bg-rose-500' },
  sky: { badge: 'bg-sky-500/10 text-sky-500 border-sky-500/30', text: 'text-sky-500', bg: 'bg-sky-500' },
  indigo: { badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30', text: 'text-indigo-500', bg: 'bg-indigo-500' },
  purple: { badge: 'bg-purple-500/10 text-purple-500 border-purple-500/30', text: 'text-purple-500', bg: 'bg-purple-500' },
  slate: { badge: 'bg-slate-500/10 text-slate-500 border-slate-500/30', text: 'text-slate-500', bg: 'bg-slate-500' },
};

function evaluateCustomerSegment(customer: Customer, rule: SegmentationRule): boolean {
  let customerValue = 0;
  
  if (rule.criteriaType === 'total_spend') {
    const spend = customer.customFields?.spend ?? 
                  customer.customFields?.totalSpend ?? 
                  customer.customFields?.total_spend ?? 
                  (customer as any).spend ?? 
                  (customer.points ? customer.points * 50000 : 0);
    customerValue = Number(spend) || 0;
  } else if (rule.criteriaType === 'time_since_last_purchase') {
    const lastPurchaseDate = customer.lastTransactionAt?.toDate?.() || 
                            (customer.lastTransactionAt ? new Date(customer.lastTransactionAt) : null) ||
                            customer.createdAt?.toDate?.() || 
                            (customer.createdAt ? new Date(customer.createdAt) : new Date());
    const diffTime = Math.max(0, new Date().getTime() - lastPurchaseDate.getTime());
    customerValue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else if (rule.criteriaType === 'points_balance') {
    customerValue = Number(customer.points) || 0;
  }

  const threshold = Number(rule.value) || 0;

  switch (rule.operator) {
    case 'gte': return customerValue >= threshold;
    case 'gt': return customerValue > threshold;
    case 'eq': return customerValue === threshold;
    case 'lte': return customerValue <= threshold;
    case 'lt': return customerValue < threshold;
    default: return false;
  }
}

export function LoyaltyView() {
  const { user, loading: authLoading, signIn } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabType>('tiers');
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [earnRules, setEarnRules] = useState<EarnRule[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [selectedRule, setSelectedRule] = useState<RedemptionRule | undefined>(undefined);
  const [selectedEarnRule, setSelectedEarnRule] = useState<EarnRule | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<LoyaltyCampaign | undefined>(undefined);
  const [selectedSegRule, setSelectedSegRule] = useState<SegmentationRule | undefined>(undefined);
  
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showEarnDialog, setShowEarnDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showSegDialog, setShowSegDialog] = useState(false);

  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
      const loadGuestData = () => {
        setTiers(getGuestTiers());
        setRules(getGuestRedemptionRules());
        setEarnRules(getGuestEarnRules());
        setCampaigns(getGuestCampaigns());
        setSegmentationRules(getGuestSegmentationRules());
        setCustomers(getGuestCustomers());
        setLoading(false);
      };

      loadGuestData();
      window.addEventListener("crm_guest_data_changed", loadGuestData);
      return () => {
        window.removeEventListener("crm_guest_data_changed", loadGuestData);
      };
    }

    const tPath = `users/${user.uid}/tierConfigs`;
    const rPath = `users/${user.uid}/redemptionRules`;
    const ePath = `users/${user.uid}/earnRules`;
    const cPath = `users/${user.uid}/loyaltyCampaigns`;
    const sPath = `users/${user.uid}/segmentationRules`;
    const custPath = `users/${user.uid}/customers`;

    const unsubTiers = onSnapshot(query(collection(db, tPath), orderBy("threshold", "asc")), (s) => {
      setTiers(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as TierConfig)));
      setLoading(false);
    });

    const unsubRules = onSnapshot(query(collection(db, rPath), orderBy("pointsRequired", "asc")), (s) => {
      setRules(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as RedemptionRule)));
    });

    const unsubEarn = onSnapshot(query(collection(db, ePath), orderBy("createdAt", "desc")), (s) => {
      setEarnRules(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as EarnRule)));
    });

    const unsubCamp = onSnapshot(query(collection(db, cPath), orderBy("createdAt", "desc")), (s) => {
      setCampaigns(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoyaltyCampaign)));
    });

    const unsubSeg = onSnapshot(query(collection(db, sPath), orderBy("createdAt", "desc")), (s) => {
      setSegmentationRules(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as SegmentationRule)));
    });

    const unsubCust = onSnapshot(collection(db, custPath), (s) => {
      setCustomers(s.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer)));
    });

    return () => {
      unsubTiers();
      unsubRules();
      unsubEarn();
      unsubCamp();
      unsubSeg();
      unsubCust();
    };
  }, [user]);

  const handleBootstrapRules = async () => {
    const templates = [
      {
        id: 'seg_big_spender',
        name: 'Khách hàng chi tiêu lớn (Big Spender)',
        tag: 'BIG SPENDER',
        color: 'gold',
        criteriaType: 'total_spend',
        operator: 'gte',
        value: 50000000,
        isActive: true,
      },
      {
        id: 'seg_inactive_member',
        name: 'Thành viên đóng băng (Inactive)',
        tag: 'INACTIVE',
        color: 'slate',
        criteriaType: 'time_since_last_purchase',
        operator: 'gte',
        value: 30,
        isActive: true,
      },
      {
        id: 'seg_loyalty_elite',
        name: 'Thành viên ưu tú (Elite VIP)',
        tag: 'ELITE VIP',
        color: 'emerald',
        criteriaType: 'points_balance',
        operator: 'gte',
        value: 1000,
        isActive: true,
      },
      {
        id: 'seg_winback_candidate',
        name: 'Rủi ro rời bỏ cao (Churn Risk)',
        tag: 'CHURN RISK',
        color: 'rose',
        criteriaType: 'time_since_last_purchase',
        operator: 'gte',
        value: 15,
        isActive: true,
      }
    ];

    const toastId = toast.loading("Đang tự động thiết lập phân khúc mẫu...");
    try {
      if (!user) {
        for (const t of templates) {
          const ruleData: SegmentationRule = {
            ...t,
            userId: 'guest',
            createdAt: new Date().toISOString(),
          } as any;
          saveGuestSegmentationRule(ruleData);
        }
        toast.success("Đã đồng bộ trọn bộ phân khúc mẫu thành công! (dùng thử)", { id: toastId });
        return;
      }

      for (const t of templates) {
        const id = t.id;
        const ruleData = {
          ...t,
          userId: user.uid,
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, `users/${user.uid}/segmentationRules`, id), ruleData);
      }
      toast.success("Đã đồng bộ trọn bộ phân khúc mẫu thành công!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Không thể hoàn thành thiết lập mẫu.", { id: toastId });
    }
  };

  const handleSyncTagsToCustomers = async () => {
    if (customers.length === 0 || segmentationRules.length === 0) {
      toast.error("Không có quy tắc hoặc khách hàng nào để đồng bộ.");
      return;
    }

    setSyncing(true);
    const toastId = toast.loading("Đang gán nhãn tự động cho toàn bộ khách hàng...");

    try {
      if (!user) {
        let updatedCount = 0;
        for (const customer of customers) {
          const matchedTags = segmentationRules
            .filter(r => r.isActive && evaluateCustomerSegment(customer, r))
            .map(r => ({ tag: r.tag, color: r.color }));

          const updatedCustomer = {
            ...customer,
            customFields: {
              ...customer.customFields,
              autoTags: matchedTags
            },
            updatedAt: new Date().toISOString()
          };
          saveGuestCustomer(updatedCustomer);
          updatedCount++;
        }
        toast.success(`Đã tự động tính toán & gán thành công nhãn phân khúc cho ${updatedCount} khách hàng! (dùng thử)`, { id: toastId });
        return;
      }

      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const customer of customers) {
        const matchedTags = segmentationRules
          .filter(r => r.isActive && evaluateCustomerSegment(customer, r))
          .map(r => ({ tag: r.tag, color: r.color }));

        const custRef = doc(db, `users/${user.uid}/customers/${customer.id}`);
        const updatedFields = {
          ...customer.customFields,
          autoTags: matchedTags
        };

        batch.update(custRef, {
          customFields: updatedFields,
          updatedAt: serverTimestamp()
        });
        updatedCount++;
      }

      await batch.commit();
      toast.success(`Đã tự động tính toán & gán thành công nhãn phân khúc cho ${updatedCount} khách hàng!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi hoàn thiện đồng bộ.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Khởi tạo hệ thống Ưu đãi...</div>;

  const tabs = [
    { id: 'tiers', label: 'Hạng & Tích điểm', icon: Star },
    { id: 'segmentation', label: 'Quy tắc Phân khúc', icon: Tag },
    { id: 'engagement', label: 'Tương tác & AI', icon: Scissors },
    { id: 'automation', label: 'Chiến dịch Tự động', icon: Zap },
    { id: 'vip', label: 'Đặc quyền VIP', icon: Gem },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/10">
      <div className="px-8 pt-6 pb-6 border-b border-border/50 shrink-0 space-y-6">
        <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 0.95, 1.05, 1],
                  rotate: [0, 15, -15, 10, 0]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 5.5,
                  ease: "easeInOut"
                }}
              >
                <Trophy className="w-8 h-8 text-amber-500" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Chương trình Ưu đãi</h2>
              <p className="text-muted-foreground text-sm mt-1">Xây dựng trọn vẹn đặc quyền và trải nghiệm VIP cho khách hàng.</p>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-[#2f6cf5] font-extrabold leading-none mb-1">Retention</p>
                  <p className="text-lg font-extrabold text-foreground">84%</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-[#2f6cf5] font-extrabold leading-none mb-1">Referrals</p>
                  <p className="text-lg font-extrabold text-foreground">124</p>
                </div>
             </div>
             <button 
                onClick={() => { setSelectedEarnRule(undefined); setShowEarnDialog(true); }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Thiết lập mới
             </button>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all gap-2",
                  activeTab === tab.id 
                    ? "bg-background text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6 pb-20 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {activeTab === 'tiers' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-heading flex items-center">
                      <Star className="w-5 h-5 mr-3 text-primary" /> Phân hạng Thành viên
                    </h3>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {tiers.map((tier) => (
                      <Card 
                        key={tier.id} 
                        className="relative overflow-hidden group border-none glass-card p-6 border-l-4"
                        style={{ borderLeftColor: tier.color }}
                      >
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Star className="w-20 h-20 text-primary" />
                         </div>
                         <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xl font-bold font-heading">{tier.name}</h4>
                            <Badge variant="secondary" className="font-mono bg-muted text-muted-foreground border-none text-[10px]">
                              {tier.threshold.toLocaleString()} pts
                            </Badge>
                         </div>
                         <div className="space-y-4 relative z-10">
                            <div className="flex items-baseline gap-2">
                               <span className="text-4xl font-black text-primary" style={{ color: tier.color }}>{tier.multiplier || 1}x</span>
                               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Tích điểm</span>
                            </div>
                         </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-heading flex items-center">
                      <Gift className="w-5 h-5 mr-3 text-primary" /> Đổi thưởng & Ưu đãi
                    </h3>
                    <button 
                      onClick={() => { setSelectedRule(undefined); setShowRuleDialog(true); }}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tạo phần quà
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {rules.map((rule) => (
                      <Card 
                        key={rule.id}
                        onClick={() => { setSelectedRule(rule); setShowRuleDialog(true); }}
                        className="flex items-center p-4 gap-4 glass-card hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Gift className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm leading-tight">{rule.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Yêu cầu {rule.pointsRequired.toLocaleString()} pts</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'segmentation' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-sidebar/50 border border-border/80 rounded-3xl backdrop-blur-md">
                  <div>
                    <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" /> Quy tắc Phân khúc tự động
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Thiết lập tiêu chí để gán nhãn CRM tự động khi khách hàng thỏa mãn tổng doanh thu chi tiêu hoặc ngày không mua sắm.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {segmentationRules.length === 0 && (
                      <button
                        onClick={handleBootstrapRules}
                        className="px-4 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" /> Khởi tạo mẫu lọc nhanh
                      </button>
                    )}
                    <button
                      onClick={handleSyncTagsToCustomers}
                      disabled={syncing || customers.length === 0 || segmentationRules.length === 0}
                      className="px-4 py-2 bg-primary disabled:opacity-50 text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {syncing ? "Đang đồng bộ..." : "Chạy phân khúc & Gán nhãn"}
                    </button>
                    <button
                      onClick={() => { setSelectedSegRule(undefined); setShowSegDialog(true); }}
                      className="px-4 py-2 bg-sidebar border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm quy tắc mới
                    </button>
                  </div>
                </div>

                {segmentationRules.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-dashed border-border flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                      <Tag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base">Chưa có quy tắc phân khúc tự động</h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Tạo quy tắc mới hoặc bắt đầu nhanh bằng bộ quy tắc phân khúc chuẩn (Big Spender, Inactive, Churn Risk, VIP) của chúng tôi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBootstrapRules}
                      className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Tự động nạp mẫu lọc nhanh
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: rule card list */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {segmentationRules.map((rule) => {
                          const matchedPreset = COLOR_PRESET_MAP[rule.color || 'gold'] || COLOR_PRESET_MAP.gold;
                          const matchedCount = customers.filter(c => evaluateCustomerSegment(c, rule)).length;
                          const isSelected = selectedSegId === rule.id;

                          return (
                            <Card
                              key={rule.id}
                              onClick={() => setSelectedSegId(rule.id)}
                              className={cn(
                                "p-5 relative overflow-hidden transition-all duration-300 border bg-sidebar/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col justify-between",
                                matchedPreset.badge,
                                isSelected ? "ring-2 ring-primary border-transparent bg-sidebar-accent/40" : "border-border/50",
                                !rule.isActive && "opacity-60"
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5 animate-fade-in">
                                    <span className={cn("inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full border mb-1.5", matchedPreset.badge)}>
                                      {rule.tag}
                                    </span>
                                    <h4 className="font-extrabold text-sm tracking-tight leading-tight text-foreground">{rule.name}</h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSegRule(rule);
                                      setShowSegDialog(true);
                                    }}
                                    className="p-1 px-2.5 bg-background border border-border hover:bg-muted text-foreground text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                </div>

                                <div className="space-y-1 pt-1.5 text-xs text-muted-foreground border-t border-border/40">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">Chỉ số:</span>
                                    <span>
                                      {rule.criteriaType === 'total_spend' ? 'Tổng chi tiêu' :
                                       rule.criteriaType === 'time_since_last_purchase' ? 'Số ngày không giao dịch' : 'Điểm tích lũy'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">Nhóm lọc:</span>
                                    <span className="font-mono text-foreground font-semibold">
                                      {rule.operator === 'gte' ? '>= ' : 
                                       rule.operator === 'gt' ? '> ' : 
                                       rule.operator === 'eq' ? '= ' : 
                                       rule.operator === 'lte' ? '<= ' : '< '}
                                      {rule.criteriaType === 'total_spend' 
                                        ? `${rule.value.toLocaleString('vi-VN')} ₫` 
                                        : rule.criteriaType === 'time_since_last_purchase' 
                                          ? `${rule.value} ngày` 
                                          : `${rule.value} pts`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground font-medium">Khách hàng đạt yêu cầu:</span>
                                <span className="text-xs font-bold font-heading bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                  {matchedCount} KH ({customers.length > 0 ? Math.round((matchedCount / customers.length) * 100) : 0}%)
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right column: matched customers inspection panel */}
                    <div className="lg:col-span-1">
                      {selectedSegId ? (() => {
                        const activeRule = segmentationRules.find(r => r.id === selectedSegId);
                        if (!activeRule) return null;
                        const matchedCustomers = customers.filter(c => evaluateCustomerSegment(c, activeRule));
                        const colorMeta = COLOR_PRESET_MAP[activeRule.color || 'gold'] || COLOR_PRESET_MAP.gold;

                        return (
                          <Card className="p-6 border border-border/50 bg-sidebar/40 backdrop-blur-md flex flex-col h-full rounded-2xl">
                            <div className="border-b pb-4 mb-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#2f6cf5]">Trình kiểm tra tệp</span>
                                <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded shadow-2xs border", colorMeta.badge)}>
                                  {activeRule.tag}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-foreground truncate">{activeRule.name}</h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Tìm thấy {matchedCustomers.length} khách hàng thỏa quy chuẩn.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-1">
                              {matchedCustomers.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground space-y-2">
                                  <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-rose-500 animate-pulse" />
                                  <p className="text-xs font-medium">Chưa có khách hàng nào khớp tiêu chí lọc này hiện hữu.</p>
                                </div>
                              ) : (
                                matchedCustomers.map((cust) => {
                                  const spendValue = cust.customFields?.spend ?? 
                                                     cust.customFields?.totalSpend ?? 
                                                     cust.customFields?.total_spend ?? 
                                                     (cust as any).spend ?? 
                                                     (cust.points ? cust.points * 50000 : 0);
                                  
                                  const lastDate = cust.lastTransactionAt?.toDate?.() || 
                                                   (cust.lastTransactionAt ? new Date(cust.lastTransactionAt) : null) ||
                                                   cust.createdAt?.toDate?.() || 
                                                   (cust.createdAt ? new Date(cust.createdAt) : null);
                                  
                                  return (
                                    <div key={cust.id} className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center gap-3 hover:bg-muted/45 transition-all">
                                      {cust.avatarUrl ? (
                                        <img src={cust.avatarUrl} className="w-8 h-8 rounded-lg border border-border/20 shadow-xs object-cover" alt="" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg border border-border/20 shadow-xs bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                          {cust.name.slice(0, 2)}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-bold text-foreground truncate">{cust.name}</h5>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                                          <span>💰 {Number(spendValue).toLocaleString('vi-VN')} đ</span>
                                          <span className="text-muted-foreground/30">•</span>
                                          <span>📅 {lastDate ? lastDate.toLocaleDateString('vi-VN') : 'Mới'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </Card>
                        );
                      })() : (
                        <Card className="p-8 border border-border/50 bg-sidebar/30 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
                          <Tag className="w-10 h-10 text-muted-foreground/50 animate-bounce mb-3" />
                          <h5 className="font-bold text-sm text-foreground">Trình kiểm tra trực quan</h5>
                          <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                            Nhấp chọn bất kỳ thẻ Quy tắc Phân khúc bên trái để soi chi tiết tệp khách hàng thỏa mãn ngay lập tức.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'engagement' && (
              <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-heading">Quy tắc tích lũy Engagement</h3>
                    <button className="text-sm font-bold text-primary">Cấu hình Global Multiplier</button>
                  </div>
                  <div className="space-y-3">
                    {earnRules.map((er) => (
                      <Card 
                        key={er.id}
                        onClick={() => { setSelectedEarnRule(er); setShowEarnDialog(true); }}
                        className={cn(
                          "flex items-center p-5 gap-5 border border-border/50 hover:border-primary transition-all cursor-pointer group",
                          !er.isActive && "opacity-60 bg-muted/20"
                        )}
                      >
                         <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                            {er.type === 'review' ? <Star className="text-yellow-500" /> : 
                             er.type === 'referral' ? <Share2 className="text-blue-500" /> : 
                             er.type === 'ai_styling' ? <Scissors className="text-indigo-500" /> :
                             er.type === 'checkin' ? <Camera className="text-purple-500" /> :
                             <TrendingUp className="text-primary" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base truncate">{er.name}</h4>
                              {!er.isActive && <Badge variant="outline" className="text-[8px] uppercase">Vô hiệu</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Tặng +{er.points.toLocaleString()} pts khi hoàn thành</p>
                         </div>
                         <div className="p-2 border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                         </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <Card className="p-6 border-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="font-bold text-lg mb-2 flex items-center">
                      <Scissors className="w-5 h-5 mr-2 text-indigo-500" /> AI Personalization
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI học lịch sử mua và phong cách để đề xuất quà tặng cá nhân hóa. Tự động nâng nhân hạng điểm khi khách dùng tính năng "AI Stylist".
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" /> Automation & Campaigns
                   </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                   {campaigns.map((camp) => (
                     <Card 
                      key={camp.id}
                      onClick={() => { setSelectedCampaign(camp); setShowCampaignDialog(true); }}
                      className={cn(
                        "relative p-6 border-none glass-card hover:shadow-xl transition-all cursor-pointer",
                        !camp.isActive && "opacity-60"
                      )}
                    >
                        <div className="flex items-center justify-between mb-4">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              {camp.type === 'birthday' ? <Gift className="w-5 h-5" /> : 
                               camp.type === 'winback' ? <Zap className="w-5 h-5 text-amber-500" /> :
                               <Calendar className="w-5 h-5" />}
                           </div>
                           <Badge variant={camp.isActive ? "default" : "outline"} className="text-[8px] tracking-widest">
                              {camp.isActive ? "LIVE" : "STOPPED"}
                           </Badge>
                        </div>
                        <h4 className="font-bold text-lg leading-none mb-2">{camp.name}</h4>
                        <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{camp.description || 'Ưu đãi tự động dành cho khách hàng.'}</p>
                     </Card>
                   ))}
                </div>
              </div>
            )}


          </motion.div>
        </AnimatePresence>
      </div>

      {showRuleDialog && (
        <RedemptionRuleDialog 
          onClose={() => setShowRuleDialog(false)} 
          rule={selectedRule}
        />
      )}

      {showEarnDialog && (
        <EarnRuleDialog 
          onClose={() => setShowEarnDialog(false)} 
          rule={selectedEarnRule}
        />
      )}

      {showCampaignDialog && (
        <LoyaltyCampaignDialog 
          onClose={() => setShowCampaignDialog(false)} 
          campaign={selectedCampaign}
        />
      )}

      {showSegDialog && (
        <SegmentationRuleDialog 
          onClose={() => setShowSegDialog(false)} 
          rule={selectedSegRule}
        />
      )}
    </div>
  );
}
