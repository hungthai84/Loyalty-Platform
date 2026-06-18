import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Star,
  Gift,
  Zap,
  Trophy,
  Scissors,
  Camera,
  Share2,
  Gem,
  TrendingUp,
  Tag,
  Sparkles,
  Heart,
  Crown,
  Award,
  X,
  Coins,
  BookOpen,
  RefreshCw,
  UserPlus,
  CalendarHeart,
  MessageSquareQuote,
  Target,
  ThumbsUp,
  Youtube,
  Search,
  Puzzle,
} from "lucide-react";
import { formatCurrency, getCurrency } from "@/lib/currency";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";


import {
  TierConfig,
  RedemptionRule,
  EarnRule,
  LoyaltyCampaign,
  SegmentationRule,
  Customer,
} from "@/types";
import { RedemptionRuleDialog } from "@/components/loyalty/RedemptionRuleDialog";
import { EarnRuleDialog } from "@/components/loyalty/EarnRuleDialog";
import { LoyaltyCampaignDialog } from "@/components/loyalty/LoyaltyCampaignDialog";
import { SegmentationRuleDialog } from "@/components/loyalty/SegmentationRuleDialog";
import { TierManagementView } from "@/components/loyalty/TierManagementView";
import { TierComparisonTable } from "@/components/loyalty/TierComparisonTable";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { PointRedemptionConfigView } from "@/components/loyalty/PointRedemptionConfigView";
import { GiftsManagementView } from "@/components/loyalty/GiftsManagementView";
import { PointsManagementView } from "@/components/loyalty/PointsManagementView";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getGuestTiers,
  saveGuestTier,
  setLocalStorageData,
  getGuestRedemptionRules,
  getGuestEarnRules,
  getGuestCampaigns,
  getGuestSegmentationRules,
  getGuestCustomers,
  saveGuestSegmentationRule,
  saveGuestCustomer,
} from "@/data/guestData";

type TabType = "tiers" | "points" | "gifts" | "redemption";

const COLOR_PRESET_MAP: Record<
  string,
  { badge: string; text: string; bg: string }
> = {
  gold: {
    badge: "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/30",
    text: "text-[#2f6cf5]",
    bg: "bg-[#2f6cf5]",
  },
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    text: "text-rose-500",
    bg: "bg-rose-500",
  },
  sky: {
    badge: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    text: "text-sky-500",
    bg: "bg-sky-500",
  },
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
    text: "text-indigo-500",
    bg: "bg-indigo-500",
  },
  purple: {
    badge: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    text: "text-purple-500",
    bg: "bg-purple-500",
  },
  slate: {
    badge: "bg-slate-500/10 text-slate-500 border-slate-500/30",
    text: "text-slate-500",
    bg: "bg-slate-500",
  },
};

