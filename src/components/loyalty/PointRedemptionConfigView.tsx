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
    value: "discount",
    label: "Phiếu giảm giá (VND)",
    icon: Ticket,
    color: "text-blue-500 bg-blue-550/10",
  },
  {
    value: "voucher",
    label: "Voucher Chiết khấu (%)",
    icon: Percent,
    color: "text-amber-500 bg-amber-550/10",
  },
  {
    value: "item",
    label: "Quà hiện vật & Sản phẩm",
    icon: Package,
    color: "text-emerald-500 bg-emerald-550/10",
  },
  {
    value: "service",
    label: "Dịch vụ & Đặc quyền đặc biệt",
    icon: Sparkles,
    color: "text-purple-500 bg-purple-550/10",
  },
];

const PRESET_RULES = [
  {
    name: "Voucher giảm giá 50,000đ",
    pointsRequired: 100,
    rewardType: "discount" as const,
    rewardValue: 50000,
    description:
      "Áp dụng cho mọi hóa đơn mua hàng từ 250k trở lên. Hạn dùng 30 ngày.",
    isEnabled: true,
    minBillValue: 250000,
    expiryDays: 30,
  },
  {
    name: "Chiết khấu 10% tổng hóa đơn",
    pointsRequired: 250,
    rewardType: "voucher" as const,
    rewardValue: 10,
    description: "Giảm trực tiếp 10% giá trị thanh toán, giảm tối đa 100,000đ.",
    isEnabled: true,
    minBillValue: 100000,
    expiryDays: 45,
  },
  {
    name: "Bình nước giữ nhiệt SEVA Limited",
    pointsRequired: 450,
    rewardType: "item" as const,
    rewardValue: 1,
    description:
      "Quà tặng hiện vật đặc quyền in logo thương hiệu SEVA cao cấp.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 60,
  },
  {
    name: "Miễn phí dịch vụ Spa Premium",
    pointsRequired: 800,
    rewardType: "service" as const,
    rewardValue: 1,
    description:
      "Tặng 1 buổi trải nghiệm dịch vụ chăm sóc da chuyên sâu 60 phút miễn phí.",
    isEnabled: true,
    minBillValue: 0,
    expiryDays: 90,
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
    if (!confirm("Bạn có muốn tạo thêm các quy tắc đổi quả mẫu chuẩn không?"))
      return;

    try {
      const path = `redemption_rules`;
      for (let i = 0; i < PRESET_RULES.length; i++) {
        const id = `RULE-BOOTSTRAP-${Date.now()}-${i}`;
        await setDoc(doc(db, `${path}/${id}`), {
          id,
          ...PRESET_RULES[i],
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Đã bổ sung các quy tắc đổi quà mẫu chuẩn thành công!");
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

        {/* High visual toggle sub-tabs selector */}
        <div className="flex bg-muted/80 p-1 rounded-2xl border border-border shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setActiveSubTab("create_offers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "create_offers"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Quản lý Ưu đãi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("redeem_terminal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "redeem_terminal"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            2. Trừ điểm Đổi quà
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CREATE MASTER OFFERS */}
      {activeSubTab === "create_offers" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Rules List column */}
          <div className="xl:col-span-8 space-y-4">
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
                      <CardContent className="flex-1 flex flex-col p-5 gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2.5 rounded-xl ${typeInfo.color} shrink-0 mt-0.5`}
                            >
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-foreground">
                                  {rule.name}
                                </h4>
                                {rule.isEnabled === false && (
                                  <span className="bg-rose-500/10 text-rose-600 font-extrabold text-xs tracking-wider px-1.5 py-0.2 rounded uppercase">
                                    Vô hiệu hóa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                                {rule.description ||
                                  "Không có mô tả chi tiết cho món quà này."}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleRuleStatus(rule)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                              title={
                                rule.isEnabled !== false
                                  ? "Tạm ngưng"
                                  : "Kích hoạt"
                              }
                            >
                              <Power
                                className={`w-3.5 h-3.5 ${rule.isEnabled !== false ? "text-emerald-500" : "text-muted-foreground"}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditRule(rule)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRule(rule.id, rule.name)
                              }
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          <div className="xl:col-span-4 space-y-4">
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
      )}

      {/* SUBTAB 2: REDEEM OPERATIONS - POINT DEDUCTION */}
      {activeSubTab === "redeem_terminal" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Customer Selection Column */}
          <div className="xl:col-span-5 space-y-4">
            <Card className="border border-border bg-card rounded-3xl overflow-hidden text-left">
              <div className="p-5 border-b border-border bg-muted/10">
                <h5 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                  <User className="w-4 h-4 text-[#2f6cf5]" />
                  Chọn Khách Hàng Muốn Đổi Quà
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tìm kiếm khách hàng theo Tên, Số điện thoại hoặc Email để tra
                  cứu ví điểm.
                </p>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Tìm tên hoặc SĐT khách..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary/50"
                  />
                </div>

                {loadingCustomers ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Đang tải danh sách khách hàng từ hệ thống...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                    Không tìm thấy khách hàng nào khớp.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCustomers.map((cust: any) => {
                      const isSelected = selectedCustomerId === cust.id;
                      const userPoints = cust.points || 0;
                      return (
                        <div
                          key={cust.id}
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-primary/5 border-primary shadow-xs"
                              : "bg-background hover:bg-muted/40 border-border/80"
                          }`}
                        >
                          <div className="space-y-0.5 text-left max-w-[70%]">
                            <span className="font-bold text-xs block text-foreground truncate">
                              {cust.name}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              SĐT: {cust.phone || "Chưa cung cấp"}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-xl font-black">
                              {userPoints.toLocaleString()} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Redemptions Live History Log */}
            <Card className="border border-border bg-card rounded-3xl overflow-hidden text-left">
              <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
                <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Nhật Ký Đổi Quà Thực Tế
                </h5>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                  LIVE-SYNCED
                </span>
              </div>
              <CardContent className="p-4">
                {loadingLogs ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Đang tải lịch sử đổi...
                  </div>
                ) : redeemLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Chưa có giao dịch đổi quà nào hôm nay.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {redeemLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-muted/30 border border-border/20 rounded-xl space-y-1"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-foreground block truncate max-w-[150px]">
                            {log.ruleName}
                          </span>
                          <span className="text-xs text-rose-600 font-extrabold ">
                            -{log.pointsRedeemed} pts
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            Khách:{" "}
                            <strong className="text-foreground">
                              {log.customerName}
                            </strong>
                          </span>
                          <span>
                            {log.createdAt?.toDate
                              ? log.createdAt
                                  .toDate()
                                  .toLocaleTimeString("vi-VN", {
                                    hour: "numeric",
                                    minute: "numeric",
                                  })
                              : "Vừa xong"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Redemption Terminal Panel */}
          <div className="xl:col-span-7 space-y-4">
            {!selectedCustomer ? (
              <div className="py-32 text-center border-2 border-dashed border-border rounded-3xl space-y-4 bg-muted/20">
                <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-muted-foreground">
                    Bếp Phục Vụ Đổi Quà SEVA
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto p-2">
                    Vui lòng click chọn 1 khách hàng từ danh bạ bên trái để mở
                    giao diện kiểm duyệt, tùy chỉnh điểm số và thực hiện trừ
                    điểm tự động khi quy nạp quà thưởng.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Selected Customer Core Passport Card */}
                <Card className="border-none bg-primary text-primary-foreground rounded-3xl overflow-hidden shadow-lg border relative">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full translate-x-12 -translate-y-12" />
                  <CardContent className="p-6 relative text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center font-bold text-lg select-none">
                          {selectedCustomer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-base leading-none text-white">
                            {selectedCustomer.name}
                          </h4>
                          <span className="text-xs text-white/70 block">
                            SĐT: {selectedCustomer.phone || "Không có"}
                          </span>
                          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-black tracking-wide uppercase inline-block">
                            {selectedCustomer.points &&
                            selectedCustomer.points >= 150000
                              ? "Atelier Tier"
                              : selectedCustomer.points &&
                                  selectedCustomer.points >= 50000
                                ? "Icon Tier"
                                : "Essential Tier"}
                          </span>
                        </div>
                      </div>

                      {/* Display Big Account Points */}
                      <div className="text-right flex flex-col items-end shrink-0 sm:border-l sm:border-white/10 sm:pl-6">
                        <span className="text-xs text-white/70 font-bold uppercase tracking-widest block">
                          Số Điểm Hiện Có
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <Coins className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
                          <span className="text-3xl font-black tracking-tight text-white">
                            {(selectedCustomer.points || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-white/80 font-bold">
                            PTS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Developer test harness shortcut to easily add/minus points for simulation */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 -mx-6 -mb-6 p-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/80">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Hỗ trợ Demo: Nhanh chóng nạp/khấu trừ để test các
                          ngưỡng đổi thưởng.
                        </span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() =>
                            handleAdjustCustomerPoints(selectedCustomer, -100)
                          }
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1"
                          title="Trừ bớt 100 điểm để thử nghiệm"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          Trừ 100 pts
                        </button>
                        <button
                          onClick={() =>
                            handleAdjustCustomerPoints(selectedCustomer, 500)
                          }
                          className="px-2.5 py-1 bg-white hover:bg-white/90 rounded-lg text-xs font-bold text-primary transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          title="Tặng thêm 500 điểm để tăng số dư"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-primary" />
                          Nạp 500 pts
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grid of Redeemable Options for the Selected Client */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h5 className="text-xs font-extrabold text-[#2f6cf5] uppercase tracking-widest text-left">
                      Khả năng đổi điểm nhận quà của khách hàng
                    </h5>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Tích có sẵn:{" "}
                      {(selectedCustomer.points || 0).toLocaleString()} pts
                    </span>
                  </div>

                  {rules.length === 0 ? (
                    <div className="py-12 bg-card rounded-3xl text-center text-xs text-muted-foreground border">
                      Chưa cấu hình bất kỳ ưu đãi quà tặng nào trong Thư viện Ưu
                      đãi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {rules.map((rule: any) => {
                        const currentPoints = Number(
                          selectedCustomer.points || 0,
                        );
                        const isEligible =
                          currentPoints >= rule.pointsRequired &&
                          rule.isEnabled !== false;
                        const missingPoints =
                          rule.pointsRequired - currentPoints;
                        const progressPercentage = Math.min(
                          100,
                          Math.floor(
                            (currentPoints / rule.pointsRequired) * 100,
                          ),
                        );

                        const typeInfo =
                          REWARD_TYPE_OPTIONS.find(
                            (o) => o.value === rule.rewardType,
                          ) || REWARD_TYPE_OPTIONS[0];
                        const TypeIcon = typeInfo.icon;

                        return (
                          <div
                            key={rule.id}
                            className={`p-4 rounded-3xl border text-left transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isEligible
                                ? "bg-emerald-550/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-500"
                                : "bg-muted/30 border-border/80 opacity-70"
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div
                                className={`p-2.5 rounded-2xl ${isEligible ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"} shrink-0 mt-0.5`}
                              >
                                <TypeIcon className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-xs text-foreground block">
                                  {rule.name}
                                </span>
                                <span className="text-xs text-muted-foreground block max-w-sm">
                                  {rule.description ||
                                    "Không có hướng dẫn phụ."}
                                </span>
                                <span className="text-xs font-semibold text-primary block">
                                  Quy đổi:{" "}
                                  <strong className="font-bold">
                                    {rule.pointsRequired} pts
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Actions or requirements */}
                            <div className="shrink-0 self-end md:self-center">
                              {rule.isEnabled === false ? (
                                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-500 rounded-md font-extrabold uppercase shrink-0 tracking-wider">
                                  Tạm dừng
                                </span>
                              ) : isEligible ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleExecuteRealRedeem(
                                      selectedCustomer,
                                      rule,
                                    )
                                  }
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-emerald-700 hover:shadow-md cursor-pointer flex items-center gap-1"
                                >
                                  Đổi Quà & Trừ Điểm
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="space-y-1.5 text-right w-44">
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>Tiến độ {progressPercentage}%</span>
                                    <span className="text-amber-600 font-bold">
                                      Thiếu {missingPoints} pts
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

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
                        <option value="discount">Phiếu giảm giá (VNĐ)</option>
                        <option value="voucher">Voucher Chiết khấu (%)</option>
                        <option value="item">Quà hiện vật & Sản phẩm</option>
                        <option value="service">Dịch vụ & Đặc quyền</option>
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
