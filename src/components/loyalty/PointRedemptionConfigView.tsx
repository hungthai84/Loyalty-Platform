import React, { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  Sparkles,
  Coins,
  Save,
  Search,
  Ticket,
  Package,
  Percent,
  RefreshCw,
  Power,
  X,
  Shield
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { RedemptionRule } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { LoyaltyRedemptionBanner } from "./LoyaltyRedemptionBanner";

const REWARD_TYPE_OPTIONS = [
  {
    value: "discount_percent",
    label: "Giảm giá theo %",
    icon: Percent,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    value: "discount_fixed",
    label: "Giảm giá cố định (VNĐ)",
    icon: Coins,
    color: "text-[#2f6cf5] bg-blue-500/10",
  },
  {
    value: "buy_one_get_one",
    label: "Mua 1 Tặng 1",
    icon: Gift,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    value: "free_gift",
    label: "Tặng kèm quà khi mua",
    icon: Gift,
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    value: "ticket",
    label: "Vé chương trình / sự kiện VIP",
    icon: Ticket,
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    value: "limited_item",
    label: "Vật phẩm giới hạn",
    icon: Package,
    color: "text-teal-500 bg-teal-500/10",
  },
  {
    value: "warranty",
    label: "Bảo hành & Bảo dưỡng VIP",
    icon: Shield,
    color: "text-cyan-500 bg-cyan-500/10",
  },
];

const PRESET_RULES = [
  {
    name: "Ưu đãi Giảm giá 15% Bộ sưu tập mới",
    pointsRequired: 250,
    rewardType: "discount_percent" as const,
    rewardValue: 15,
    description: "Áp dụng giảm trực tiếp 15% khi mua các loại trang sức ngọc trai và đá quý tự nhiên.",
    isEnabled: true,
    minBillValue: 2000000,
    expiryDays: 30,
  },
  {
    name: "Voucher Giảm 500k cho hóa đơn từ 5 Triệu",
    pointsRequired: 400,
    rewardType: "discount_fixed" as const,
    rewardValue: 500000,
    description: "Giảm ngay 500,000đ khi thanh toán đơn hàng trang sức vàng cưới hoặc đá quý.",
    isEnabled: true,
    minBillValue: 5000000,
    expiryDays: 45,
  },
  {
    name: "Ưu đãi Mua 1 Tặng 1 dòng Charm Vàng",
    pointsRequired: 350,
    rewardType: "buy_one_get_one" as const,
    rewardValue: 1,
    description: "Khi mua 1 Charm vàng 10K, tặng ngay 1 Charm bạc cao cấp S925 đồng dạng.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 30,
  },
  {
    name: "Tặng Hộp da đựng trang sức Heritage kèm đơn hàng",
    pointsRequired: 180,
    rewardType: "free_gift" as const,
    rewardValue: 1,
    description: "Tặng kèm 1 hộp đựng trang sức bằng da PU cao cấp cho bất kỳ đơn hàng nào phát sinh.",
    isEnabled: true,
    minBillValue: 1000000,
    expiryDays: 60,
  },
  {
    name: "Vé mời VIP độc quyền Dạ tiệc Tri ân Seva",
    pointsRequired: 1000,
    rewardType: "ticket" as const,
    rewardValue: 1,
    description: "Tham dự đêm nhạc hội luxury độc quyền và thưởng lãm BST trang sức kim cương mới.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 90,
  },
  {
    name: "Gói Spa làm bóng trang sức trọn đời",
    pointsRequired: 300,
    rewardType: "warranty" as const,
    rewardValue: 1,
    description: "Đặc quyền mang sản phẩm tới làm sạch, siêu âm, xi xi mạ bóng miễn phí không giới hạn.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 365,
  },
];

interface PointRedemptionConfigViewProps {
  onAddRule?: () => void;
}

export function PointRedemptionConfigView({ onAddRule }: PointRedemptionConfigViewProps) {
  const { user } = useFirebase();
  const [activeSubTab, setActiveSubTab] = useState<
    "create_offers" | "redeem_terminal"
  >("create_offers");

  // Rules State
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Real Customers State
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [customerSearch, setCustomerSearch] = useState("");

  // Redemption Logs State
  const [redeemLogs, setRedeemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Modal editor State
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  // Sandbox State (preserved side preview simulation)
  const [simPoints, setSimPoints] = useState("350");
  const [simLastClaimed, setSimLastClaimed] = useState<string | null>(null);

  // Load rules from Firestore
  useEffect(() => {
    if (!user || user.isLocal) {
      setRules(PRESET_RULES as any);
      setLoadingRules(false);
      return;
    }
    const path = `redemption_rules`;
    const q = query(collection(db, path), orderBy("pointsRequired", "asc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Automatically write presets if collection is empty
          PRESET_RULES.forEach(async (p, idx) => {
            const id = `RULE-PRESET-${idx + 1}`;
            await setDoc(doc(db, `${path}/${id}`), {
              id,
              ...p,
              userId: user.uid,
              createdAt: serverTimestamp(),
            });
          });
        } else {
          const items = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "",
              pointsRequired: Number(data.pointsRequired || 0),
              rewardType: data.rewardType || "discount",
              rewardValue: Number(data.rewardValue || 0),
              description: data.description || "",
              isEnabled: data.isEnabled === undefined ? true : data.isEnabled,
              minBillValue: Number(data.minBillValue || 0),
              expiryDays: Number(data.expiryDays || 30),
              userId: data.userId || user.uid,
              createdAt: data.createdAt,
            } as any;
          });
          setRules(items);
        }
        setLoadingRules(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoadingRules(false);
      },
    );

    return unsub;
  }, [user]);

  // Load Real Customers from Firestore
  useEffect(() => {
    if (!user || user.isLocal) {
      setCustomers([]);
      setLoadingCustomers(false);
      return;
    }

    const path = `customers`;
    const q = query(collection(db, path));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(items);
        setLoadingCustomers(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoadingCustomers(false);
      },
    );

    return unsub;
  }, [user]);

  // Load Redemption Logs from Firestore
  useEffect(() => {
    if (!user || user.isLocal) return;

    const path = `redemptions`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRedeemLogs(items);
        setLoadingLogs(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoadingLogs(false);
      },
    );

    return unsub;
  }, [user]);

  // Bootstrap initial rule presets
  const handleBootstrap = async () => {
    if (!user) return;
    if (!confirm("Thao tác này sẽ xóa toàn bộ nội dung Đổi Quà cũ và thay bằng tính năng mới. Bạn có tiếp tục?"))
      return;

    try {
      const path = `redemption_rules`;
      // Clear out the previous contents
      for (const rule of rules) {
         try {
           await deleteDoc(doc(db, `${path}/${rule.id}`));
         } catch(e) {}
      }

      for (let i = 0; i < PRESET_RULES.length; i++) {
        const id = `RULE-NEW-${Date.now()}-${i}`;
        await setDoc(doc(db, `${path}/${id}`), {
          id,
          ...PRESET_RULES[i],
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Đã xóa nội dung cũ và tạo danh mục thiết lập Ưu Đãi mới!");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
    } catch (e) {
      console.error(e);
      toast.error("Không thể khởi tạo mẫu");
    }
  };

  // Toggle active status
  const handleToggleRuleStatus = async (rule: any) => {
    if (!user) return;
    const path = `redemption_rules/${rule.id}`;
    const nextState = !rule.isEnabled;
    try {
      await setDoc(
        doc(db, path),
        {
          ...rule,
          isEnabled: nextState,
        },
        { merge: true },
      );
      toast.success(
        `Đã ${nextState ? "kích hoạt" : "tạm ngưng"} quy tắc đổi ưu đãi: ${rule.name}`,
      );
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
    } catch (e) {
      console.error(e);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleBootstrapRules = async () => {
    if (!user) return;
    try {
      const batchOp = writeBatch(db);
      for (let i = 0; i < PRESET_RULES.length; i++) {
        const item = PRESET_RULES[i];
        const ruleId = `RULE-${Date.now()}-${i}`;
        const ref = doc(db, `redemption_rules/${ruleId}`);
        batchOp.set(ref, {
          ...item,
          id: ruleId,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batchOp.commit();
      toast.success("Đã nạp mẫu cấu hình ưu đãi");
    } catch (e) {
      console.error(e);
      toast.error("Không thể nạp mẫu");
    }
  };

  const handleNewRule = () => {
    setEditingRule({
      id: `RULE-${Date.now()}`,
      name: "",
      pointsRequired: 150,
      rewardType: "discount",
      rewardValue: 50000,
      description: "",
      isEnabled: true,
      minBillValue: 0,
      expiryDays: 30,
    });
    setShowEditor(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule({ ...rule });
    setShowEditor(true);
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (!user) return;
    if (!confirm(`Bạn có chắc muốn xóa cấu hình ưu đãi "${name}" không?`))
      return;

    const path = `redemption_rules/${id}`;
    try {
      await deleteDoc(doc(db, path));
      toast.success("Đã xóa quy tắc ưu đãi thành công");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingRule) return;

    if (!editingRule.name.trim()) {
      toast.error("Tên ưu đãi không được để trống");
      return;
    }

    if (Number(editingRule.pointsRequired) <= 0) {
      toast.error("Điểm yêu cầu đổi phải lớn hơn 0");
      return;
    }

    const path = `redemption_rules/${editingRule.id}`;
    try {
      await setDoc(
        doc(db, path),
        {
          ...editingRule,
          pointsRequired: Number(editingRule.pointsRequired),
          rewardValue: Number(editingRule.rewardValue),
          minBillValue: Number(editingRule.minBillValue || 0),
          expiryDays: Number(editingRule.expiryDays || 30),
          userId: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast.success("Đã lưu cấu hình quy tắc ưu đãi");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
      setShowEditor(false);
      setEditingRule(null);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu ưu đãi");
    }
  };

  // Live points adjustment for selected customer to easily demo with different values
  const handleAdjustCustomerPoints = async (customer: any, amount: number) => {
    if (!user || !customer) return;
    const currentPoints = customer.points || 0;
    const finalPoints = Math.max(0, currentPoints + amount);

    try {
      const custRef = doc(db, `customers/${customer.id}`);
      await updateDoc(custRef, {
        points: finalPoints,
        updatedAt: serverTimestamp(),
      });
      toast.success(
        `Đã cập nhật điểm cho khách hàng ${customer.name}: ${finalPoints.toLocaleString()} pts`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Không thể thay đổi điểm tài khoản");
    }
  };

  // ACTUAL Point Deduction and Redeem logging to Firestore!
  const handleExecuteRealRedeem = async (customer: any, rule: any) => {
    if (!user || !customer || !rule) return;

    const currentPoints = Number(customer.points || 0);
    if (currentPoints < rule.pointsRequired) {
      toast.error(
        `Khách hàng không đủ điểm tích luỹ. Cần thêm ${rule.pointsRequired - currentPoints} pts.`,
      );
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn tiến hành đổi ưu đãi "${rule.name}" cho khách hàng ${customer.name}? Việc này sẽ khấu trừ ${rule.pointsRequired} pts khỏi tổng tích lũy.`,
      )
    ) {
      return;
    }

    try {
      // 1. Deduct points in Firestore for this Customer
      const custRef = doc(db, `customers/${customer.id}`);
      const newPoints = currentPoints - rule.pointsRequired;
      await updateDoc(custRef, {
        points: newPoints,
        updatedAt: serverTimestamp(),
      });

      // 2. Log transaction to `users/${uid}/redemptions`
      const redemptionId = `REDEEM-${Date.now()}`;
      const logRef = doc(db, `redemptions/${redemptionId}`);
      await setDoc(logRef, {
        id: redemptionId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || "",
        ruleId: rule.id,
        ruleName: rule.name,
        rewardType: rule.rewardType,
        pointsRedeemed: rule.pointsRequired,
        createdAt: serverTimestamp(),
      });

      toast.success(
        <div className="space-y-1 text-left select-none">
          <p className="font-bold text-emerald-600">
            🎉 Đã Đổi Ưu Đãi Thành Công!
          </p>
          <p className="text-xs">
            Đã đổi: <strong>{rule.name}</strong>
          </p>
          <p className="text-xs">
            Khách hàng: <strong>{customer.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground ">
            Đã trừ{" "}
            <span className="text-rose-600 font-bold">
              -{rule.pointsRequired} pts
            </span>
            . Điểm còn lại: {newPoints} pts
          </p>
        </div>,
        { duration: 5000 },
      );
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi thực hiện đổi thưởng");
    }
  };

  // Pure Client Sandbox simulation function (for sidebar backup)
  const handleSimulateClaim = (rule: any) => {
    const pts = Number(simPoints);
    if (pts < rule.pointsRequired) {
      toast.error(
        `Không đủ điểm! Cần thêm ${rule.pointsRequired - pts} điểm để đổi ưu đãi này.`,
      );
      return;
    }

    const nextPoints = pts - rule.pointsRequired;
    setSimPoints(nextPoints.toString());
    setSimLastClaimed(rule.name);

    toast.success(
      <div className="space-y-1 text-left">
        <p className="font-bold text-emerald-600">
          🎉 Đổi Ưu Đãi Thử Nghiệm Thành Công!
        </p>
        <p className="text-xs">
          Bạn đã trích điểm đổi thành công: <strong>{rule.name}</strong>
        </p>
        <p className="text-xs text-muted-foreground ">
          Đã khấu trừ: -{rule.pointsRequired} pts. Điểm ảo còn lại: {nextPoints}{" "}
          pts
        </p>
      </div>,
      { duration: 4000 },
    );
  };

  // Filtering Master Offers
  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || r.rewardType === filterType;
    return matchesSearch && matchesType;
  });

  // Filtering Real Customers for autocomplete/dropdown selection
  const filteredCustomers = customers.filter((c) => {
    const searchLower = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(customerSearch) ||
      (c.email || "").toLowerCase().includes(searchLower)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <>
      <div className="space-y-6">
        <LoyaltyRedemptionBanner
          onAddRule={() => {
             if (onAddRule) onAddRule();
             else handleNewRule();
          }}
        />

      {/* Utilities */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between px-1">
        <div className="text-left">
          <h5 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest">
            Thư viện ưu đãi ({filteredRules.length})
          </h5>
          <p className="text-xs text-muted-foreground">
            Tạo các gói kích cầu mua sắm bằng điểm của khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm ưu đãi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[10px] text-xs outline-none focus:border-primary/50"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-[10px] px-2.5 py-1.5 text-xs outline-none focus:border-primary/50 text-foreground font-medium"
          >
            <option value="all">Mọi nhóm ưu đãi</option>
            {REWARD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingRules ? (
        <div className="py-16 text-center text-muted-foreground italic bg-card border border-border rounded-[10px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
          Đang tải thư viện ưu đãi...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-[10px] space-y-4 bg-muted/5">
          <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-bold text-muted-foreground">
              Chưa tìm thấy quy định ưu đãi nào.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Bắt đầu tạo các gói ưu đãi đổi điểm để thu hút khách hàng quay lại.
            </p>
          </div>
          <button
            onClick={handleNewRule}
            className="px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 rounded-[10px] text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Tiếp nội dung mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRules.map((rule: any) => {
            const typeInfo =
              REWARD_TYPE_OPTIONS.find((o) => o.value === rule.rewardType) ||
              REWARD_TYPE_OPTIONS[0];
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                layout
                key={rule.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group h-full"
              >
                <Card
                  className={cn(
                    "h-full p-0 border bg-card overflow-hidden rounded-[10px] flex flex-col shadow-sm transition-all duration-300 hover:shadow-xl",
                    rule.isEnabled !== false ? "border-border/80" : "opacity-70 border-dashed"
                  )}
                >
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    <img
                      src={
                        rule.imageUrl ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                          rule.id || rule.name
                        )}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
                      }
                      alt={rule.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-1">
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full select-none text-white",
                          rule.isEnabled !== false ? "bg-emerald-500" : "bg-slate-500"
                        )}
                      >
                        {rule.isEnabled !== false ? "Đang hiệu lực" : "Tạm ngưng"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <div className="bg-black/40 backdrop-blur-md py-1 border border-white/10 px-2.5 rounded-[10px] w-fit">
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 fill-amber-400/10" />
                          Trừ {rule.pointsRequired.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="flex-1 flex flex-col p-5 text-left justify-between gap-4">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md", typeInfo.color)}>
                          <TypeIcon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-[#2f6cf5] transition-colors">
                          {rule.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 h-[32px]">
                        {rule.description || "Ưu đãi khách hàng thân thiết."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/10">
                      <div className="flex items-center justify-between text-[11px]">
                         <span className="text-muted-foreground font-semibold">Giá trị quy đổi:</span>
                         <span className="font-bold text-foreground">
                            {rule.rewardType === "discount_percent"
                                ? `Giảm ${rule.rewardValue}%`
                                : rule.rewardType === "discount_fixed"
                                  ? `Giảm ${rule.rewardValue?.toLocaleString()}₫`
                                  : "Quyền lợi đặc biệt"}
                         </span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleStatus(rule)}
                          className="p-1.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-[10px] transition-colors cursor-pointer"
                          title={rule.isEnabled !== false ? "Ngưng kích hoạt" : "Kích hoạt"}
                        >
                          <Power className={cn("w-3.5 h-3.5", rule.isEnabled !== false ? "text-emerald-500" : "text-muted-foreground")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditRule(rule)}
                          className="p-1.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-[10px] transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="p-1.5 bg-background border border-border text-muted-foreground hover:text-red-500 hover:bg-red-50/10 rounded-[10px] transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

    {/* Editor Modal for creating/updating Master Offers */}
      <AnimatePresence>
        {showEditor && editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditor(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-background border border-border/80 rounded-[10px] shadow-2xl overflow-hidden flex flex-col text-left"
            >
              <form onSubmit={handleSaveRule} className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary animate-pulse" />
                    <div>
                      <h4 className="font-bold text-base text-foreground">
                        Thiết lập Tham số Ưu Đãi
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Khai báo gói trả thưởng trong thư viện trước khi khách tiến
                        hành đổi.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Tên ưu đãi / Voucher
                    </label>
                    <input
                      type="text"
                      required
                      value={editingRule.name}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, name: e.target.value })
                      }
                      placeholder="Ví dụ: Voucher chiết khấu 50K..."
                      className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Mô tả / Hướng dẫn sử dụng ưu đãi
                    </label>
                    <textarea
                      value={editingRule.description}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          description: e.target.value,
                        })
                      }
                      placeholder="Chi tiết sử dụng (ví dụ: Áp dụng tất cả chi nhánh, trừ đại lý ngoại tỉnh...)"
                      className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs min-h-[60px] outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Đường dẫn hình ảnh minh họa (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editingRule.imageUrl || ""}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="Dán URL hình ảnh..."
                        className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRule({
                            ...editingRule,
                            imageUrl: `https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=60`,
                          });
                        }}
                        className="px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-[10px] border border-border cursor-pointer transition-all shrink-0"
                      >
                        Nẫu nhiên
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        Nhóm Ưu Đãi
                      </label>
                      <select
                        value={editingRule.rewardType}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            rewardType: e.target.value as any,
                          })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                      >
                        {REWARD_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        Giá trị (VNĐ hoặc %)
                      </label>
                      <input
                        type="number"
                        disabled={
                          editingRule.rewardType === "buy_one_get_one" ||
                          editingRule.rewardType === "free_gift" ||
                          editingRule.rewardType === "limited_item" ||
                          editingRule.rewardType === "ticket"
                        }
                        value={editingRule.rewardValue}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            rewardValue: Number(e.target.value),
                          })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 disabled:bg-muted/50 disabled:cursor-not-allowed text-foreground"
                        placeholder="Ví dụ: 50000 hoặc 10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1 text-primary">
                        <Coins className="w-3.5 h-3.5" />
                        Số Điểm Yêu Cầu Đổi
                      </label>
                      <input
                        type="number"
                        required
                        value={editingRule.pointsRequired}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            pointsRequired: Number(e.target.value),
                          })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
                        placeholder="Số điểm đổi (v.d. 150)"
                        min="1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        Hạn dùng sau khi nhận (Ngày)
                      </label>
                      <input
                        type="number"
                        required
                        value={editingRule.expiryDays || 30}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            expiryDays: Number(e.target.value),
                          })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                        placeholder="Thời hạn (v.d. 30)"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Giá trị đơn hàng tối thiểu áp dụng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={editingRule.minBillValue || 0}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          minBillValue: Number(e.target.value),
                        })
                      }
                      placeholder="Để 0 nếu không hạn chế"
                      className="w-full bg-background border border-border rounded-[10px] px-3.5 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Giúp kiểm soát tối ưu ngân sách chiết khấu.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-[10px] border border-border/20 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-foreground">
                        Trạng thái phát hành
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Kích hoạt để cho phép đổi điểm lấy ưu đãi này
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRule({
                          ...editingRule,
                          isEnabled:
                            editingRule.isEnabled !== false ? false : true,
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${editingRule.isEnabled !== false ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${editingRule.isEnabled !== false ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-6 border-t border-border bg-muted/10 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="flex-1 px-4 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-[10px] transition-all cursor-pointer text-center text-foreground"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-[10px] hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Lưu ưu đãi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
