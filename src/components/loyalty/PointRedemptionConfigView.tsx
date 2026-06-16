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
  Info,
  Search,
  Ticket,
  Package,
  Percent,
  RefreshCw,
  ArrowRight,
  Power,
  Calendar,
  Layers,
  User,
  History,
  UserCheck,
  X,
  PlusCircle,
  MinusCircle,
  Shield,
  Palette
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
} from "firebase/firestore";
import { RedemptionRule } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";

const REWARD_TYPE_OPTIONS = [
  {
    value: "limited_item",
    label: "Sản phẩm giới hạn",
    icon: Package,
    color: "text-emerald-500 bg-emerald-550/10",
  },
  {
    value: "ticket",
    label: "Vé chương trình",
    icon: Ticket,
    color: "text-purple-500 bg-purple-550/10",
  },
  {
    value: "discount_percent",
    label: "Giảm % khi mua hàng",
    icon: Percent,
    color: "text-amber-500 bg-amber-550/10",
  },
  {
    value: "warranty",
    label: "Vé bảo hành miễn phí",
    icon: Shield,
    color: "text-blue-500 bg-blue-550/10",
  },
  {
    value: "maintenance",
    label: "Vé bảo dưỡng định kỳ",
    icon: Sliders,
    color: "text-cyan-500 bg-cyan-550/10",
  },
];

const PRESET_RULES = [
  {
    name: "Túi Tote phiên bản giới hạn SEVA",
    pointsRequired: 450,
    rewardType: "limited_item" as const,
    rewardValue: 1,
    description: "Sản phẩm thời trang cao cấp độc quyền dành cho khách hàng tích điểm.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 60,
  },
  {
    name: "Vé mời VIP Dạ tiệc tri ân cuối năm",
    pointsRequired: 1500,
    rewardType: "ticket" as const,
    rewardValue: 1,
    description: "Vé tham dự sự kiện âm nhạc và thời trang đẳng cấp cùng SEVA.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 90,
  },
  {
    name: "Chiết khấu 15% tổng hóa đơn",
    pointsRequired: 250,
    rewardType: "discount_percent" as const,
    rewardValue: 15,
    description: "Giảm trực tiếp 15% giá trị thanh toán không giới hạn.",
    isEnabled: true,
    minBillValue: 100000,
    expiryDays: 45,
  },
  {
    name: "Gói bảo hành vàng 24 tháng",
    pointsRequired: 800,
    rewardType: "warranty" as const,
    rewardValue: 1,
    description: "Nâng cấp gói bảo hành miễn phí cho sản phẩm điện tử.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 365,
  },
  {
    name: "Phiếu bảo dưỡng xe ô tô toàn diện",
    pointsRequired: 1200,
    rewardType: "maintenance" as const,
    rewardValue: 1,
    description: "Bảo dưỡng các hạng mục thay dầu, kiểm tra phanh, lọc gió.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 180,
  },
  {
    name: "Bình giữ nhiệt Titan SEVA",
    pointsRequired: 500,
    rewardType: "limited_item" as const,
    rewardValue: 1,
    description: "Phiên bản thiết kế Titanium chỉ dùng để đổi điểm, siêu giới hạn.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 60,
  },
  {
    name: "Vé vào cửa Khu Vui Chơi SEVA Park",
    pointsRequired: 200,
    rewardType: "ticket" as const,
    rewardValue: 1,
    description: "Vé vui chơi không giới hạn trò chơi tại công viên.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 30,
  },
];

