import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Star,
  Gift,
  ChevronRight,
  Zap,
  Trophy,
  Scissors,
  Calendar,
  Camera,
  Share2,
  Gem,
  TrendingUp,
  Tag,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Heart,
  Trash2,
  Crown,
  Award,
  Shield,
  PlusCircle,
  Download,
  X,
  Coins,
  Settings2,
} from "lucide-react";
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
} from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
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
import { LoyaltyTiers } from "@/components/loyalty/LoyaltyTiers";
import { GamificationProgress } from "@/components/loyalty/GamificationProgress";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getGuestTiers,
  saveGuestTier,
  getGuestRedemptionRules,
  getGuestEarnRules,
  getGuestCampaigns,
  getGuestSegmentationRules,
  getGuestCustomers,
  saveGuestSegmentationRule,
  saveGuestCustomer,
} from "@/data/guestData";

type TabType = "tiers" | "segmentation" | "engagement" | "automation" | "vip";

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

export function LoyaltyView() {
  const { user, loading: authLoading, signIn } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabType>("tiers");
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [earnRules, setEarnRules] = useState<EarnRule[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [segmentationRules, setSegmentationRules] = useState<
    SegmentationRule[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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
    { id: "tiers", label: "Hạng & Tích điểm", icon: Star },
    { id: "segmentation", label: "Quy tắc Phân khúc", icon: Tag },
    { id: "engagement", label: "Tương tác & AI", icon: Scissors },
    { id: "automation", label: "Chiến dịch Tự động", icon: Zap },
    { id: "vip", label: "Đặc quyền VIP", icon: Gem },
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
                  rotate: [0, 15, -15, 10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5.5,
                  ease: "easeInOut",
                }}
              >
                <Trophy className="w-8 h-8 text-amber-500" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
                Chương trình Ưu đãi
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Xây dựng trọn vẹn đặc quyền và trải nghiệm VIP cho khách hàng.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-muted/40 rounded-xl border border-border/50">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-[#2f6cf5] font-extrabold leading-none mb-1">
                  Retention
                </p>
                <p className="text-lg font-extrabold text-foreground">84%</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-[#2f6cf5] font-extrabold leading-none mb-1">
                  Referrals
                </p>
                <p className="text-lg font-extrabold text-foreground">124</p>
              </div>
            </div>
            <button
              onClick={handleExportActivities}
              className="px-5 py-2.5 bg-sidebar border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all shadow-sm flex items-center shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" /> Xuất CSV
            </button>
            <button
              onClick={() => {
                setSelectedEarnRule(undefined);
                setShowEarnDialog(true);
              }}
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
            {activeTab === "tiers" && (
              <>
                {/* 30 Days Activity Chart */}
                <Card className="p-6 border border-border/60 shadow-sm glass-card mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-heading flex items-center">
                      <TrendingUp className="w-5 h-5 mr-3 text-primary" /> Phân bổ Điểm thưởng (30 Ngày)
                    </h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { day: "01/05", earn: 120, burn: 40 },
                          { day: "05/05", earn: 210, burn: 80 },
                          { day: "10/05", earn: 300, burn: 150 },
                          { day: "15/05", earn: 450, burn: 190 },
                          { day: "20/05", earn: 200, burn: 110 },
                          { day: "25/05", earn: 340, burn: 200 },
                          { day: "30/05", earn: 500, burn: 290 },
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="earn" name="Tích lũy" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="burn" name="Đổi điểm" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <GamificationProgress currentPoints={1420} nextTierPoints={2500} currentTier="Essential" nextTier="Icon" />
                <LoyaltyTiers tiers={tiers} />

                {/* MÔ PHỎNG CẤU TRÚC PHÂN HẠNG (Đã được chuyển qua Phân tích) */}

                <div className="space-y-4 pt-4 border-t border-border/40 mt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-heading flex items-center">
                      <Gift className="w-5 h-5 mr-3 text-primary" /> Đổi thưởng
                      & Ưu đãi
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedRule(undefined);
                        setShowRuleDialog(true);
                      }}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tạo phần quà
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {rules.map((rule) => (
                      <motion.div
                        key={rule.id}
                        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      >
                        <Card
                          onClick={() => {
                            setSelectedRule(rule);
                            setShowRuleDialog(true);
                          }}
                          className="flex items-center p-4 gap-4 glass-card hover:shadow-md transition-all cursor-pointer group h-full"
                        >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Gift className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm leading-tight">
                            {rule.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Yêu cầu {rule.pointsRequired.toLocaleString()} pts
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </Card>
                    </motion.div>
                  ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "segmentation" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-sidebar/50 border border-border/80 rounded-3xl backdrop-blur-md">
                  <div>
                    <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" /> Quy tắc Phân khúc
                      tự động
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Thiết lập tiêu chí để gán nhãn CRM tự động khi khách hàng
                      thỏa mãn tổng doanh thu chi tiêu hoặc ngày không mua sắm.
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
                      disabled={
                        syncing ||
                        customers.length === 0 ||
                        segmentationRules.length === 0
                      }
                      className="px-4 py-2 bg-primary disabled:opacity-50 text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />{" "}
                      {syncing
                        ? "Đang đồng bộ..."
                        : "Chạy phân khúc & Gán nhãn"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSegRule(undefined);
                        setShowSegDialog(true);
                      }}
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
                      <h4 className="font-bold text-base">
                        Chưa có quy tắc phân khúc tự động
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Tạo quy tắc mới hoặc bắt đầu nhanh bằng bộ quy tắc phân
                        khúc chuẩn (Big Spender, Inactive, Churn Risk, VIP) của
                        chúng tôi.
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
                          const matchedPreset =
                            COLOR_PRESET_MAP[rule.color || "gold"] ||
                            COLOR_PRESET_MAP.gold;
                          const matchedCount = customers.filter((c) =>
                            evaluateCustomerSegment(c, rule),
                          ).length;
                          const isSelected = selectedSegId === rule.id;

                          return (
                            <Card
                              key={rule.id}
                              onClick={() => setSelectedSegId(rule.id)}
                              className={cn(
                                "p-5 relative overflow-hidden transition-all duration-300 border bg-sidebar/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col justify-between",
                                matchedPreset.badge,
                                isSelected
                                  ? "ring-2 ring-primary border-transparent bg-sidebar-accent/40"
                                  : "border-border/50",
                                !rule.isActive && "opacity-60",
                              )}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5 animate-fade-in">
                                    <span
                                      className={cn(
                                        "inline-block px-2.5 py-0.5 text-xs font-black uppercase tracking-wide rounded-full border mb-1.5",
                                        matchedPreset.badge,
                                      )}
                                    >
                                      {rule.tag}
                                    </span>
                                    <h4 className="font-extrabold text-sm tracking-tight leading-tight text-foreground">
                                      {rule.name}
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSegRule(rule);
                                      setShowSegDialog(true);
                                    }}
                                    className="p-1 px-2.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-all cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                </div>

                                <div className="space-y-1 pt-1.5 text-xs text-muted-foreground border-t border-border/40">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">Chỉ số:</span>
                                    <span>
                                      {rule.criteriaType === "total_spend"
                                        ? "Tổng chi tiêu"
                                        : rule.criteriaType ===
                                            "time_since_last_purchase"
                                          ? "Số ngày không giao dịch"
                                          : "Điểm tích lũy"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">Nhóm lọc:</span>
                                    <span className="text-foreground font-semibold">
                                      {rule.operator === "gte"
                                        ? ">= "
                                        : rule.operator === "gt"
                                          ? "> "
                                          : rule.operator === "eq"
                                            ? "= "
                                            : rule.operator === "lte"
                                              ? "<= "
                                              : "< "}
                                      {rule.criteriaType === "total_spend"
                                        ? `${rule.value.toLocaleString("vi-VN")} ₫`
                                        : rule.criteriaType ===
                                            "time_since_last_purchase"
                                          ? `${rule.value} ngày`
                                          : `${rule.value} pts`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">
                                  Khách hàng đạt yêu cầu:
                                </span>
                                <span className="text-xs font-bold font-heading bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                  {matchedCount} KH (
                                  {customers.length > 0
                                    ? Math.round(
                                        (matchedCount / customers.length) * 100,
                                      )
                                    : 0}
                                  %)
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right column: matched customers inspection panel */}
                    <div className="lg:col-span-1">
                      {selectedSegId ? (
                        (() => {
                          const activeRule = segmentationRules.find(
                            (r) => r.id === selectedSegId,
                          );
                          if (!activeRule) return null;
                          const matchedCustomers = customers.filter((c) =>
                            evaluateCustomerSegment(c, activeRule),
                          );
                          const colorMeta =
                            COLOR_PRESET_MAP[activeRule.color || "gold"] ||
                            COLOR_PRESET_MAP.gold;

                          return (
                            <Card className="p-6 border border-border/50 bg-sidebar/40 backdrop-blur-md flex flex-col h-full rounded-2xl">
                              <div className="border-b pb-4 mb-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs uppercase font-bold tracking-widest text-[#2f6cf5]">
                                    Trình kiểm tra tệp
                                  </span>
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 text-xs font-bold rounded shadow-2xs border",
                                      colorMeta.badge,
                                    )}
                                  >
                                    {activeRule.tag}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground truncate">
                                  {activeRule.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Tìm thấy {matchedCustomers.length} khách hàng
                                  thỏa quy chuẩn.
                                </p>
                              </div>

                              <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-1">
                                {matchedCustomers.length === 0 ? (
                                  <div className="text-center py-10 text-muted-foreground space-y-2">
                                    <AlertCircle className="w-8 h-8 mx-auto opacity-40 text-rose-500 animate-pulse" />
                                    <p className="text-xs font-medium">
                                      Chưa có khách hàng nào khớp tiêu chí lọc
                                      này hiện hữu.
                                    </p>
                                  </div>
                                ) : (
                                  matchedCustomers.map((cust) => {
                                    const spendValue =
                                      cust.customFields?.spend ??
                                      cust.customFields?.totalSpend ??
                                      cust.customFields?.total_spend ??
                                      (cust as any).spend ??
                                      (cust.points ? cust.points * 50000 : 0);

                                    const lastDate =
                                      cust.lastTransactionAt?.toDate?.() ||
                                      (cust.lastTransactionAt
                                        ? new Date(cust.lastTransactionAt)
                                        : null) ||
                                      cust.createdAt?.toDate?.() ||
                                      (cust.createdAt
                                        ? new Date(cust.createdAt)
                                        : null);

                                    return (
                                      <div
                                        key={cust.id}
                                        className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center gap-3 hover:bg-muted/45 transition-all"
                                      >
                                        {cust.avatarUrl ? (
                                          <img
                                            src={cust.avatarUrl}
                                            className="w-8 h-8 rounded-lg border border-border/20 shadow-xs object-cover"
                                            alt=""
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-lg border border-border/20 shadow-xs bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                            {cust.name.slice(0, 2)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-xs font-bold text-foreground truncate">
                                            {cust.name}
                                          </h5>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span>
                                              💰{" "}
                                              {Number(
                                                spendValue,
                                              ).toLocaleString("vi-VN")}{" "}
                                              đ
                                            </span>
                                            <span className="text-muted-foreground/30">
                                              •
                                            </span>
                                            <span>
                                              📅{" "}
                                              {lastDate
                                                ? lastDate.toLocaleDateString(
                                                    "vi-VN",
                                                  )
                                                : "Mới"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </Card>
                          );
                        })()
                      ) : (
                        <Card className="p-8 border border-border/50 bg-sidebar/30 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
                          <Tag className="w-10 h-10 text-muted-foreground/50 animate-bounce mb-3" />
                          <h5 className="font-bold text-sm text-foreground">
                            Trình kiểm tra trực quan
                          </h5>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                            Nhấp chọn bất kỳ thẻ Quy tắc Phân khúc bên trái để
                            soi chi tiết tệp khách hàng thỏa mãn ngay lập tức.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "engagement" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hàng trên cùng: Hai thẻ Trợ lý AI Stylist & Trình mô phỏng tích điểm side-by-side */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent p-6 shadow-xl rounded-3xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2 font-heading text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> Trợ lý AI Stylist Cá nhân hoá (Demo)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-left">
                        Hệ thống tự động học lịch sử mua sắm và sở thích để cá nhân hoá đề xuất đặc quyền riêng biệt.
                      </p>

                      <div className="space-y-4 p-4.5 bg-background/50 rounded-2xl border border-border/60">
                        {/* Customer Select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">Chọn Hội viên Phân tích</label>
                          <select
                            value={selectedSimCustomer}
                            onChange={(e) => {
                              setSelectedSimCustomer(e.target.value);
                              setAiResult(null); // Reset analysis
                            }}
                            className="w-full bg-background border border-border/80 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500/50 text-foreground font-semibold"
                          >
                            <option value="Nguyễn Thảo Chi">Nguyễn Thảo Chi (Atelier)</option>
                            <option value="Trần Thế Phong">Trần Thế Phong (Icon)</option>
                            <option value="Phan Ánh Dương">Phan Ánh Dương (Essential)</option>
                            <option value="Hoàng Minh Tuấn">Hoàng Minh Tuấn (Member)</option>
                          </select>
                        </div>

                        {/* AI Mode Focus */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">Chủ đề phân tích trợ lý AI</label>
                          <select
                            value={aiFocusKeyword}
                            onChange={(e) => {
                              setAiFocusKeyword(e.target.value);
                              setAiResult(null); // Reset analysis
                            }}
                            className="w-full bg-background border border-border/80 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500/50 text-foreground font-semibold"
                          >
                            <option value="gemstone">Tư vấn Đá quý Bản mệnh Phong thủy</option>
                            <option value="gift">Đề xuất Quà tặng Sinh nhật Cá nhân hóa</option>
                            <option value="collection">BST Trang sức dạ tiệc & Private VIP Event</option>
                          </select>
                        </div>

                        {/* Generate button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsGeneratingAi(true);
                            setAiResult(null);
                            setTimeout(() => {
                              setIsGeneratingAi(false);
                              // Set custom mock result based on combination
                              let resData = {
                                profile: "Thượng lưu truyền thống, đặc biệt yêu quý vàng 24K và Ngọc Lục Bảo thiên nhiên.",
                                advice: "Quý khách có bản mệnh hợp mộc, ưu tiên hộ thân bằng Emerald thô thượng hạng được chế tác thủ công tinh tế.",
                                items: ["Vòng cổ Emerald HeartLock độc bản", "Nhẫn Emerald Atelier Gold 24K"],
                                offering: "Tặng ngay lượt tư vấn thiết kế 3D 1-1 cùng chuyên gia phong thủy và x2 điểm khi đặt lịch trực tuyến."
                              };

                              if (selectedSimCustomer === "Trần Thế Phong") {
                                resData = {
                                  profile: "Sành điệu đương đại, ưu chuộng Sapphire xanh Hoàng Gia và Titanium siêu nhẹ.",
                                  advice: "Lịch sử mua hàng thể hiện phong cách lịch lãm tối giản. Đề xuất sắc xanh quý tộc hợp mệnh Thủy, thu hút năng lượng tài lộc cát tường.",
                                  items: ["Mũi ghim cài áo Royal Sapphire", "Nhẫn cưới Sapphire Ice Icon 18K"],
                                  offering: "Ưu tiên đặt trước BST mới và trải nghiệm tiếp đón tại phòng chọn VIP Private Lounge."
                                };
                              } else if (selectedSimCustomer === "Phan Ánh Dương") {
                                resData = {
                                  profile: "Trẻ trung thanh lịch, ưa thích Kim cương thiên nhiên trơn kết rập đơn giản.",
                                  advice: "Phong cách tối giản, hướng đến thiết kế trang nhã dùng hàng ngày. Đề xuất Kim cương nước D tinh khiết bảo trợ bình an và rạng ngời tươi mới.",
                                  items: ["Bông tai Diamond Essential Studs", "Vòng tay Pearl White Diamond 14K"],
                                  offering: "Tặng voucher làm sạch spa trang sức trọn đời và giao hàng hỏa tốc bảo an tận tay."
                                };
                              } else if (selectedSimCustomer === "Hoàng Minh Tuấn") {
                                resData = {
                                  profile: "Hiện đại năng động, bắt đầu tiếp cận trang sức phong thủy cơ bản.",
                                  advice: "Ưa chuộng phụ kiện bạc S925 phủ bạch kim tinh tế. Thích hợp với các vòng chuỗi hộ mệnh Ngọc bích Thủy thảo hoặc Đá beryl.",
                                  items: ["Vòng tay may mắn Jade Beryl", "Mặt dây chuyền bạc phong thuỷ Seva Luck"],
                                  offering: "Học thiết kế trang sức thủ công với 300 điểm tích lũy và tích điểm 1% hóa đơn."
                                };
                              }

                              if (aiFocusKeyword === "gift") {
                                resData.advice = "Gợi ý Quà Sắp Sinh Nhật: " + resData.advice.replace("Đề xuất", "Chúc mừng tuổi mới rực rỡ, đề xuất");
                              } else if (aiFocusKeyword === "collection") {
                                resData.advice = "Gợi ý BST Private: " + resData.advice.concat(" Rất phù hợp cùng bộ phục trang dạo tiệc cao cấp.");
                              }

                              setAiResult(resData);
                              toast.success("AI đã xuất đề xuất ưu đãi cá nhân hóa!");
                            }, 1200);
                          }}
                          disabled={isGeneratingAi}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                        >
                          {isGeneratingAi ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>AI đang phân tích Style...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Phân tích ưu đãi bằng AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Output Analysis */}
                    {aiResult && (
                      <div className="mt-4 p-4.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 text-left animate-in fade-in slide-in-from-top-3 duration-250">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4f46e5] block mb-2">Kết quả phân tích từ AI Stylist:</span>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Hồ sơ Phong thái:</span>
                            <p className="text-xs text-foreground mt-0.5 leading-relaxed font-semibold">{aiResult.profile}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Khuyến nghị Trị liệu & Stylist:</span>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed font-semibold italic font-serif">"{aiResult.advice}"</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Mỹ nghệ đề cử (Matching Items):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {aiResult.items.map((it: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-[10px] border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 py-0.5 px-2 rounded-lg font-bold">
                                  {it}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2.5 border-t border-indigo-500/20">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Hợp đồng Ưu đãi Tự động (Suggested Offer):</span>
                            <p className="text-xs text-[#8b5cf6] mt-0.5 leading-relaxed font-extrabold uppercase">{aiResult.offering}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Trình mô phỏng tích lũy Engagement */}
                  <Card className="border-none bg-[#f8fafc] dark:bg-slate-900/40 p-6 shadow-xl rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2 font-heading text-amber-600 dark:text-amber-400">
                        <Coins className="w-5 h-5 text-amber-500" /> Trình mô phỏng tích điểm (Engagement)
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-left">
                        Chọn một hội viên Seva Club và một nhiệm vụ tương tác để kiểm tra thực tế tỷ lệ nhân điểm tự động.
                      </p>

                      <div className="space-y-4 p-4.5 bg-background border border-border/80 rounded-2xl shadow-sm">
                        {/* 1. Select Customer to Earn */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">Chọn Hội viên Thử nghiệm</label>
                          <select
                            value={simulatedEarnPointsCustomer}
                            onChange={(e) => {
                              setSimulatedEarnPointsCustomer(e.target.value);
                              setEngagementSimLogs([]); // Clear logs on switch
                            }}
                            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-foreground font-bold"
                          >
                            {(customers.length > 0 ? customers : [
                              { id: "cust_1", name: "Nguyễn Thảo Chi", tier: "Atelier", points: 12500 },
                              { id: "cust_2", name: "Trần Thế Phong", tier: "Icon", points: 3400 },
                              { id: "cust_3", name: "Phan Ánh Dương", tier: "Essential", points: 1420 },
                              { id: "cust_4", name: "Hoàng Minh Tuấn", tier: "Member", points: 150 },
                            ]).map((cust) => (
                              <option key={cust.id} value={cust.id}>
                                {cust.name} ({cust.tier || "Member"} - {cust.points || 0} pts)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Select Engagement Earn Rule */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">Chọn Nhiệm vụ / Tương tác</label>
                          <select
                            value={simulatedEarnPointsRule}
                            onChange={(e) => {
                              setSimulatedEarnPointsRule(e.target.value);
                              setEngagementSimLogs([]);
                            }}
                            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs outline-none focus:border-amber-500 text-foreground font-semibold"
                          >
                            {earnRules.map((rule) => (
                              <option key={rule.id} value={rule.id}>
                                {rule.name} (+{rule.points || 0} pts)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Live Calculation Calculation Box */}
                        {(() => {
                          const mockCusts = [
                            { id: "cust_1", name: "Nguyễn Thảo Chi", tier: "Atelier", points: 12500 },
                            { id: "cust_2", name: "Trần Thế Phong", tier: "Icon", points: 3400 },
                            { id: "cust_3", name: "Phan Ánh Dương", tier: "Essential", points: 1420 },
                            { id: "cust_4", name: "Hoàng Minh Tuấn", tier: "Member", points: 150 },
                          ];
                          const activeCustomersList = customers.length > 0 ? customers : mockCusts;
                          const currentSimCust = activeCustomersList.find(c => c.id === simulatedEarnPointsCustomer) || activeCustomersList[0];
                          const currentSimRule = earnRules.find(r => r.id === simulatedEarnPointsRule) || earnRules[0];
                          
                          if (!currentSimCust || !currentSimRule) return null;

                          const getTierMultiplier = (tierName?: string) => {
                            if (!tierName) return 1.0;
                            const lower = tierName.toLowerCase();
                            if (lower.includes("atelier")) return 2.0;
                            if (lower.includes("icon")) return 1.5;
                            if (lower.includes("essential")) return 1.25;
                            return 1.0;
                          };
                          
                          const tierMut = getTierMultiplier(currentSimCust.tier);
                          const activeGlobalMult = isGlobalMultiplierActive ? globalMultiplier : 1.0;
                          const totalAwarded = Math.round((currentSimRule.points || 0) * tierMut * activeGlobalMult);

                          return (
                            <div className="mt-2 space-y-2 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-left">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 block">Duyệt trước phép tính tích luỹ (Live Math)</span>
                              <div className="space-y-1.5 font-sans">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                  <span>Điểm cơ bản (Base Pts)</span>
                                  <span className="font-bold text-foreground">+{currentSimRule.points || 0} pts</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                  <span>Ưu đãi phân hạng VIP ({currentSimCust.tier || "Member"})</span>
                                  <span className="font-bold text-[#10b981]">x{tierMut.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-[#b45309]">
                                  <span>Global Multiplier {isGlobalMultiplierActive ? `(${globalMultiplierReason})` : "(Chưa áp dụng)"}</span>
                                  <span className="font-extrabold text-amber-600">x{activeGlobalMult.toFixed(1)}</span>
                                </div>
                                <div className="h-px bg-amber-500/10 my-1" />
                                <div className="flex justify-between items-baseline">
                                  <span className="text-xs font-black text-foreground">TỔNG ĐIỂM SẼ NHẬN</span>
                                  <span className="text-lg font-black font-mono text-amber-500">
                                    +{totalAwarded} pts
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isSimulatingEngagement}
                                onClick={() => startEngagementSimulation(currentSimCust, currentSimRule, tierMut, activeGlobalMult, totalAwarded)}
                                className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
                              >
                                {isSimulatingEngagement ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Đang đồng bộ giao dịch...</span>
                                  </>
                                ) : (
                                  <>
                                    <Coins className="w-3.5 h-3.5" />
                                    <span>Kích hoạt tích lũy thực tế</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Logs section */}
                        {engagementSimLogs.length > 0 && (
                          <div className="mt-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-left font-mono">
                            <span className="text-[8px] font-black uppercase tracking-wider text-amber-500 block mb-1.5">
                              Console Log Tích Điểm:
                            </span>
                            <div className="space-y-1 text-[10px] text-zinc-300 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
                              {engagementSimLogs.map((log, index) => {
                                const isSuccess = log.includes("[SUCCESS]");
                                const isUpgrade = log.includes("[VIP_UPGRADE]");
                                return (
                                  <p
                                    key={index}
                                    className={cn(
                                      "break-all animate-in fade-in slide-in-from-left-2 duration-150",
                                      isSuccess ? "text-emerald-400 font-extrabold" : "",
                                      isUpgrade ? "text-amber-400 font-black animate-bounce mt-1" : ""
                                    )}
                                  >
                                    {log}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Hàng dưới: Quy tắc tích lũy Engagement */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc] dark:bg-slate-900/30 p-4 rounded-2xl border border-border/40">
                    <div className="space-y-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold font-heading text-foreground">
                          Quy tắc tích lũy Engagement
                        </h3>
                        {isGlobalMultiplierActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm shadow-amber-550/25 animate-pulse">
                            <Sparkles className="w-3 h-3 fill-white text-white" />
                            <span>nhân {globalMultiplier.toFixed(1)}x toàn bộ</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isGlobalMultiplierActive 
                          ? `Đang chạy: ${globalMultiplierReason}` 
                          : "Hệ thống tích lũy tương tác tự động"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGlobalMultiplierDialog(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-200"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Cấu hình Global Multiplier</span>
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {earnRules.map((er) => (
                      <motion.div
                        key={er.id}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      >
                        <Card
                          onClick={() => {
                            setSelectedEarnRule(er);
                            setShowEarnDialog(true);
                          }}
                          className={cn(
                            "flex items-center p-5 gap-5 border border-border/50 hover:border-primary transition-all cursor-pointer group h-full transition-shadow hover:shadow-md",
                            !er.isActive && "opacity-60 bg-muted/20",
                          )}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                            {er.type === "review" || er.type === "review_google" || er.type === "testimonial" ? (
                              <Star className="text-yellow-500" />
                            ) : er.type === "referral" || er.type === "referral_purchase" ? (
                              <Share2 className="text-blue-500" />
                            ) : er.type === "ai_styling" ? (
                              <Scissors className="text-indigo-500" />
                            ) : er.type === "checkin" ? (
                              <Camera className="text-purple-500" />
                            ) : er.type === "signup" ? (
                              <Star className="text-emerald-500" />
                            ) : er.type === "anniversary" || er.type === "birthday" ? (
                              <Gift className="text-rose-500" />
                            ) : er.type === "purchase" || er.type === "purchase_quantity" || er.type === "purchase_value" || er.type === "beat_best" ? (
                              <Trophy className="text-amber-500" />
                            ) : er.type === "social_share" || er.type === "social_follow" || er.type === "youtube_sub" ? (
                              <Heart className="text-pink-500" />
                            ) : (
                              <TrendingUp className="text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base truncate">
                                {er.name}
                              </h4>
                              {!er.isActive && (
                                <Badge
                                  variant="outline"
                                  className="text-xs uppercase"
                                >
                                  Vô hiệu
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tặng +{er.points.toLocaleString()} pts khi hoàn thành
                            </p>
                          </div>
                          <div className="p-2 border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "automation" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" /> Chiến dịch Tự động & Automation (Demo)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kịch bản giữ chân tự động và theo dõi chuỗi sự kiện được khởi chạy thời gian thực.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 items-start">
                  {/* Left: Campaign Grid */}
                  <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                    {campaigns.map((camp) => (
                      <motion.div
                        key={camp.id}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="h-full"
                      >
                        <Card
                          className={cn(
                            "relative h-full border-none glass-card p-6 transition-all hover:shadow-xl flex flex-col justify-between group",
                            !camp.isActive && "opacity-60",
                          )}
                        >
                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {camp.type === "birthday" ? (
                                  <Gift className="h-5 w-5" />
                                ) : camp.type === "winback" ? (
                                  <Zap className="h-5 w-5 text-amber-500" />
                                ) : (
                                  <Calendar className="h-5 w-5" />
                                ) }
                              </div>
                              <Badge
                                variant={camp.isActive ? "default" : "outline"}
                                className="text-xs tracking-widest border-none"
                                style={camp.isActive ? { backgroundColor: "#10b981", color: "#fff" } : {}}
                              >
                                {camp.isActive ? "LIVE" : "STOPPED"}
                              </Badge>
                            </div>
                            <h4 className="mb-2 text-lg font-bold leading-none text-foreground">
                              {camp.name}
                            </h4>
                            <p className="mb-6 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                              {camp.description ||
                                "Ưu đãi tự động dành cho khách hàng."}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampaign(camp);
                                setShowCampaignDialog(true);
                              }}
                              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-all underline cursor-pointer"
                            >
                              Sửa cấu hình
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                runCampaignSimulation(camp.id, camp.name);
                              }}
                              disabled={isSimulatingCampaign !== null}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-[10px] tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>{isSimulatingCampaign === camp.id ? "Đơn chạy..." : "Chạy thử"}</span>
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Right: Simulation Logs console */}
                  <div className="lg:col-span-1">
                    <Card className="border border-border/80 bg-slate-950 text-slate-100 p-5 rounded-3xl font-mono shadow-xl relative overflow-hidden min-h-[360px] flex flex-col">
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      
                      <div className="pb-3 border-b border-slate-800 flex items-center gap-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-xs font-bold text-slate-400 font-mono ml-2">SYSTEM LOGS</span>
                      </div>

                      <div className="flex-1 space-y-2 text-left text-xs overflow-y-auto max-h-[260px] custom-scrollbar text-slate-300">
                        {simulationLogs.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                            <Zap className="w-8 h-8 opacity-25 mb-2 animate-bounce" />
                            <p className="text-[11px]">Chưa có chiến dịch nào được kích hoạt.</p>
                            <p className="text-[10px] mt-1 max-w-[180px] leading-relaxed font-sans">Nhấp chọn nút "Chạy thử" tại bất kì thẻ kịch bản bên trái để kiểm tra kịch bản tự động!</p>
                          </div>
                        ) : (
                          simulationLogs.map((log, index) => {
                            let typeColor = "text-slate-400";
                            if (log.includes("[SUCCESS]")) typeColor = "text-emerald-400 font-bold";
                            if (log.includes("[DETECTOR]") || log.includes("[INFO]")) typeColor = "text-indigo-400 font-bold";
                            if (log.includes("[SMS]") || log.includes("[ZALO_ZNS]")) typeColor = "text-amber-400 font-semibold";
                            if (log.includes("[MAIL]")) typeColor = "text-cyan-400";
                            if (log.includes("[POINTS]") || log.includes("[SYSTEM]")) typeColor = "text-purple-400 font-extrabold";
                            if (log.includes("[VIP_ENGAGEMENT]") || log.includes("[DISPATCH]")) typeColor = "text-pink-400 font-bold";
                            if (log.includes("[CRON]") || log.includes("[TRACKING]")) typeColor = "text-yellow-400 font-mono";
                            if (log.includes("[CRM]")) typeColor = "text-rose-400 font-semibold";
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn("leading-relaxed break-words", typeColor)}
                              >
                                <span className="text-slate-600 mr-1.5">&#62;</span>
                                {log}
                              </motion.div>
                            );
                          })
                        )}
                      </div>

                      {simulationLogs.length > 0 && (
                        <div className="pt-3 border-t border-slate-900 mt-auto flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Status: ACTIVE</span>
                          <button
                            onClick={() => setSimulationLogs([])}
                            className="text-slate-400 hover:text-slate-200 uppercase tracking-tight duration-150 underline cursor-pointer"
                          >
                            Xóa trắng logs
                          </button>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vip" && (
              <div className="space-y-8">
                {/* Visual Header card */}
                <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-r from-primary/10 via-[#2f6cf5]/5 to-transparent p-6 md:p-8 backdrop-blur-md">
                  <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                        <Gem className="w-4 h-4 animate-pulse" /> Chương trình thành viên tinh hoa
                      </div>
                      <h3 className="text-2xl font-bold font-heading text-foreground">
                        Cấu hình Đặc quyền VIP
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                        Thiết lập các đặc quyền chăm sóc đặc biệt riêng biệt cho 4 phân hạng khách hàng: <strong>Member, Essential, Icon, và Atelier</strong>. Trải nghiệm dịch vụ xa xỉ mang tính nhận diện thương hiệu cao cấp.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTiersForPrivilege(tiers.map(t => t.id)); // select all by default
                        setShowCreatePrivilegeDialog(true);
                      }}
                      className="px-5 py-3 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      Tạo đặc quyền phân hạng
                    </button>
                  </div>
                </div>

                {/* 4 tiers display grid */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {tiers.map((tier) => {
                    const mappedColor = tier.color || "#4f46e5";
                    const tierBenefits = tier.benefits && tier.benefits.length > 0
                      ? tier.benefits
                      : getFallbackBenefits(tier.name);

                    return (
                      <motion.div
                        key={tier.id}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="relative"
                      >
                        <Card className="h-full border border-border/80 bg-card overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-primary/20 transition-all rounded-3xl p-6">
                          <div className="space-y-4">
                            {/* Tier Header with styled banner */}
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge
                                  style={{
                                    backgroundColor: `${mappedColor}15`,
                                    color: mappedColor,
                                    borderColor: `${mappedColor}30`
                                  }}
                                  className="text-xs font-extrabold px-3 py-1 tracking-wider uppercase border"
                                >
                                  {tier.name}
                                </Badge>
                                <h4 className="text-sm text-muted-foreground font-medium mt-1">
                                  Hạn mức chi tiêu: từ {tier.threshold.toLocaleString()} pts
                                </h4>
                              </div>
                              <div
                                style={{ color: mappedColor }}
                                className="p-2 rounded-xl bg-muted/60"
                              >
                                {tier.name.toLowerCase() === 'atelier' ? (
                                  <Crown className="w-5 h-5" />
                                ) : tier.name.toLowerCase() === 'icon' ? (
                                  <Gem className="w-5 h-5" />
                                ) : tier.name.toLowerCase() === 'essential' ? (
                                  <Award className="w-5 h-5" />
                                ) : (
                                  <Shield className="w-5 h-5" />
                                )}
                              </div>
                            </div>

                            {/* Divider with tier accent color */}
                            <div
                              className="h-[2px] w-12 rounded-full"
                              style={{ backgroundColor: mappedColor }}
                            />

                            {/* Benefits List */}
                            <div className="space-y-2.5 pt-2">
                              {tierBenefits.map((benefit, idx) => (
                                <div
                                  key={idx}
                                  className="group/item flex items-start justify-between gap-3 p-2.5 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/30 transition-all"
                                >
                                  <div className="flex gap-2.5 items-start">
                                    <div
                                      style={{ color: mappedColor }}
                                      className="mt-1 shrink-0"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-foreground leading-tight">
                                        {benefit.name}
                                      </p>
                                      {benefit.value && (
                                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                          {benefit.value}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeletePrivilege(tier.id, idx)}
                                    className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all text-muted-foreground shrink-0 cursor-pointer"
                                    title="Xóa đặc quyền"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quick Add Inline form */}
                          <div className="mt-6 pt-4 border-t border-border/40">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const text = quickAddTexts[tier.id] || "";
                                if (text.trim()) {
                                  handleQuickAddPrivilege(tier.id, text, "Chi tiết VIP");
                                  setQuickAddTexts(prev => ({ ...prev, [tier.id]: "" }));
                                }
                              }}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={quickAddTexts[tier.id] || ""}
                                onChange={(e) => setQuickAddTexts(prev => ({ ...prev, [tier.id]: e.target.value }))}
                                placeholder="Thêm nhanh đặc quyền..."
                                className="flex-1 min-w-0 bg-muted/30 focus:bg-background border border-border/60 focus:border-primary/40 rounded-xl px-3 py-1.5 text-xs font-medium placeholder:text-muted-foreground/60 outline-none transition-all"
                              />
                              <button
                                type="submit"
                                className="p-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/20 text-primary rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="Thêm đặc quyền"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* DEMO ĐẶC QUYỀN VIP & BỘ TÍNH ĐIỂM HOÀN TIỀN TRANG SỨC */}
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-amber-500/[0.05] p-6 md:p-8 shadow-xl mt-4 text-left">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 pointer-events-none">
                    <Crown className="w-24 h-24 stroke-1" />
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> Giả lập đặc quyền & Tích luỹ thông minh (Bespoke Simulator)
                    </div>
                    <h3 className="text-xl font-bold text-foreground font-heading">
                      Trải nghiệm Đặc quyền VIP & Máy tính Điểm thưởng Seva Jewel
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                      Phân tích chiến lược khách hàng thân thiết bền vững dựa trên hành vi mua sắm ngành trang sức cao cấp. Đối soát giá trị giỏ hàng trung bình (AOV ~ 750.000đ) để phân hạng & nâng tầm trải nghiệm thượng lưu.
                    </p>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-12 items-start mt-6">
                    {/* LEFT PANEL: CONFIGURATOR AND POINT CONVERTER */}
                    <div className="lg:col-span-6 space-y-6">
                      <div className="bg-background border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase">
                            <Coins className="w-4 h-4 text-amber-500" /> Máy tính tích điểm Seva Club
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted hover:bg-muted/80 px-2.5 py-0.5 rounded-full uppercase">
                            Công thức: 10.000đ = 1đ
                          </span>
                        </div>

                        {/* Presets Grid */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                            Chọn giá trị giỏ hàng mẫu (Fast Presets)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: "Móng dạo phố (AOV)", value: 750000, desc: "Bạc S925 Phổ thông" },
                              { label: "Quà tặng sinh nhật", value: 1800000, desc: "Trang sức thiết yếu" },
                              { label: "Set Quý phái", value: 4500000, desc: "Vàng Ý / Đá phong thuỷ" },
                              { label: "Set Atelier VVIP", value: 12500000, desc: "Kiệt tác Kim Cương" }
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setSimAovValue(preset.value);
                                  // Auto set state based on spent value
                                  if (preset.value >= 8000000) {
                                    setSelectedSimTierId("tier-atelier");
                                  } else if (preset.value >= 3500000) {
                                    setSelectedSimTierId("tier-icon");
                                  } else if (preset.value >= 1500000) {
                                    setSelectedSimTierId("tier-essential");
                                  } else {
                                    setSelectedSimTierId("tier-member");
                                  }
                                }}
                                className={cn(
                                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer hover:border-amber-500/40 text-left flex flex-col justify-between active:scale-95",
                                  simAovValue === preset.value
                                    ? "bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-400 font-bold"
                                    : "bg-muted/30 border-border/60 hover:bg-muted/60"
                                )}
                              >
                                <span className="text-[9px] uppercase block truncate tracking-tight text-muted-foreground">{preset.label}</span>
                                <span className="text-xs mt-1 font-black leading-none block font-mono text-foreground">
                                  {preset.value.toLocaleString()}đ
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom value entry slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                              Giá trị đơn hàng tuỳ chỉnh (VND)
                            </label>
                            <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                              {simAovValue.toLocaleString()} VNĐ
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="100000"
                              max="20000000"
                              step="50000"
                              value={simAovValue}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSimAovValue(val);
                                // Auto set tier
                                if (val >= 8000000) {
                                  setSelectedSimTierId("tier-atelier");
                                } else if (val >= 3500000) {
                                  setSelectedSimTierId("tier-icon");
                                } else if (val >= 1500000) {
                                  setSelectedSimTierId("tier-essential");
                                } else {
                                  setSelectedSimTierId("tier-member");
                                }
                              }}
                              className="flex-1 accent-amber-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={simAovValue.toLocaleString("vi-VN")}
                              onChange={(e) => {
                                const raw = parseInt(e.target.value.replace(/\./g, "").replace(/\D/g, "")) || 0;
                                setSimAovValue(raw);
                                if (raw >= 8000000) {
                                  setSelectedSimTierId("tier-atelier");
                                } else if (raw >= 3500000) {
                                  setSelectedSimTierId("tier-icon");
                                } else if (raw >= 1500000) {
                                  setSelectedSimTierId("tier-essential");
                                } else {
                                  setSelectedSimTierId("tier-member");
                                }
                              }}
                              className="w-[120px] px-3 py-1.5 border border-border/80 rounded-xl text-right font-semibold font-mono text-xs focus:border-amber-500 outline-none text-foreground bg-background"
                            />
                          </div>
                        </div>

                        {/* Selector Segment for manual selection or override */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                            Cấu hình hạng thẻ đại diện (Click để so sánh chéo)
                          </label>
                          <div className="grid grid-cols-4 gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/60">
                            {[
                              { id: "tier-member", name: "Member", val: "0-1.5M", color: "#94a3b8" },
                              { id: "tier-essential", name: "Essential", val: "1.5M-3.5M", color: "#10b981" },
                              { id: "tier-icon", name: "Icon", val: "3.5M-8M", color: "#f59e0b" },
                              { id: "tier-atelier", name: "Atelier", val: "8M+", color: "#2f6cf5" }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedSimTierId(item.id)}
                                className={cn(
                                  "py-2 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center relative",
                                  selectedSimTierId === item.id
                                    ? "bg-background text-foreground font-extrabold shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-background/20 hover:text-foreground"
                                )}
                              >
                                <span
                                  className="w-2 h-2 rounded-full mb-1"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[10px] tracking-tight uppercase block leading-none">{item.name}</span>
                                <span className="text-[8px] opacity-70 mt-0.5 leading-none block">{item.val}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Live calculation mathematics representation */}
                        {(() => {
                          const multiplierMap: Record<string, number> = {
                            "tier-member": 1.0,
                            "tier-essential": 2.0,
                            "tier-icon": 4.0,
                            "tier-atelier": 6.0
                          };
                          
                          const cashbackMap: Record<string, string> = {
                            "tier-member": "1.0% hoàn tiền",
                            "tier-essential": "2.0% hoàn tiền",
                            "tier-icon": "4.0% hoàn tiền (VIP)",
                            "tier-atelier": "6.0% hoàn tiền (VVIP)"
                          };

                          const actualCashbackMap: Record<string, string> = {
                            "tier-member": "2.0% theo bảng tóm tắt",
                            "tier-essential": "3.0% tối đa hành trình",
                            "tier-icon": "5.0% đặc cách tri ân VIP",
                            "tier-atelier": "7.0% độc bản xa xỉ bậc nhất"
                          };

                          const tierNames: Record<string, string> = {
                            "tier-member": "MEMBER CLASS",
                            "tier-essential": "ESSENTIAL CLASS",
                            "tier-icon": "ICON (VIP) CLASS",
                            "tier-atelier": "ATELIER (VVIP) CLASS"
                          };

                          const currentMult = multiplierMap[selectedSimTierId] || 1.0;
                          const currentCashback = cashbackMap[selectedSimTierId] || "1.0%";
                          const tableCashback = actualCashbackMap[selectedSimTierId] || "2.0%";
                          
                          const baseMultiplier = isGlobalMultiplierActive ? globalMultiplier : 1.0;
                          const totalPoints = Math.round((simAovValue / 10000) * currentMult * baseMultiplier);
                          const equivalentValue = totalPoints * 100; // 1 Điểm = 100 VNĐ

                          return (
                            <div className="p-4 rounded-2xl bg-zinc-950 text-slate-100 font-mono text-left relative overflow-hidden space-y-3">
                              <div className="absolute right-0 bottom-0 p-3 opacity-10 font-bold tracking-tighter text-[40px] pointer-events-none select-none text-zinc-700">
                                SEVA CLUB
                              </div>
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Hệ số tích luỹ: {tierNames[selectedSimTierId]}</span>
                                <span className="text-[9px] bg-amber-500 text-slate-950 font-bold rounded px-1.5 uppercase tracking-wide">
                                  x{currentMult.toFixed(1)} Pts
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-400">
                                  <span>Tỷ suất cơ bản:</span>
                                  <span>{simAovValue.toLocaleString()}đ / 10.000 = {Math.floor(simAovValue / 10000)} pts</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>Hệ số nhân  hạng:</span>
                                  <span className="text-emerald-400 font-black">x{currentMult.toFixed(1)}</span>
                                </div>
                                {isGlobalMultiplierActive && (
                                  <div className="flex justify-between text-amber-400">
                                    <span>Global Multiplier ({globalMultiplierReason}):</span>
                                    <span className="font-extrabold text-amber-500">x{globalMultiplier.toFixed(1)}</span>
                                  </div>
                                )}
                                <div className="h-px bg-zinc-900 my-1" />
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[10px] font-black tracking-tight text-white uppercase">Tổng điểm thưởng sẽ nhận:</span>
                                  <span className="text-base font-black font-sans text-amber-500">
                                    +{totalPoints.toLocaleString()} Điểm
                                  </span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[10px] font-black tracking-tight text-white uppercase">Ví tích chi tiêu quy đổi:</span>
                                  <span className="text-xs font-black text-emerald-400">
                                    ~ {equivalentValue.toLocaleString()} VNĐ (1đ = 100đ)
                                  </span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-zinc-900 flex justify-between text-slate-400 text-[10px]">
                                  <span>Tỷ lệ cashback tiêu chuẩn:</span>
                                  <span className="text-slate-100 font-bold">{currentCashback}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-[10px]">
                                  <span>Tỷ lệ cashback tối đa biểu đồ:</span>
                                  <span className="text-amber-500 font-bold">{tableCashback}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* RIGHT PANEL: RICH PERKS DISPLAY & CARD PREVIEW */}
                    <div className="lg:col-span-6 space-y-6">
                      {(() => {
                        const tierDetailsMap: Record<string, {
                          name: string;
                          color: string;
                          packaging: string;
                          birthday: string;
                          spa: string;
                          service: string;
                          icon: any;
                          badgeDesc: string;
                          cardAccent: string;
                        }> = {
                          "tier-member": {
                            name: "SEVA Member Class",
                            color: "#94a3b8",
                            packaging: "Hộp giấy gia huy tiêu chuẩn thân thiện môi trường ép lụa.",
                            birthday: "Tặng ngay Voucher trị giá 50.000 VNĐ mừng sinh nhật (đơn sau từ 500k VNĐ).",
                            spa: "Miễn phí chăm sóc, đánh bóng cơ bản và làm sạch trang sức bằng sóng siêu âm trọn đời.",
                            service: "Bản tin xu hướng trang sức, sản phẩm độc bản định kỳ hàng quý.",
                            icon: Shield,
                            badgeDesc: "Chi tiêu tích luỹ từ 0đ - 1.499.000 VNĐ",
                            cardAccent: "from-slate-600 via-slate-800 to-zinc-900"
                          },
                          "tier-essential": {
                            name: "SEVA Essential Class",
                            color: "#10b981",
                            packaging: "Hộp giấy tiêu chuẩn tinh gọn dập chìm bảo an thương hiệu.",
                            birthday: "Tặng Voucher 100.000 VNĐ hoặc phiếu giảm giá trực tiếp 10% đặc cách mừng tháng tuổi mới.",
                            spa: "Hưởng trọn vẹn đặc quyền Member và thêm 1 lần xi mạ trắng mới miễn phí mỗi năm.",
                            service: "Nhận Early Access - Thông tin sản phẩm & quyền sở hữu trước 24h ngày mở bán BST.",
                            icon: Award,
                            badgeDesc: "Chi tiêu tích luỹ từ 1.500.000đ - 3.499.000 VNĐ",
                            cardAccent: "from-emerald-700 via-teal-900 to-zinc-900"
                          },
                          "tier-icon": {
                            name: "SEVA Icon VIP Class",
                            color: "#f59e0b",
                            packaging: "NÂNG CẤP hộp bọc nhung/da cao cấp, túi giấy dập nổi sợi dệt, ruy băng lụa ép kim nhũ vàng cát.",
                            birthday: "Tặng Voucher giảm 20% (Tối đa 500.000đ) kết hợp phần quà đặc nhiệm (khăn mạ bạc / hộp mini).",
                            spa: "Miễn phí gói làm sạch bóng lẫy cao cấp & xi mạ xi bạch kim 2 lần/năm.",
                            service: "Miễn phí vận chuyển (Freeship) online không điều kiện, Khắc tên dập nổi thông điệp yêu cầu.",
                            icon: Gem,
                            badgeDesc: "Chi tiêu tích luỹ từ 3.500.000đ - 7.999.000 VNĐ",
                            cardAccent: "from-amber-600 via-yellow-850 to-zinc-900"
                          },
                          "tier-atelier": {
                            name: "SEVA Atelier Royal Class",
                            color: "#2f6cf5",
                            packaging: "Biệt phẩm hộp gỗ bọc da thêu nhung thủ công cao cấp nhất, thiệp sáp thủ bút chúc thư vàng kim.",
                            birthday: "Tặng Voucher 30% [KHÔNG GIỚI HẠN TỐI ĐA MỨC GIẢM] + gửi quà tặng trang sức (500k-700k) tận tư dinh.",
                            spa: "Atelier Care: Xi mạ vàng, sửa chữa, thay thế đá chấu nhỏ, làm mới cực đại vô hạn số lần.",
                            service: "Hỗ trợ 1-1 chuyên trách qua Zalo, Vẽ rập 3D thủ công cùng Giám đốc, Xe đón VIP Lounge.",
                            icon: Crown,
                            badgeDesc: "Chi tiêu tinh tế từ 8.000.000 VNĐ trở lên",
                            cardAccent: "from-blue-700 via-indigo-950 to-zinc-900"
                          }
                        };

                        const selectedInfo = tierDetailsMap[selectedSimTierId] || tierDetailsMap["tier-member"];
                        const IconComponent = selectedInfo.icon;

                        return (
                          <div className="space-y-6">
                            {/* Visual Simulated VIP Card representation */}
                            <div className={cn(
                              "relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl transition-all duration-300 transform hover:scale-[1.01] aspect-[1.58/1] flex flex-col justify-between bg-gradient-to-r",
                              selectedInfo.cardAccent
                            )}>
                              <div className="absolute right-[-40px] top-[-30px] w-48 h-48 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 block">Thẻ Hội Viên Điện Tử Seva Club</span>
                                  <h4 className="text-base font-extrabold tracking-wide uppercase font-heading text-white">{selectedInfo.name}</h4>
                                </div>
                                <IconComponent className="w-8 h-8 opacity-90 text-amber-500 fill-amber-500/20 animate-pulse" />
                              </div>

                              <div className="space-y-2 mt-4 text-left">
                                <div className="flex gap-2.5 items-center">
                                  <span className="text-[9px] uppercase text-white/60 tracking-widest font-mono">Hạn mức hạng:</span>
                                  <span className="px-2 py-0.5 bg-white/10 text-white rounded-full text-[9px] font-black uppercase">
                                    {selectedInfo.badgeDesc}
                                  </span>
                                </div>
                                <p className="text-[10px] text-white/70 leading-relaxed font-sans mt-1">
                                  "Trải nghiệm sự phục vụ mang tinh thần bảo dưỡng xa xỉ độc bản của đá hộ mệnh & mỹ nghệ kim hoàn."
                                </p>
                              </div>

                              <div className="flex justify-between items-center border-t border-white/10 pt-2.5 text-[8px] font-mono tracking-wider text-slate-400 mt-2">
                                <span>REF ACCESS KEY: SEVA-{selectedSimTierId.split("-")[1]?.toUpperCase()}</span>
                                <span>VERIFIED LOYALTY PORTAL</span>
                              </div>
                            </div>

                            {/* Detailed List of VIP Perks specified in document */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                                Quyền lợi dịch vụ tra cứu theo chiến lược
                              </span>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {/* Perk Item: Packaging */}
                                <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-xl transition-all text-left">
                                  <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                                    <Gift className="w-3.5 h-3.5 text-pink-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Bao bì & Đóng gói</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                    {selectedInfo.packaging}
                                  </p>
                                </div>

                                {/* Perk Item: Birthday */}
                                <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-xl transition-all text-left">
                                  <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Sinh nhật vàng</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                    {selectedInfo.birthday}
                                  </p>
                                </div>

                                {/* Perk Item: Spa */}
                                <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-xl transition-all text-left">
                                  <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Spa trang sức & Bảo hảo</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                    {selectedInfo.spa}
                                  </p>
                                </div>

                                {/* Perk Item: Service */}
                                <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-xl transition-all text-left">
                                  <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                                    <Crown className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Trải nghiệm thượng hạng</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                                    {selectedInfo.service}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
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

      {showCreatePrivilegeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-6 relative overflow-hidden"
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
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-xl transition-all font-bold cursor-pointer text-sm"
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
                  className="w-full bg-muted/40 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
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
                  className="w-full bg-muted/40 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
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
                          "flex items-center gap-3 p-3 border border-border/80 rounded-2xl cursor-pointer hover:bg-muted/40 transition-all select-none"
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
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center gap-1 cursor-pointer"
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
            className="w-full max-w-md bg-[#ffffff] dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-2xl relative"
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

              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-3">
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
                <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-xl border border-border">
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
                  className="w-full bg-muted/40 border border-border p-3 rounded-xl font-bold text-xs outline-none focus:border-amber-500 text-foreground"
                  placeholder="Ví dụ: Sự kiện Tri ân Hè Seva Glow"
                  disabled={!isGlobalMultiplierActive}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowGlobalMultiplierDialog(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                  className="px-5 py-2 bg-[#2f6cf5] text-[#ffffff] hover:bg-[#2f6cf5]/90 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
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
