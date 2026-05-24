import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  History
} from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { TierConfig, RedemptionRule, EarnRule, LoyaltyCampaign } from "@/types";
import { RedemptionRuleDialog } from "@/components/loyalty/RedemptionRuleDialog";
import { EarnRuleDialog } from "@/components/loyalty/EarnRuleDialog";
import { LoyaltyCampaignDialog } from "@/components/loyalty/LoyaltyCampaignDialog";
import { cn } from "@/lib/utils";

type TabType = 'tiers' | 'engagement' | 'automation' | 'vip' | 'analytics';

export function LoyaltyView() {
  const { user, loading: authLoading, signIn } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabType>('tiers');
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [earnRules, setEarnRules] = useState<EarnRule[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [selectedRule, setSelectedRule] = useState<RedemptionRule | undefined>(undefined);
  const [selectedEarnRule, setSelectedEarnRule] = useState<EarnRule | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<LoyaltyCampaign | undefined>(undefined);
  
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showEarnDialog, setShowEarnDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const tPath = `users/${user.uid}/tierConfigs`;
    const rPath = `users/${user.uid}/redemptionRules`;
    const ePath = `users/${user.uid}/earnRules`;
    const cPath = `users/${user.uid}/loyaltyCampaigns`;

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

    return () => {
      unsubTiers();
      unsubRules();
      unsubEarn();
      unsubCamp();
    };
  }, [user]);

  if (authLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Khởi tạo hệ thống Ưu đãi...</div>;

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 min-h-[80vh]">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/10">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-heading">Hệ thống Ưu đãi</h2>
            <p className="text-muted-foreground text-sm">Nâng tầm trải nghiệm khách hàng với đặc quyền VIP và cá nhân hóa AI.</p>
          </div>
          <button 
            onClick={signIn}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25"
          >
            Đăng nhập để bắt đầu
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'tiers', label: 'Hạng & Tích điểm', icon: Star },
    { id: 'engagement', label: 'Tương tác & AI', icon: Scissors },
    { id: 'automation', label: 'Chiến dịch Tự động', icon: Zap },
    { id: 'vip', label: 'Đặc quyền VIP', icon: Gem },
    { id: 'analytics', label: 'Chỉ số Loyalty', icon: TrendingUp },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/10">
      <div className="px-8 pt-8 pb-4 space-y-6 bg-background border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading">Chương trình Ưu đãi</h2>
            <p className="text-muted-foreground text-sm mt-1">Xây dựng trọn vẹn đặc quyền và trải nghiệm VIP cho khách hàng.</p>
          </div>
          <div className="flex gap-4">
             <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-muted/30 rounded-2xl border border-border/50">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none mb-1">Retention</p>
                  <p className="text-lg font-bold">84%</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none mb-1">Referrals</p>
                  <p className="text-lg font-bold">124</p>
                </div>
             </div>
             <button 
                onClick={() => { setSelectedEarnRule(undefined); setShowEarnDialog(true); }}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center"
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

            {activeTab === 'analytics' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 {[
                   { label: "Mức độ hài lòng AI", value: "9.2/10", icon: Gem, color: 'text-indigo-500' },
                   { label: "Tỷ lệ nâng hạng", value: "24.5%", icon: ArrowUpRight, color: 'text-emerald-500' },
                   { label: "Churn Risk Score", value: "12 (Low)", icon: Zap, color: 'text-rose-500' },
                   { label: "Referral GMV", value: "$12,400", icon: Users, color: 'text-blue-500' },
                 ].map((stat, i) => (
                   <Card key={i} className="p-5 flex flex-col justify-between border-border/50 bg-card/50">
                      <div className="flex justify-between items-start">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                         <stat.icon className={cn("w-4 h-4", stat.color)} />
                      </div>
                      <div className="mt-4">
                         <h4 className="text-2xl font-black">{stat.value}</h4>
                      </div>
                   </Card>
                 ))}
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
    </div>
  );
}