export function PointRedemptionConfigView() {
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
      toast.success("Đã xóa nội dung cũ và tạo danh mục thiết lập Đổi Quà mới!");
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
        `Đã ${nextState ? "kích hoạt" : "tạm ngưng"} quy tắc đổi quà: ${rule.name}`,
      );
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
    } catch (e) {
      console.error(e);
      toast.error("Không thể cập nhật trạng thái");
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
    if (!confirm(`Bạn có chắc muốn xóa cấu hình quà tặng "${name}" không?`))
      return;

    const path = `redemption_rules/${id}`;
    try {
      await deleteDoc(doc(db, path));
      toast.success("Đã xóa quy tắc đổi quà thành công");
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
      toast.error("Tên món quà không được để trống");
      return;
    }

    if (Number(editingRule.pointsRequired) <= 0) {
      toast.error("Điểm đổi quà phải lớn hơn 0");
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

      toast.success("Đã lưu cấu hình đổi quà ưu đãi");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "redemption" } }),
      );
      setShowEditor(false);
      setEditingRule(null);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu cấu hình đổi quà");
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
        `Không đủ điểm! Cần thêm ${rule.pointsRequired - pts} điểm để đổi quầy quà tặng này.`,
      );
      return;
    }

    const nextPoints = pts - rule.pointsRequired;
    setSimPoints(nextPoints.toString());
    setSimLastClaimed(rule.name);

    toast.success(
      <div className="space-y-1 text-left">
        <p className="font-bold text-emerald-600">
          🎉 Đổi Quà Thử Nghiệm Thành Công!
        </p>
        <p className="text-xs">
          Bạn đã đổi quà thành công: <strong>{rule.name}</strong>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 border border-primary/10 rounded-3xl">
        <div className="flex items-start gap-4 text-left">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary mt-1">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-lg text-foreground">
              Hệ thống Thiết lập & Đổi quà Ưu đãi
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Quy trình khép kín: Tổ chức các chương trình quà贈 ưu đãi trước
              (Voucher, Hiện vật, Dịch vụ). Sau đó chuyển sang quầy đổi quà để
              khách đổi điểm & tự động khấu trừ điểm tích lũy của khách hàng
              trên hệ thống.
            </p>
          </div>
        </div>

      <div className="space-y-6">
        {/* Rules List column */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-1">
              <div className="text-left">
                <h5 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest">
                  Thư viện quà tặng tích lũy ({filteredRules.length})
                </h5>
                <p className="text-xs text-muted-foreground">
                  Tạo các gói kích cầu mua sắm bằng điểm của khách hàng
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Tìm quà tặng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary/50"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-background border border-border rounded-xl px-2 py-1.5 text-xs outline-none focus:border-primary/50"
                >
                  <option value="all">Mọi loại quà</option>
                  <option value="discount">Giảm giá (VNĐ)</option>
                  <option value="voucher">Chiết khấu (%)</option>
                  <option value="item">Hiện vật</option>
                  <option value="service">Dịch vụ</option>
                </select>

                <button
                  type="button"
                  onClick={handleNewRule}
                  className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition-all hover:bg-primary/90 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mới
                </button>
              </div>
            </div>

            {loadingRules ? (
              <div className="py-12 text-center text-muted-foreground italic bg-card border border-border rounded-3xl">
                Đang tải thư viện quà tặng...
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-3xl space-y-3 bg-card/40">
                <Gift className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">
                  Chưa có quy định ưu đãi quà tặng nào.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleBootstrap}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-xl font-bold border border-border"
                  >
                    Nạp dữ liệu mẫu
                  </button>
                  <button
                    onClick={handleNewRule}
                    className="text-white text-xs bg-primary px-3 py-1.5 rounded-xl font-bold"
                  >
                    Tạo mới ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {filteredRules.map((rule: any) => {
                  const typeInfo =
                    REWARD_TYPE_OPTIONS.find(
                      (o) => o.value === rule.rewardType,
                    ) || REWARD_TYPE_OPTIONS[0];
                  const TypeIcon = typeInfo.icon;

                  return (
                    <Card
                      key={rule.id}
                      className={`border-none ${rule.isEnabled !== false ? "bg-card" : "bg-muted/10 opacity-70"} hover:shadow-md transition-all duration-300 rounded-[1.5rem] border border-border/40 overflow-hidden text-left flex flex-col h-full`}
                    >
                      <div className="w-full h-28 relative bg-muted/30 border-b border-border/10 overflow-hidden group">
                         <img 
                            src={`https://picsum.photos/seed/${encodeURIComponent(rule.id || rule.name)}/400/200`} 
                            alt={rule.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105 mix-blend-overlay dark:opacity-60" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                         <div className="absolute bottom-0 translate-y-3 right-4 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleRuleStatus(rule)}
                              className="p-1.5 backdrop-blur-md bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shadow-sm"
                            >
                              <Power
                                className={`w-3.5 h-3.5 ${rule.isEnabled !== false ? "text-emerald-500" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditRule(rule)}
                              className="p-1.5 backdrop-blur-md bg-background/50 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id, rule.name)}
                              className="p-1.5 backdrop-blur-md bg-background/50 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      </div>

                      <CardContent className="flex-1 flex flex-col p-5 gap-4 pt-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-3 rounded-2xl ${typeInfo.color} shrink-0 mt-0.5 shadow-inner`}
                            >
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-foreground line-clamp-2">
                                  {rule.name}
                                </h4>
                                {rule.isEnabled === false && (
                                  <span className="bg-rose-500/10 text-rose-600 font-extrabold text-xs tracking-wider px-1.5 py-0.2 rounded uppercase">
                                    Vô hiệu hóa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {rule.description ||
                                  "Không có mô tả chi tiết cho món quà này."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-2 mt-auto gap-2 pt-1 border-t border-border/10">
                          <div className="p-2 bg-primary/5 rounded-xl border border-primary/10 flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                              Yêu cầu đổi
                            </span>
                            <span className="text-xs font-extrabold text-primary mt-0.5 flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-500" />
                              {rule.pointsRequired.toLocaleString()} pts
                            </span>
                          </div>

                          <div className="p-2 bg-muted/30 rounded-xl border border-border/10 flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                              Giá trị gói quà
                            </span>
                            <span className="text-xs font-bold text-foreground mt-0.5">
                              {rule.rewardType === "discount"
                                ? `${rule.rewardValue?.toLocaleString()}₫`
                                : rule.rewardType === "voucher"
                                  ? `${rule.rewardValue}%`
                                  : "Điện thoại / Vật phẩm"}
                            </span>
                          </div>

                          <div className="p-2 bg-muted/30 rounded-xl border border-border/10 flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                              Đơn tối thiểu
                            </span>
                            <span className="text-xs font-bold text-foreground mt-0.5">
                              {rule.minBillValue > 0
                                ? `${rule.minBillValue.toLocaleString()}₫`
                                : "Vô điều kiện"}
                            </span>
                          </div>

                          <div className="p-2 bg-muted/30 rounded-xl border border-border/10 flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                              Thời hạn mã
                            </span>
                            <span className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
                              {rule.expiryDays
                                ? `${rule.expiryDays} ngày`
                                : "30 ngày"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preset templates & Simulator Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/40">
            <Card className="border border-border bg-card rounded-[1.5rem] shadow-sm text-left">
              <div className="p-5 border-b border-border">
                <h5 className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Mẫu Cấu Hình Chuẩn
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tạo nhanh các phần quà tiêu biểu để quản lý chiến dịch của bạn
                  tiện lợi hơn.
                </p>
              </div>
              <CardContent className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống đề xuất các mẫu chương trình tích điểm đổi quà mang
                  lại tính trung thành cao nhất dựa trên chỉ số chiết khấu tối
                  ưu.
                </p>
                <button
                  type="button"
                  onClick={handleBootstrap}
                  className="w-full py-2.5 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Nạp quy tắc mẫu chuẩn SEVA
                </button>
              </CardContent>
            </Card>

            <Card className="border border-indigo-100 bg-indigo-50/10 dark:border-indigo-950 dark:bg-indigo-950/10 rounded-[1.5rem] p-5 text-left space-y-3">
              <h5 className="font-bold text-sm text-indigo-900 dark:text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Mô phỏng ví ảo (Sandbox)
              </h5>
              <p className="text-xs text-muted-foreground">
                Để kiểm thử tính hợp lý nhanh trước khi đưa vào áp dụng thực tế
                với khách hàng.
              </p>
              <div className="p-3 bg-background border border-indigo-150 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-bold">
                  <span>Số điểm giả lập</span>
                  <span>{simPoints} pts</span>
                </div>
                <div className="flex gap-1">
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="50"
                    value={simPoints}
                    onChange={(e) => setSimPoints(e.target.value)}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {rules.map((rule) => {
                  const eligible = Number(simPoints) >= rule.pointsRequired;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 bg-background/50 rounded-lg text-xs"
                    >
                      <span className="font-medium truncate max-w-[120px] text-foreground">
                        {rule.name}
                      </span>
                      {eligible ? (
                        <button
                          onClick={() => handleSimulateClaim(rule)}
                          className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 font-bold"
                        >
                          Thử Đổi
                        </button>
                      ) : (
                        <span className="text-xs text-amber-500 font-bold">
                          -{rule.pointsRequired - Number(simPoints)} pts
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
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
              className="relative w-full max-w-lg bg-background border border-border/80 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col text-left"
            >
              <form onSubmit={handleSaveRule} className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary animate-pulse" />
                    <div>
                      <h4 className="font-bold text-base text-foreground">
                        Thiết lập Quà Tặng / Ưu Đãi
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Khai báo phần thưởng trong thư viện trước khi khách tiến
                        hành đổi.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Tên quà tặng / Ưu đãi
                    </label>
                    <input
                      type="text"
                      required
                      value={editingRule.name}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, name: e.target.value })
                      }
                      placeholder="Ví dụ: Voucher chiết khấu 50K..."
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Mô tả quà tặng & Hướng dẫn sử dụng
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
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs min-h-[60px] outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        Nhóm Quà Ưu Đãi
                      </label>
                      <select
                        value={editingRule.rewardType}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            rewardType: e.target.value as any,
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
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
                          editingRule.rewardType === "item" ||
                          editingRule.rewardType === "service"
                        }
                        value={editingRule.rewardValue}
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            rewardValue: Number(e.target.value),
                          })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 disabled:bg-muted/50 disabled:cursor-not-allowed text-foreground"
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
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-bold"
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
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
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
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Giúp kiểm soát tối ưu ngân sách chiết khấu.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/20 flex items-center justify-between">
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
                    className="flex-1 px-4 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-xl transition-all cursor-pointer text-center text-foreground"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
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
    </div>
  );
}