function evaluateCustomerSegment(
  customer: Customer,
  rule: SegmentationRule,
): boolean {
  let customerValue = 0;

  if (rule.criteriaType === "total_spend") {
    const spend =
      customer.customFields?.spend ??
      customer.customFields?.totalSpend ??
      customer.customFields?.total_spend ??
      (customer as any).spend ??
      (customer.points ? customer.points * 50000 : 0);
    customerValue = Number(spend) || 0;
  } else if (rule.criteriaType === "time_since_last_purchase") {
    const lastPurchaseDate =
      customer.lastTransactionAt?.toDate?.() ||
      (customer.lastTransactionAt
        ? new Date(customer.lastTransactionAt)
        : null) ||
      customer.createdAt?.toDate?.() ||
      (customer.createdAt ? new Date(customer.createdAt) : new Date());
    const diffTime = Math.max(
      0,
      new Date().getTime() - lastPurchaseDate.getTime(),
    );
    customerValue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else if (rule.criteriaType === "points_balance") {
    customerValue = Number(customer.points) || 0;
  }

  const threshold = Number(rule.value) || 0;

  switch (rule.operator) {
    case "gte":
      return customerValue >= threshold;
    case "gt":
      return customerValue > threshold;
    case "eq":
      return customerValue === threshold;
    case "lte":
      return customerValue <= threshold;
    case "lt":
      return customerValue < threshold;
    default:
      return false;
  }
}

const DEFAULT_TIER_BENEFITS: Record<string, {name: string, value: string}[]> = {
  member: [
    { name: 'Tích lũy điểm khi mua hàng', value: '1.0x' },
    { name: 'Nhận thông tin bộ sưu tập mới', value: 'Sớm nhất' },
    { name: 'Quà tặng sinh nhật cơ bản', value: 'Mặc định' }
  ],
  essential: [
    { name: 'Tất cả đặc quyền Member', value: 'Kèm theo' },
    { name: 'Ưu tiên mua các sản phẩm limited', value: 'Có hiệu lực' },
    { name: 'Miễn phí giao hàng toàn quốc', value: 'Nhanh' },
    { name: 'Quà tặng sinh nhật cao cấp', value: 'Voucher lớn' }
  ],
  icon: [
    { name: 'Tất cả đặc quyền Essential', value: 'Kèm theo' },
    { name: 'Có stylist tư vấn riêng 1-1', value: '24/7' },
    { name: 'Tham dự Private Event', value: 'Suất VIP' },
    { name: 'Phiếu mua hàng tự động hàng quý', value: 'Voucher 5%' }
  ],
  atelier: [
    { name: 'Tất cả đặc quyền Icon', value: 'Kèm theo' },
    { name: 'Thiết kế trang sức độc bản', value: 'Artisanal' },
    { name: 'Dịch vụ Spa trang sức trọn đời', value: 'Full service' },
    { name: 'Limousine đưa đón mua sắm', value: 'VIP Car' }
  ]
};

function getFallbackBenefits(tierName: string): {name: string, value: string}[] {
  return DEFAULT_TIER_BENEFITS[tierName.toLowerCase()] || [
    { name: 'Tích lũy điểm khi mua hàng', value: 'Mặc định' }
  ];
}

const EARN_ICON_MAP: Record<string, any> = {
  purchase: Coins,
  signup: UserPlus,
  anniversary: CalendarHeart,
  referral: Share2,
  testimonial: MessageSquareQuote,
  review: Star,
  checkin: Camera,
  purchase_quantity: Target,
  beat_best: Trophy,
  purchase_value: TrendingUp,
  social_share: Heart,
  social_follow: ThumbsUp,
  youtube_sub: Youtube,
  review_google: Search,
  custom_task: Puzzle,
  ai_styling: Scissors
};

const EARN_STYLE_MAP: Record<string, { bg: string, text: string, border: string }> = {
  purchase: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/40 hover:border-emerald-500/80 shadow-emerald-500/10' },
  signup: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/40 hover:border-blue-500/80 shadow-blue-500/10' },
  anniversary: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/40 hover:border-rose-500/80 shadow-rose-500/10' },
  referral: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/40 hover:border-indigo-500/80 shadow-indigo-500/10' },
  testimonial: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-500/10' },
  review: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-500/10' },
  checkin: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/40 hover:border-cyan-500/80 shadow-cyan-500/10' },
  purchase_quantity: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-500/40 hover:border-fuchsia-500/80 shadow-fuchsia-500/10' },
  beat_best: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/40 hover:border-orange-500/80 shadow-orange-500/10' },
  purchase_value: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/40 hover:border-emerald-500/80 shadow-emerald-500/10' },
  social_share: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/40 hover:border-sky-500/80 shadow-sky-500/10' },
  social_follow: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/40 hover:border-sky-500/80 shadow-sky-500/10' },
  youtube_sub: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/40 hover:border-red-500/80 shadow-red-500/10' },
  review_google: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/40 hover:border-teal-500/80 shadow-teal-500/10' },
  custom_task: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/40 hover:border-violet-500/80 shadow-violet-500/10' },
  ai_styling: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/40 hover:border-pink-500/80 shadow-pink-500/10' }
};

const DEFAULT_EARN_STYLE = { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/40 hover:border-slate-500/80 shadow-slate-500/10' };


export function LoyaltyView() {
  const { user, loading: authLoading, signIn } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabType>("tiers");
  const [showDoc, setShowDoc] = useState(false);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [earnRules, setEarnRules] = useState<EarnRule[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [segmentationRules, setSegmentationRules] = useState<
    SegmentationRule[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierSearchTerm, setTierSearchTerm] = useState("");

  // Calculate Program Health (average points per member and redemption rate)
  const programHealthStats = useMemo(() => {
    const totalCustomers = customers.length;
    if (totalCustomers === 0) {
      return {
        avgPoints: 0,
        redemptionRate: 0,
        totalPoints: 0,
        totalRedeemed: 0,
      };
    }

    let sumPoints = 0;
    let sumRedeemed = 0;

    customers.forEach((cust) => {
      sumPoints += Number(cust.points) || 0;
      if (cust.redemptions && Array.isArray(cust.redemptions)) {
        cust.redemptions.forEach((red) => {
          sumRedeemed += Number(red.pointsUsed) || Number(red.points_used) || 0;
        });
      }
    });

    const averagePointsPerMember = sumPoints / totalCustomers;
    const totalEarnedPoints = sumPoints + sumRedeemed;
    const redemptionRate = totalEarnedPoints > 0 ? (sumRedeemed / totalEarnedPoints) * 100 : 0;

    return {
      avgPoints: averagePointsPerMember,
      redemptionRate,
      totalPoints: sumPoints,
      totalRedeemed: sumRedeemed,
    };
  }, [customers]);

  // Demo states
  const [selectedSimCustomer, setSelectedSimCustomer] = useState<string>("Nguyễn Thảo Chi");
  const [aiFocusKeyword, setAiFocusKeyword] = useState<string>("gemstone");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulatingCampaign, setIsSimulatingCampaign] = useState<string | null>(null);

  // Global Multiplier and Engagement Simulation States
  const [showGlobalMultiplierDialog, setShowGlobalMultiplierDialog] = useState<boolean>(false);
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem("crm_global_multiplier");
    return saved ? parseFloat(saved) : 1.2;
  });
  const [globalMultiplierReason, setGlobalMultiplierReason] = useState<string>(() => {
    const saved = localStorage.getItem("crm_global_multiplier_reason");
    return saved || "Sự kiện Tri ân Hè Seva Glow";
  });
  const [isGlobalMultiplierActive, setIsGlobalMultiplierActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("crm_global_multiplier_active");
    return saved !== "false"; // default true
  });
  
  const [simulatedEarnPointsCustomer, setSimulatedEarnPointsCustomer] = useState<string>("Nguyễn Thảo Chi");
  const [simulatedEarnPointsRule, setSimulatedEarnPointsRule] = useState<string>("earn_ai_styling");
  const [isSimulatingEngagement, setIsSimulatingEngagement] = useState<boolean>(false);
  const [engagementSimLogs, setEngagementSimLogs] = useState<string[]>([]);

  // Interactive VIP Privilege and AOV Point Calculator states
  const [simAovValue, setSimAovValue] = useState<number>(750000);
  const [selectedSimTierId, setSelectedSimTierId] = useState<string>("tier-member");

  // Automated custom tier parameters
  const [tierFormName, setTierFormName] = useState("");
  const [tierFormThreshold, setTierFormThreshold] = useState<number>(1000);
  const [tierFormMultiplier, setTierFormMultiplier] = useState<number>(1.2);
  const [tierFormColor, setTierFormColor] = useState("#fbbf24");
  const [tierFormIcon, setTierFormIcon] = useState("star");
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  const runCampaignSimulation = (campId: string, campName: string) => {
    setIsSimulatingCampaign(campId);
    setSimulationLogs([]);
    
    const steps = [
      `[INFO] Đang quét cơ sở dữ liệu khách hàng Seva Retail...`,
      `[DETECTOR] Tìm thấy khách hàng phù hợp với tiêu chí "${campName}"`,
      `[CRON] Khởi chạy sự kiện tự động cho khách hàng Nguyễn Thảo Chi (Hạng: Atelier)`,
      `[SUCCESS] Tải thành công tệp cấu hình quà tặng đặc quyền`,
      `[SMS] Tự động soạn tin nhắn cá nhân hoá dập tên dập nhãn riêng`,
      `[GATEWAY] Đang gửi qua tổng đài SMS Brandname VIET_SEVA_VIP...`,
      `[SUCCESS] Tin nhắn đã được gửi thành công: "Chào mừng quý hội viên Nguyễn Thảo Chi..."`,
      `[MAIL] Gửi email tự động kèm bản tin Premium Brochure BST mới vào inbox`,
      `[POINTS] Tự động cộng/nhân điểm tích lũy hóa đơn thành công!`
    ];

    if (campId === "camp_tier_upgrade" || campName.toLowerCase().includes("thăng hạng") || campName.toLowerCase().includes("tier")) {
      steps[1] = `[DETECTOR] Đã phát hiện khách hàng Lê Thúy Diễm đạt tổng chi tiêu thăng hạng Atelier (>1,000,000,000 đ)`;
      steps[3] = `[VIP_ENGAGEMENT] Kích hoạt đặc quyền Welcome Atelier Gift Velvet cao quý`;
      steps[4] = `[DISPATCH] Tự động điều phối chuyên xe xa xỉ đưa đón dạo phố đến tư dinh của quý khách`;
      steps[6] = `[SUCCESS] Đã sắp xếp lịch làm việc trực tiếp cùng Giám đốc Sáng tạo thiết kế rập 3D Bespoke`;
    } else if (campId.includes("winback") || campName.toLowerCase().includes("giỏ hàng") || campName.toLowerCase().includes("giữ chân")) {
      steps[0] = `[INFO] Webhook nhận sự kiện: Khách truy cập rời đi không giao dịch`;
      steps[1] = `[DETECTOR] Phát hiện khách hàng VIP "Nguyễn Thảo Chi" có giỏ hàng chưa thanh toán / Không mua sắm sau 30 ngày`;
      steps[2] = `[CRON] Khởi tạo luồng kịch bản giữ chân tự động (Winback Flow)`;
      steps[3] = `[SYSTEM] Đang sinh mã Voucher cá nhân hóa 10% giảm giá (Mã: WINBACK-VIP-30D)`;
      steps[4] = `[ZALO_ZNS] Gửi tiến độ: "Seva Retail vẫn giữ giỏ hàng cho bạn, kèm Voucher 10%..."`;
      steps[5] = `[SUCCESS] Đã gửi Zalo ZNS thành công đến SDT 09xx.xxx.888`;
      steps[6] = `[CRM] Đặt lịch Reminder nhắc nhở Tele-sales gọi điện chăm sóc sau 48h nếu chưa dùng Voucher`;
      steps[7] = `[TRACKING] Đang theo dõi Real-time sự tương tác qua Click Tracking...`;
      steps[8] = `[SUCCESS] Kịch bản Winback đã được khởi động và đưa vào giám sát Real-time!`;
    } else if (campId === "camp_new_member" || campName.toLowerCase().includes("mới") || campName.toLowerCase().includes("signup") || campName.toLowerCase().includes("đăng ký")) {
      steps[1] = `[DETECTOR] Có 1 thành viên mới vừa đăng ký tài khoản Seva Club: Hoàng Minh Tuấn`;
      steps[2] = `[CRON] Chạy kịch bản chào mừng thành viên mới (Welcome New Member Plan)`;
      steps[4] = `[POINTS] Tự động tặng 150 điểm tích lũy khởi nguồn Seva Club thành công!`;
      steps[6] = `[SUCCESS] Gửi thư chúc mừng nồng nhiệt cùng ưu đãi đặt trước BST giới hạn`;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setSimulationLogs(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsSimulatingCampaign(null);
        toast.success(`Chiến dịch "${campName}" đã được kích hoạt chạy thử toàn diện thành công!`);
      }
    }, 400);
  };

  const startEngagementSimulation = (
    currentSimCust: any,
    currentSimRule: any,
    tierMultiplier: number,
    activeGlobalMult: number,
    calculatedAwarded: number
  ) => {
    if (!currentSimCust || !currentSimRule) {
      toast.error("Vui lòng chọn đầy đủ khách hàng và quy tắc tích lũy!");
      return;
    }
    setIsSimulatingEngagement(true);
    setEngagementSimLogs([]);
    
    const ruleName = currentSimRule.name;
    const custName = currentSimCust.name;
    const basePts = currentSimRule.points || 0;
    const tierName = currentSimCust.tier || "Member";
    
    const steps = [
      `[INIT] Nhận diện hành động: "${ruleName}" từ khách hàng ${custName}`,
      `[DATABASE] Đọc cấu hình phân hạng của ${custName} (Hiện tại: ${tierName})`,
      `[TIER] Áp dụng hệ số tích lũy của hạng ${tierName}: x${tierMultiplier.toFixed(2)}`,
      isGlobalMultiplierActive 
        ? `[GLOBAL] Phát hiện Global Multiplier: x${globalMultiplier.toFixed(1)} (${globalMultiplierReason})` 
        : `[GLOBAL] Global Multiplier không hoạt động (Hệ số mặc định x1.0)`,
      `[CÔNG_THỨC] ${basePts} điểm base x ${tierMultiplier.toFixed(2)} (Hạng) x ${activeGlobalMult.toFixed(1)} (Global) = ${calculatedAwarded} điểm`,
      `[DATABASE] Đang cập nhật số dư điểm thưởng cho ${custName} trên CRM...`,
      `[SUCCESS] Tích lũy hoàn tất! Tài khoản ${custName} tăng lên +${calculatedAwarded} điểm.`
    ];

    let j = 0;
    const engInterval = setInterval(() => {
      if (j < steps.length) {
        setEngagementSimLogs(prev => [...prev, steps[j]]);
        j++;
      } else {
        clearInterval(engInterval);
        setIsSimulatingEngagement(false);
        
        // Update local Storage customer
        const savedCustomers = getGuestCustomers();
        const foundIdx = savedCustomers.findIndex(c => c.id === currentSimCust.id || c.name === custName);
        if (foundIdx > -1) {
          const oldPoints = savedCustomers[foundIdx].points || 0;
          const newPoints = oldPoints + calculatedAwarded;
          const updatedCust = { 
            ...savedCustomers[foundIdx], 
            points: newPoints 
          };
          
          // Thăng hạng dựa trên điểm tích lũy mới
          const currentTiers = getGuestTiers();
          let newTier = updatedCust.tier || "Member";
          const sortedTiers = [...currentTiers].sort((a,b) => b.threshold - a.threshold);
          for (const t of sortedTiers) {
            if (newPoints >= t.threshold) {
              newTier = t.name;
              break;
            }
          }
          if (newTier !== updatedCust.tier) {
            updatedCust.tier = newTier;
            setEngagementSimLogs(prev => [...prev, `🎉 [VIP_UPGRADE] Chúc mừng! Số điểm mới thăng cấp hội viên lên phân hạng sang trọng: ${newTier}!`]);
            toast.success(`Hội viên ${custName} đã chính thức thăng hạng ${newTier}!`);
          }
          
          saveGuestCustomer(updatedCust);
        } else {
          const updatedCustomers = customers.map(c => {
            if (c.id === currentSimCust.id) {
              const newPoints = (c.points || 0) + calculatedAwarded;
              return { ...c, points: newPoints };
            }
            return c;
          });
          setCustomers(updatedCustomers);
        }
        
        toast.success(`Đã tích lũy thành công +${calculatedAwarded} điểm thưởng cho ${custName}!`);
      }
    }, 450);
  };

  // Dialog states
  const [selectedRule, setSelectedRule] = useState<RedemptionRule | undefined>(
    undefined,
  );
  const [selectedEarnRule, setSelectedEarnRule] = useState<
    EarnRule | undefined
  >(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<
    LoyaltyCampaign | undefined
  >(undefined);
  const [selectedSegRule, setSelectedSegRule] = useState<
    SegmentationRule | undefined
  >(undefined);

  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showEarnDialog, setShowEarnDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showSegDialog, setShowSegDialog] = useState(false);

  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [currencyConfig, setCurrencyConfig] = useState(getCurrency());

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyConfig(getCurrency());
    window.addEventListener('seva-currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('seva-currency-changed', handleCurrencyChange);
  }, []);

  const currentCurrency = useMemo(() => getCurrency(), [currencyConfig]);

  // Privilege tab states
  const [showCreatePrivilegeDialog, setShowCreatePrivilegeDialog] = useState(false);
  const [selectedTiersForPrivilege, setSelectedTiersForPrivilege] = useState<string[]>([]);
  const [privilegeName, setPrivilegeName] = useState("");
  const [privilegeValue, setPrivilegeValue] = useState("");
  const [quickAddPrivilegeTierId, setQuickAddPrivilegeTierId] = useState<string | null>(null);
  const [quickAddTexts, setQuickAddTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || user.isLocal) {
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

    const tPath = "tier_configs";
    const rPath = "redemption_rules";
    const ePath = "earn_rules";
    const cPath = "loyalty_campaigns";
    const sPath = "segmentation_rules";
    const custPath = "customers";

    const unsubTiers = onSnapshot(
      query(collection(db, tPath), orderBy("threshold", "asc")),
      (s) => {
        setTiers(
          s.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as TierConfig),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, tPath);
        setLoading(false);
      }
    );

    const unsubRules = onSnapshot(
      query(collection(db, rPath), orderBy("pointsRequired", "asc")),
      (s) => {
        setRules(
          s.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as RedemptionRule,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, rPath)
    );

    const unsubGifts = onSnapshot(
      collection(db, "loyalty_gifts"),
      (s) => {
        setGifts(
          s.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        );
      },
      (error) => console.log(error)
    );

    const unsubEarn = onSnapshot(
      query(collection(db, ePath), orderBy("createdAt", "desc")),
      (s) => {
        setEarnRules(
          s.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as EarnRule),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, ePath)
    );

    const unsubCamp = onSnapshot(
      query(collection(db, cPath), orderBy("createdAt", "desc")),
      (s) => {
        setCampaigns(
          s.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as LoyaltyCampaign,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, cPath)
    );

    const unsubSeg = onSnapshot(
      query(collection(db, sPath), orderBy("createdAt", "desc")),
      (s) => {
        setSegmentationRules(
          s.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as SegmentationRule,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, sPath)
    );

    const unsubCust = onSnapshot(collection(db, custPath), (s) => {
      setCustomers(
        s.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Customer),
      );
    }, (error) => handleFirestoreError(error, OperationType.LIST, custPath));

    return () => {
      unsubTiers();
      unsubRules();
      unsubGifts();
      unsubEarn();
      unsubCamp();
      unsubSeg();
      unsubCust();
    };
  }, [user]);

  const handleBootstrapRules = async () => {
    const templates = [
      {
        id: "seg_big_spender",
        name: "Khách hàng chi tiêu lớn (Big Spender)",
        tag: "BIG SPENDER",
        color: "gold",
        criteriaType: "total_spend",
        operator: "gte",
        value: 50000000,
        isActive: true,
      },
      {
        id: "seg_inactive_member",
        name: "Thành viên đóng băng (Inactive)",
        tag: "INACTIVE",
        color: "slate",
        criteriaType: "time_since_last_purchase",
        operator: "gte",
        value: 30,
        isActive: true,
      },
      {
        id: "seg_loyalty_elite",
        name: "Thành viên ưu tú (Elite VIP)",
        tag: "ELITE VIP",
        color: "emerald",
        criteriaType: "points_balance",
        operator: "gte",
        value: 1000,
        isActive: true,
      },
      {
        id: "seg_winback_candidate",
        name: "Rủi ro rời bỏ cao (Churn Risk)",
        tag: "CHURN RISK",
        color: "rose",
        criteriaType: "time_since_last_purchase",
        operator: "gte",
        value: 15,
        isActive: true,
      },
    ];

    const toastId = toast.loading("Đang tự động thiết lập phân khúc mẫu...");
    try {
      if (!user) {
        for (const t of templates) {
          const ruleData: SegmentationRule = {
            ...t,
            userId: "guest",
            createdAt: new Date().toISOString(),
          } as any;
          saveGuestSegmentationRule(ruleData);
        }
        toast.success(
          "Đã đồng bộ trọn bộ phân khúc mẫu thành công! (dùng thử)",
          { id: toastId },
        );
        return;
      }

      for (const t of templates) {
        const id = t.id;
        const ruleData = {
          ...t,
          userId: user.uid,
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "segmentation_rules", id), ruleData);
      }
      toast.success("Đã đồng bộ trọn bộ phân khúc mẫu thành công!", {
        id: toastId,
      });
    } catch (e) {
      console.error(e);
      toast.error("Không thể hoàn thành thiết lập mẫu.", { id: toastId });
    }
  };

  const handleBootstrapEarnRules = async () => {
    const rules = [
      { name: "Mua hàng (10,000đ = 1đ)", type: "purchase", points: 1, value: 10000, isActive: true },
      { name: "Đăng ký tài khoản mới", type: "signup", points: 50, isActive: true },
      { name: "Kỷ niệm ngày cưới", type: "anniversary", points: 100, isActive: true },
      { name: "Giới thiệu bạn bè", type: "referral", points: 200, isActive: true },
      { name: "Đánh giá dịch vụ", type: "testimonial", points: 50, isActive: true },
      { name: "Review sản phẩm", type: "review", points: 30, isActive: true },
      { name: "Check-in sự kiện", type: "checkin", points: 20, isActive: true }
    ];

    const toastId = toast.loading("Đang nạp dữ liệu mẫu điểm thưởng...");
    try {
      if (!user) {
        toast.error("Vui lòng đăng nhập để có thể lưu quy tắc mới.", { id: toastId });
        return;
      } else {
        const batch = writeBatch(db);
        rules.forEach(r => {
          const id = Math.random().toString(36).substring(7);
          batch.set(doc(db, "earn_rules", id), {
            ...r,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
        toast.success("Đã nạp 7 quy tắc mẫu thành công!", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi nạp dữ liệu mẫu", { id: toastId });
    }
  };

  const handleSyncTagsToCustomers = async () => {
    if (customers.length === 0 || segmentationRules.length === 0) {
      toast.error("Không có quy tắc hoặc khách hàng nào để đồng bộ.");
      return;
    }

    setSyncing(true);
    const toastId = toast.loading(
      "Đang gán nhãn tự động cho toàn bộ khách hàng...",
    );

    try {
      if (!user) {
        let updatedCount = 0;
        for (const customer of customers) {
          const matchedTags = segmentationRules
            .filter((r) => r.isActive && evaluateCustomerSegment(customer, r))
            .map((r) => ({ tag: r.tag, color: r.color }));

          const updatedCustomer = {
            ...customer,
            customFields: {
              ...customer.customFields,
              autoTags: matchedTags,
            },
            updatedAt: new Date().toISOString(),
          };
          saveGuestCustomer(updatedCustomer);
          updatedCount++;
        }
        toast.success(
          `Đã tự động tính toán & gán thành công nhãn phân khúc cho ${updatedCount} khách hàng! (dùng thử)`,
          { id: toastId },
        );
        return;
      }

      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const customer of customers) {
        const matchedTags = segmentationRules
          .filter((r) => r.isActive && evaluateCustomerSegment(customer, r))
          .map((r) => ({ tag: r.tag, color: r.color }));

        const custRef = doc(db, `customers/${customer.id}`);
        const updatedFields = {
          ...customer.customFields,
          autoTags: matchedTags,
        };

        batch.update(custRef, {
          customFields: updatedFields,
          updatedAt: serverTimestamp(),
        });
        updatedCount++;
      }

      await batch.commit();
      toast.success(
        `Đã tự động tính toán & gán thành công nhãn phân khúc cho ${updatedCount} khách hàng!`,
        { id: toastId },
      );
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi hoàn thiện đồng bộ.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateMultiplier = async (tierId: string, multiplier: number) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    if (!user || user.isLocal) {
      saveGuestTier({ ...tier, multiplier });
      toast.success(`Đã cập nhật hệ số điểm cho hạng ${tier.name}`);
    } else {
      const path = `tier_configs/${tierId}`;
      try {
        await setDoc(doc(db, path), { ...tier, multiplier });
        toast.success(`Đã cập nhật hệ số điểm cho hạng ${tier.name}`);
      } catch (error) {
        toast.error("Lỗi cập nhật cấu hình");
      }
    }
  };

  const handleUpdateTierIcon = async (tierId: string, icon: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    if (!user || user.isLocal) {
      saveGuestTier({ ...tier, icon });
      toast.success(`Đã cập nhật icon cho hạng ${tier.name}`);
    } else {
      const path = `tier_configs/${tierId}`;
      try {
        await setDoc(doc(db, path), { ...tier, icon });
        await new Promise(resolve => setTimeout(resolve, 300));
        toast.success(`Đã cập nhật icon cho hạng ${tier.name}`);
      } catch (error) {
        toast.error("Lỗi cập nhật icon");
      }
    }
  };

  const handleSaveCustomTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierFormName.trim()) {
      toast.error("Vui lòng nhập tên hạng hội viên!");
      return;
    }

    const tierId = editingTierId || `tier-${tierFormName.toLowerCase().trim().replace(/\s+/g, "-")}`;
    const tierData: TierConfig = {
      id: tierId,
      name: tierFormName,
      threshold: Number(tierFormThreshold),
      multiplier: Number(tierFormMultiplier),
      color: tierFormColor,
      icon: tierFormIcon,
      benefits: [
        { name: "Hệ số tích luỹ", value: `${tierFormMultiplier}x` },
        { name: "Thời gian duy trì hạn mức", value: "12 Tháng" },
        { name: "Quà tặng sinh nhật", value: "Ưu đãi riêng" }
      ],
      userId: user?.uid || "guest",
      createdAt: new Date().toISOString()
    };

    if (!user || user.isLocal) {
      saveGuestTier(tierData);
      window.dispatchEvent(new Event("crm_guest_data_changed"));
      toast.success(`Đã lưu cấu hình Hạng ${tierFormName} thành công!`);
    } else {
      try {
        const path = `tier_configs/${tierId}`;
        await setDoc(doc(db, path), tierData);
        toast.success(`Đã đồng bộ Hạng ${tierFormName} lên Firestore!`);
      } catch (error) {
        toast.error("Lỗi đồng bộ cấu hình hạng");
      }
    }

    // Reset Form
    setTierFormName("");
    setTierFormThreshold(1000);
    setTierFormMultiplier(1.2);
    setTierFormColor("#fbbf24");
    setTierFormIcon("star");
    setEditingTierId(null);
  };

  const handleLoadDemoTiers = async () => {
    const defaultTiers = getGuestTiers();
    if (!user || user.isLocal) {
      setLocalStorageData("crm_guest_tiers_v6", defaultTiers);
      window.dispatchEvent(new Event("crm_guest_data_changed"));
      toast.success("Đã thêm dữ liệu Demo Cấu hình Cấp bậc thành công!");
    } else {
      try {
        const batch = writeBatch(db);
        defaultTiers.forEach(tier => {
          const docRef = doc(collection(db, "tier_configs"), tier.id);
          batch.set(docRef, { ...tier, userId: user.uid });
        });
        await batch.commit();
        toast.success("Đã đồng bộ dữ liệu Demo Cấu hình Cấp bậc lên Firestore!");
      } catch (error) {
        toast.error("Lỗi đồng bộ cấu hình hạng Demo");
      }
    }
  };

  const handleEditTierClick = (tier: TierConfig) => {
    setEditingTierId(tier.id);
    setTierFormName(tier.name);
    setTierFormThreshold(tier.threshold || 0);
    setTierFormMultiplier(tier.multiplier || 1.0);
    setTierFormColor(tier.color || "#fbbf24");
    setTierFormIcon(tier.icon || "star");
    toast.info(`Đang sửa cấu hình hạng: ${tier.name}`);
  };

  const handleDeleteTier = async (tierId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa hạng hội viên này ra khỏi chương trình?")) {
      if (!user || user.isLocal) {
        const current = getGuestTiers();
        const updated = current.filter(t => t.id !== tierId);
        setLocalStorageData("crm_guest_tiers_v6", updated);
        window.dispatchEvent(new Event("crm_guest_data_changed"));
        toast.success("Đã xóa hạng thành công!");
      } else {
        const path = `tier_configs/${tierId}`;
        try {
          await deleteDoc(doc(db, path));
          toast.success("Đã xóa cấu hình hạng trên cloud!");
        } catch (error) {
          toast.error("Lỗi xóa cấu hình hạng");
        }
      }
    }
  };

  if (authLoading)
    return (
      <div className="p-8 text-center text-muted-foreground font-medium">
        Khởi tạo hệ thống Ưu đãi...
      </div>
    );

  const handleDeletePrivilege = async (tierId: string, privilegeIndex: number) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const currentBenefits = tier.benefits && tier.benefits.length > 0
      ? [...tier.benefits]
      : [...getFallbackBenefits(tier.name)];

    currentBenefits.splice(privilegeIndex, 1);

    if (!user || user.isLocal) {
      const updatedTier = { ...tier, benefits: currentBenefits };
      saveGuestTier(updatedTier);
      toast.success("Đã xóa đặc quyền khỏi hạng " + tier.name);
    } else {
      const path = `tier_configs/${tierId}`;
      try {
        await setDoc(doc(db, path), {
          ...tier,
          benefits: currentBenefits
        });
        toast.success("Đã xóa đặc quyền khỏi hạng " + tier.name);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        toast.error("Không thể cập nhật cấu hình hạng trên Firestore");
      }
    }
  };

  const handleCreatePrivilege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privilegeName.trim()) {
      toast.error("Vui lòng nhập tên đặc quyền");
      return;
    }
    if (selectedTiersForPrivilege.length === 0) {
      toast.error("Vui lòng chọn ít nhất một phân hạng áp dụng");
      return;
    }

    const valueText = privilegeValue.trim() || "Có sẵn";

    if (!user || user.isLocal) {
      selectedTiersForPrivilege.forEach(tierId => {
        const tier = tiers.find(t => t.id === tierId);
        if (tier) {
          const currentBenefits = tier.benefits && tier.benefits.length > 0
            ? [...tier.benefits]
            : [...getFallbackBenefits(tier.name)];

          if (!currentBenefits.some(b => b.name.toLowerCase() === privilegeName.toLowerCase())) {
            currentBenefits.push({ name: privilegeName.trim(), value: valueText });
            saveGuestTier({ ...tier, benefits: currentBenefits });
          }
        }
      });
      toast.success("Đã tạo đặc quyền mới thành công!");
    } else {
      const batch = writeBatch(db);
      selectedTiersForPrivilege.forEach(tierId => {
        const tier = tiers.find(t => t.id === tierId);
        if (tier) {
          const currentBenefits = tier.benefits && tier.benefits.length > 0
            ? [...tier.benefits]
            : [...getFallbackBenefits(tier.name)];

          if (!currentBenefits.some(b => b.name.toLowerCase() === privilegeName.toLowerCase())) {
            currentBenefits.push({ name: privilegeName.trim(), value: valueText });
            batch.set(doc(db, `tier_configs`, tierId), {
              ...tier,
              benefits: currentBenefits
            });
          }
        }
      });

      try {
        await batch.commit();
        toast.success("Đã đồng bộ đặc quyền mới lên hệ thống Cloud!");
      } catch (error) {
        toast.error("Lỗi đồng bộ lên Firestore");
        console.error(error);
      }
    }

    setPrivilegeName("");
    setPrivilegeValue("");
    setSelectedTiersForPrivilege([]);
    setShowCreatePrivilegeDialog(false);
  };

  const handleQuickAddPrivilege = async (tierId: string, name: string, value: string) => {
    if (!name.trim()) return;
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    const currentBenefits = tier.benefits && tier.benefits.length > 0
      ? [...tier.benefits]
      : [...getFallbackBenefits(tier.name)];

    if (!currentBenefits.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      currentBenefits.push({ name: name.trim(), value: value.trim() || "Có sẵn" });

      if (!user || user.isLocal) {
        saveGuestTier({ ...tier, benefits: currentBenefits });
        toast.success(`Đã thêm nhanh đặc quyền vào hạng ${tier.name}`);
      } else {
        const path = `tier_configs/${tierId}`;
        try {
          await setDoc(doc(db, path), {
            ...tier,
            benefits: currentBenefits
          });
          toast.success(`Đã thêm nhanh đặc quyền vào hạng ${tier.name}`);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
          toast.error("Không thể lưu cấu hình");
        }
      }
    } else {
      toast.error("Đặc quyền đã tồn tại ở hạng này!");
    }
  };

  const handleExportActivities = () => {
    try {
      const headers = ["ID", "Tên chiến dịch / Quy tắc", "Loại", "Điểm", "Ngày tạo", "Trạng thái"];
      const dataRows = [
        ...campaigns.map(c => [c.id, c.name, "Campaign", c.pointsMultiplier ? `${c.pointsMultiplier}x` : "N/A", c.createdAt, c.isActive ? "Active" : "Inactive"]),
        ...earnRules.map(e => [e.id, e.name, "Earn Rule", e.pointsAwarded.toString(), e.createdAt, e.isActive ? "Active" : "Inactive"]),
        ...rules.map(r => [r.id, r.name, "Redemption Rule", r.pointsRequired.toString(), "N/A", "Active"]),
      ];
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
        [
          headers.join(","),
          ...dataRows.map(row => row.map(r => `"${String(r).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `loyalty_activities_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Xuất dữ liệu CSV thành công!");
    } catch (e) {
      toast.error("Xuất CSV thất bại.");
    }
  };

  const tabs = [
    { id: "tiers", label: "Cấp bậc", icon: Star },
    { id: "points", label: "Điểm thưởng", icon: Award },
    { id: "redemption", label: "Ưu đãi", icon: Gem },
    { id: "gifts", label: "Quà tặng", icon: Gift },
  ];

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const activeTabInfo = tabs.find(t => t.id === activeTab);
  
  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-[#2f6cf5]/20 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-[#2f6cf5]/40"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-[#2f6cf5]/10 rounded-[10px] text-[#2f6cf5] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <motion.div
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              rotate: [0, 8, -8, 4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
            }}
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
              Cấp bậc và Đặc quyền
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình công thức tích điểm và quản lý kho quà tặng đặc quyền.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowDoc(!showDoc)}
          className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all shadow-sm flex items-center shrink-0 cursor-pointer border ${
            showDoc 
              ? "bg-[#2f6cf5]/20 border-[#2f6cf5]/40 text-[#2f6cf5]" 
              : "bg-background border-border hover:bg-muted text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" /> 
          Tài liệu {activeTabInfo?.label}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 bg-muted/10">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      <div className="px-4 md:px-0 pt-6 pb-6 space-y-6">
        <div className="flex gap-1 p-1 bg-muted/40 rounded-[10px] w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-[10px] text-sm font-bold transition-all gap-2",
                  activeTab === tab.id
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-20">
        <AnimatePresence>
          {showDoc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-sky-500/5 dark:bg-sky-950/10 border border-sky-500/10 dark:border-sky-900/30 rounded-[10px] p-6 mb-8 space-y-6 overflow-hidden shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 rounded-[10px] text-sky-600 dark:text-sky-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-sky-950 dark:text-sky-300">
                      Tài Liệu Hướng Dẫn Cấu Hình Hệ Thống Loyalty & Ưu Đãi
                    </h3>
                    <p className="text-xs text-sky-700/70 dark:text-sky-400/70 mt-0.5">
                      Hệ thống tự động theo dõi, tính toán và đồng bộ dựa trên các quy tắc thực tế bên dưới.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDoc(false)}
                  className="p-1.5 hover:bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-[10px] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 animate-none" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {/* CẤU HÌNH PHÂN HẠNG VIP */}
                <div className="bg-white/70 dark:bg-slate-900/40 p-5 rounded-[10px] border border-sky-100/30 dark:border-sky-930/10 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      1. Cấp bậc Hội viên (Tiers)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Cấp bậc khách hàng được nâng hạng dựa trên tích lũy chi tiêu đạt ngưỡng yêu cầu. Hạng càng cao hệ số nhân điểm (Multiplier) càng lớn:
                    </p>
                  </div>
                  <div className="space-y-2 flex-1">
                    {tiers && tiers.length > 0 ? (
                      tiers.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-[10px] border border-border/10 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color || "#94a3b8" }} />
                            <span className="font-bold text-foreground">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Ngưỡng: <strong className="text-foreground">{t.threshold.toLocaleString()} pts</strong></span>
                            <span className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              x{t.multiplier || 1.0}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Chưa tải được thông tin cấp bậc.</p>
                    )}
                  </div>
                </div>

                {/* QUY TẮC TÍCH LŨY ĐIỂM */}
                <div className="bg-white/70 dark:bg-slate-900/40 p-5 rounded-[10px] border border-sky-100/30 dark:border-sky-930/10 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-sky-500 fill-sky-500" />
                      2. Tích lũy Điểm thưởng (Earn Rules)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Điểm thực cộng = Điểm quy định x Hệ số Multiplier hạng thành viên. Danh sách quy tắc tích lũy:
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar flex-1">
                    {earnRules && earnRules.length > 0 ? (
                      earnRules.filter(r => r.isActive).map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-[10px] border border-border/10 text-xs gap-2">
                          <span className="font-semibold text-muted-foreground text-left truncate" title={r.name}>{r.name}</span>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold text-[10px] shrink-0">
                            +{r.points} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Chưa có quy tắc tích lũy nào hoạt động.</p>
                    )}
                  </div>
                </div>

                {/* QUY TẮC PHÂN KHÚC */}
                <div className="bg-white/70 dark:bg-slate-900/40 p-5 rounded-[10px] border border-sky-100/30 dark:border-sky-930/10 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-purple-500 fill-purple-500" />
                      3. Quy tắc Phân loại trạng thái (Status)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Phân lớp tệp & Gán nhãn CRM tự động khi khách hàng thỏa mãn các điều kiện quy luật đặc thù:
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar flex-1">
                    {segmentationRules && segmentationRules.length > 0 ? (
                      segmentationRules.filter(r => r.isActive).map((r) => {
                        const condType = r.criteriaType === 'total_spend' 
                          ? "Chi tiêu" 
                          : r.criteriaType === 'time_since_last_purchase' 
                            ? "Mất tương tác" 
                            : "Số dư điểm";
                        const condVal = r.criteriaType === 'total_spend' 
                          ? formatCurrency(r.value, currentCurrency) 
                          : r.criteriaType === 'time_since_last_purchase' 
                            ? `${r.value} ngày` 
                            : `${r.value} pts`;
                        const operatorStr = r.operator === 'gte' ? '≥' : r.operator === 'lte' ? '≤' : r.operator === 'gt' ? '>' : r.operator === 'lt' ? '<' : '=';

                        return (
                          <div key={r.id} className="p-2.5 bg-muted/20 rounded-[10px] border border-border/10 text-xs flex flex-col gap-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-[11px] truncate">{r.name}</span>
                              <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">
                                {r.tag}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Điều kiện: <strong className="text-foreground">{condType} {operatorStr} {condVal}</strong>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Chưa cấu hình quy tắc phân khúc tự động nào.</p>
                    )}
                  </div>
                </div>

                {/* ĐỔI QUÀ VÀ ƯU ĐÃI */}
                <div className="bg-white/70 dark:bg-slate-900/40 p-5 rounded-[10px] border border-sky-100/30 dark:border-sky-930/10 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-rose-500 fill-rose-500" />
                      4. Đổi quà & Đặc quyền (Redemption)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Khách sài điểm thưởng nhận các mã voucher chiết khấu hóa đơn, sản phẩm hoặc coupon:
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar flex-1">
                    {rules && rules.length > 0 ? (
                      rules.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-[10px] border border-border/10 text-xs gap-2">
                          <div className="flex flex-col text-left min-w-0 flex-1">
                            <span className="font-bold text-foreground truncate">{r.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              Trị giá: <strong className="text-foreground">{r.rewardType === 'discount' ? 'Bớt tiền' : r.rewardType === 'voucher' ? 'Voucher' : 'Quà tặng'} {r.rewardValue ? r.rewardValue.toLocaleString() : ''}</strong>
                            </span>
                          </div>
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-extrabold text-[10px] shrink-0">
                            {r.pointsRequired} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Chưa tải được quy tắc đổi quà & ưu đãi.</p>
                    )}
                  </div>
                </div>

                {/* ĐẶC QUYỀN VIP */}
                <div className="bg-white/70 dark:bg-slate-900/40 p-5 rounded-[10px] border border-sky-100/30 dark:border-sky-930/10 space-y-4 flex flex-col justify-between lg:col-span-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-300" />
                      5. Đặc quyền phân hạng VIP (VIP Privileges)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Các dịch vụ đặc quyền cao cấp được cá nhân hóa chặt chẽ theo lớp tầng hội viên thực thụ:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    {tiers && tiers.length > 0 ? (
                      tiers.slice(0, 4).map((t) => {
                        const tierBenefits = t.benefits && t.benefits.length > 0
                          ? t.benefits
                          : getFallbackBenefits(t.name);
                        return (
                          <div key={t.id} className="p-3 bg-muted/20 rounded-[10px] border border-border/10 text-left space-y-2 flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-border/5 pb-1.5 mb-1 shrink-0">
                              <span className="font-bold text-xs uppercase tracking-wide" style={{ color: t.color || "#1e293b" }}>
                                {t.name}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground">
                                ({tierBenefits.length} đặc quyền)
                              </span>
                            </div>
                            <div className="space-y-1 flex-1 overflow-y-auto max-h-[90px] custom-scrollbar">
                              {tierBenefits.slice(0, 3).map((b, idx) => (
                                <div key={idx} className="flex justify-between items-start text-[10px] gap-2">
                                  <span className="text-muted-foreground truncate" title={b.name}>• {b.name}</span>
                                  <span className="text-foreground shrink-0 font-semibold">{b.value}</span>
                                </div>
                              ))}
                              {tierBenefits.length > 3 && (
                                <div className="text-[9px] text-[#2f6cf5] italic font-medium pt-1">+ {tierBenefits.length - 3} đặc quyền khác</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic col-span-2">Chưa cấu hình đặc quyền VIP nào.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-sky-500/10 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground leading-relaxed text-left">
                <p>📌 <strong>Thực tế áp dụng:</strong> Khi một khách hàng sở hữu hạng <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">Essential (Multiplier x1.25)</span> thực hiện bài Khảo sát sự hài lòng (+30 điểm cơ bản), hệ thống thông tri & cộng điểm thực tế là: <span className="font-extrabold text-foreground">30 x 1.25 = 37.5 điểm</span>.</p>
                <p>💡 <em>Tips:</em> Toàn bộ tài liệu được đọc đồng bộ từ cấu hình hệ thống thực tế khách hàng, bất kỳ chỉnh sửa nào sẽ lập tức phản ánh tại đây.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {activeTab === "tiers" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TierManagementView 
                  rules={rules} 
                  gifts={gifts} 
                  searchTerm={tierSearchTerm}
                />
                
                <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-6 shadow-sm">
                   <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between px-1">
                      <div className="text-left">
                        <h5 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest">
                          So sánh đặc quyền hội viên
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Bảng trực quan hóa sự khác biệt giữa các phân hạng
                        </p>
                      </div>
                    </div>
                  <TierComparisonTable tiers={tiers} />
                </div>
              </div>
            )}

            {activeTab === "points" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PointsManagementView 
                  onEditRule={(rule) => {
                    setSelectedEarnRule(rule);
                    setShowEarnDialog(true);
                  }}
                  onAddRule={() => {
                      setSelectedEarnRule(undefined);
                      setShowEarnDialog(true);
                  }}
                />
              </div>
            )}

            {activeTab === "redemption" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <PointRedemptionConfigView onAddRule={() => setShowRuleDialog(true)} />
              </div>
            )}

            {activeTab === "gifts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <GiftsManagementView />
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

      {showCreatePrivilegeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-card border border-border rounded-[10px] shadow-2xl p-6 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold font-heading">
                  Tạo đặc quyền phân hạng VIP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreatePrivilegeDialog(false);
                  setPrivilegeName("");
                  setPrivilegeValue("");
                  setSelectedTiersForPrivilege([]);
                }}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-[10px] transition-all font-bold cursor-pointer text-sm"
              >
                Hủy
              </button>
            </div>

            <form onSubmit={handleCreatePrivilege} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Tên đặc quyền <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={privilegeName}
                  onChange={(e) => setPrivilegeName(e.target.value)}
                  placeholder="v.d. Miễn phí gói vệ sinh trang sức cao cấp bọc Platinum"
                  className="w-full bg-muted/40 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-[10px] px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Mô tả định mức / Giá trị
                </label>
                <input
                  type="text"
                  value={privilegeValue}
                  onChange={(e) => setPrivilegeValue(e.target.value)}
                  placeholder="v.d. Áp dụng trọn đời hoặc Định kỳ 6 tháng/lần"
                  className="w-full bg-muted/40 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-[10px] px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                  Chọn phân hạng áp dụng <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {tiers.map((tier) => {
                    const isChecked = selectedTiersForPrivilege.includes(tier.id);
                    return (
                      <label
                        key={tier.id}
                        style={{
                          borderColor: isChecked ? tier.color : undefined,
                          backgroundColor: isChecked ? `${tier.color}08` : undefined
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 border border-border/80 rounded-[10px] cursor-pointer hover:bg-muted/40 transition-all select-none"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTiersForPrivilege(prev => [...prev, tier.id]);
                            } else {
                              setSelectedTiersForPrivilege(prev => prev.filter(id => id !== tier.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span
                            className="text-xs font-extrabold uppercase tracking-wide"
                            style={{ color: tier.color }}
                          >
                            {tier.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {tier.threshold.toLocaleString()} pts
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePrivilegeDialog(false);
                    setPrivilegeName("");
                    setPrivilegeValue("");
                    setSelectedTiersForPrivilege([]);
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-[10px] text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  Kích hoạt đặc quyền
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Global Multiplier CONFIG DIALOG */}
      {showGlobalMultiplierDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-[#ffffff] dark:bg-zinc-900 border border-border rounded-[10px] overflow-hidden shadow-2xl relative"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-base font-heading text-foreground">
                  Cấu hình Global Multiplier
                </h4>
              </div>
              <button
                onClick={() => setShowGlobalMultiplierDialog(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ số tích luỹ toàn cầu (Global Multiplier) nhân trực tiếp toàn bộ điểm tích luỹ khách hàng khi họ hoàn thành nhiệm vụ hoặc mua hàng trong thời gian chạy sự kiện.
              </p>

              <div className="p-4 bg-amber-500/5 rounded-[10px] border border-amber-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold text-foreground">Kích hoạt Promo Multiplier</span>
                    <p className="text-[10px] text-muted-foreground">Kích hoạt nhân điểm toàn hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGlobalMultiplierActive(!isGlobalMultiplierActive)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isGlobalMultiplierActive ? "bg-amber-500" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#ffffff] shadow-lg ring-0 transition duration-200 ease-in-out",
                        isGlobalMultiplierActive ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
                  Hệ số nhân điểm thưởng (Multiplier Value)
                </label>
                <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-[10px] border border-border">
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={globalMultiplier}
                    onChange={(e) => setGlobalMultiplier(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                    disabled={!isGlobalMultiplierActive}
                  />
                  <span className="text-base font-mono font-black text-amber-500 w-12 text-center">
                    x{globalMultiplier.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
                  Tên sự kiện / Lý do nhân điểm
                </label>
                <input
                  type="text"
                  value={globalMultiplierReason}
                  onChange={(e) => setGlobalMultiplierReason(e.target.value)}
                  className="w-full bg-muted/40 border border-border p-3 rounded-[10px] font-bold text-xs outline-none focus:border-amber-500 text-foreground"
                  placeholder="Ví dụ: Sự kiện Tri ân Hè Seva Glow"
                  disabled={!isGlobalMultiplierActive}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowGlobalMultiplierDialog(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-[10px] text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("crm_global_multiplier", globalMultiplier.toString());
                    localStorage.setItem("crm_global_multiplier_reason", globalMultiplierReason);
                    localStorage.setItem("crm_global_multiplier_active", isGlobalMultiplierActive.toString());
                    setShowGlobalMultiplierDialog(false);
                    toast.success("Cấu hình Global Multiplier được áp dụng thành công!");
                  }}
                  className="px-5 py-2 bg-[#2f6cf5] text-[#ffffff] hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
