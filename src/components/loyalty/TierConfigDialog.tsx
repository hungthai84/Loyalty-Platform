import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useFirebase } from "@/components/FirebaseProvider";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { X, Plus, Trash2, Sliders, Palette, Zap, Edit2, Shield, Medal, Award, Crown, Gem, CheckCircle2, ChevronRight, Info, Star, Users, TrendingUp, History as HistoryIcon } from "lucide-react";
import * as motion from "motion/react-client";
import { TierConfig, TierCondition, AttributeDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface TierConfigDialogProps {
  onClose: () => void;
  tier?: TierConfig;
  availableRules?: { id: string; name: string; rewardType: string }[];
}

const CONDITION_FIELDS = [
  { value: "points", label: "Tổng điểm (Điểm)" },
  { value: "spend", label: "Tổng chi tiêu (VND)" },
  { value: "orders", label: "Số lượng đơn hàng" },
  { value: "avg_order_value", label: "Giá trị đơn trung bình" },
  { value: "referrals", label: "Số lượt giới thiệu" },
  { value: "days_since_join", label: "Số ngày tham gia" },
  { value: "purchase_frequency", label: "Tần suất mua (ngày/đơn)" },
  { value: "custom_attribute", label: "Thuộc tính tùy chỉnh" },
];

const OPERATORS = [
  { value: "gte", label: ">= (Lớn hơn hoặc bằng)" },
  { value: "gt", label: "> (Lớn hơn)" },
  { value: "eq", label: "= (Bằng)" },
  { value: "lte", label: "<= (Nhỏ hơn hoặc bằng)" },
  { value: "lt", label: "< (Nhỏ hơn)" },
];

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
];

export function TierConfigDialog({ onClose, tier, availableRules }: TierConfigDialogProps) {
  const { user } = useFirebase();
  const [isEditing, setIsEditing] = useState(!tier);
  const [name, setName] = useState(tier?.name || "");
  const [threshold, setThreshold] = useState(tier?.threshold || 0);
  const [multiplier, setMultiplier] = useState(tier?.multiplier || 1);
  const [description, setDescription] = useState(tier?.description || "");
  const [maintenanceDays, setMaintenanceDays] = useState(tier?.maintenanceDays || 365);
  const [color, setColor] = useState(tier?.color || PRESET_COLORS[0]);
  const [conditions, setConditions] = useState<TierCondition[]>(
    tier?.conditions || [],
  );
  const [benefits, setBenefits] = useState<{name: string, value: string}[]>(
    tier?.benefits || []
  );
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cài đặt điều kiện giữa cấp (Upgrades/Maintenance)
  const [minDaysInPrevTier, setMinDaysInPrevTier] = useState<number>(tier?.minDaysInPrevTier || 0);
  const [minSpendInPrevTier, setMinSpendInPrevTier] = useState<number>(tier?.minSpendInPrevTier || 0);
  const [minOrdersInPrevTier, setMinOrdersInPrevTier] = useState<number>(tier?.minOrdersInPrevTier || 0);
  const [transitionUpgradeMatchType, setTransitionUpgradeMatchType] = useState<'and' | 'or'>(tier?.transitionUpgradeMatchType || 'and');
  const [enablePrevTierUpgradeConditions, setEnablePrevTierUpgradeConditions] = useState<boolean>(tier?.enablePrevTierUpgradeConditions || false);

  const [maxInactivityDaysBeforeDowngrade, setMaxInactivityDaysBeforeDowngrade] = useState<number>(tier?.maxInactivityDaysBeforeDowngrade || 0);
  const [minSpendToMaintain, setMinSpendToMaintain] = useState<number>(tier?.minSpendToMaintain || 0);
  const [minOrdersToMaintain, setMinOrdersToMaintain] = useState<number>(tier?.minOrdersToMaintain || 0);
  const [enablePrevTierMaintenanceConditions, setEnablePrevTierMaintenanceConditions] = useState<boolean>(tier?.enablePrevTierMaintenanceConditions || false);

  const [allTiers, setAllTiers] = useState<TierConfig[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.isLocal) {
      import("@/data/guestData").then(({ getGuestTiers }) => {
        setAllTiers(getGuestTiers());
      });
      return;
    }
    const q = query(collection(db, "tier_configs"), orderBy("threshold", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAllTiers(snap.docs.map(d => ({ ...d.data(), id: d.id } as TierConfig)));
    });
    return () => unsubscribe();
  }, [user]);

  // Find previous tier based on threshold
  const prevTier = allTiers
    .filter(t => t.id !== (tier?.id || ""))
    .sort((a, b) => a.threshold - b.threshold)
    .reverse()
    .find(t => t.threshold < threshold);

  useEffect(() => {
    if (!user || user.isLocal) return;

    const q = query(collection(db, "attribute_definitions"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAttributes(snap.docs.map((d) => d.data() as AttributeDefinition));
      },
      (error) => {
        console.error("Error loading attributes:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "points", operator: "gte", value: 0 },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<TierCondition>) => {
    setConditions(
      conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  };

  const addBenefit = () => {
    setBenefits([...benefits, { name: "", value: "" }]);
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (index: number, name: string, value: string) => {
    setBenefits(
      benefits.map((b, i) => (i === index ? { name, value } : b))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Vui lòng nhập tên hạng");

    setSubmitting(true);
    const id = tier?.id || `TIER-${Date.now()}`;
    const path = `tier_configs/${id}`;

    const tierData = {
      id,
      name,
      description,
      threshold: Number(threshold),
      multiplier: Number(multiplier),
      maintenanceDays: Number(maintenanceDays),
      color,
      conditions,
      benefits: benefits.filter(b => b.name.trim() !== ""),
      userId: user.uid,
      // Cấu hình điều kiện giữa cấp (Upgrades/Maintenance)
      minDaysInPrevTier: Number(minDaysInPrevTier),
      minSpendInPrevTier: Number(minSpendInPrevTier),
      minOrdersInPrevTier: Number(minOrdersInPrevTier),
      transitionUpgradeMatchType,
      enablePrevTierUpgradeConditions,
      maxInactivityDaysBeforeDowngrade: Number(maxInactivityDaysBeforeDowngrade),
      minSpendToMaintain: Number(minSpendToMaintain),
      minOrdersToMaintain: Number(minOrdersToMaintain),
      enablePrevTierMaintenanceConditions,
    };

    try {
      if (user.isLocal) {
        const { saveGuestTier } = await import("@/data/guestData");
        saveGuestTier({
          ...tierData,
          createdAt: tier?.createdAt || new Date()
        } as any);
      } else {
        await setDoc(doc(db, path), {
          ...tierData,
          createdAt: tier?.createdAt || serverTimestamp(),
        });
      }
      toast.success(tier ? "Đã cập nhật cấu hình hạng và quy tắc chuyển cấp" : "Đã tạo hạng mới thành công");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "tiers" } }),
      );
      onClose();
    } catch (error) {
      if (!user.isLocal) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.error("Không thể lưu cấu hình");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !tier) return;
    if (!confirm("Bạn có chắc chắn muốn xóa hạng này không?")) return;

    try {
      if (user.isLocal) {
        const { getGuestTiers, setLocalStorageData } = await import("@/data/guestData");
        const currentTiers = getGuestTiers();
        const updated = currentTiers.filter(t => t.id !== tier.id);
        setLocalStorageData("crm_guest_tiers_v6", updated);
      } else {
        const path = `tier_configs/${tier.id}`;
        await deleteDoc(doc(db, path));
      }
      toast.success("Đã xóa hạng");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "tiers" } }),
      );
      onClose();
    } catch (error) {
      if (!user.isLocal) {
        handleFirestoreError(error, OperationType.DELETE, `tier_configs/${tier.id}`);
      }
      toast.error("Không thể xóa hạng");
    }
  };

  const nameLower = (tier?.name || name).toLowerCase();
  let TierIcon = Star;
  if (nameLower.includes("member")) TierIcon = Shield;
  else if (nameLower.includes("essential") || nameLower.includes("silver")) TierIcon = Medal;
  else if (nameLower.includes("icon") || nameLower.includes("gold") || nameLower.includes("vip")) TierIcon = Award;
  else if (nameLower.includes("atelier") || nameLower.includes("platinum")) TierIcon = Gem;
  else if (nameLower.includes("royal") || nameLower.includes("diamond")) TierIcon = Crown;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[10px] overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: isEditing ? color : (tier?.color || color) }}
            >
              <TierIcon className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold font-heading">
                {isEditing 
                  ? (tier ? "Chỉnh sửa Cấp bậc" : "Tạo Cấp bậc mới")
                  : `Hạng ${tier?.name}`
                }
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                {isEditing ? "Cấu hình quy tắc và đặc quyền" : "Thông tin chi tiết cấp bậc hội viên"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-primary/10 text-primary rounded-[10px] transition-all flex items-center gap-2 text-xs font-bold mr-2 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Tên hạng
                </label>
                <input
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="v.d. Diamond Elite"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Hệ số tích lũy (x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none "
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Mô tả cấp bậc
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả về đối tượng khách hàng của hạng này..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Chu kỳ duy trì hạng (Ngày)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none"
                  value={maintenanceDays}
                  onChange={(e) => setMaintenanceDays(Number(e.target.value))}
                  placeholder="v.d. 365"
                />
              </div>
            </div>

            <div className="space-y-4 text-left">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" /> Màu đại diện Hạng
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all cursor-pointer",
                      color === c
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent scale-100",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Điều kiện Thăng hạng động
                </label>
                <button
                  type="button"
                  onClick={addCondition}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Thêm điều kiện
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted/30 rounded-[10px] border border-border space-y-2">
                  <p className="text-xs font-medium">
                    Ngưỡng điểm mặc định (để hiển thị dashboard)
                  </p>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-background border border-border rounded-[10px] outline-none "
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  />
                </div>

                {conditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 p-4 bg-background border border-border rounded-[10px] relative group"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        className="bg-muted px-3 py-2 rounded-[10px] text-sm border-none outline-none"
                        value={condition.field}
                        onChange={(e) =>
                          updateCondition(idx, { field: e.target.value as any })
                        }
                      >
                        {CONDITION_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="bg-muted px-3 py-2 rounded-[10px] text-sm border-none outline-none"
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(idx, {
                            operator: e.target.value as any,
                          })
                        }
                      >
                        {OPERATORS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <input
                          className="w-full px-3 py-2 bg-muted rounded-[10px] text-sm outline-none"
                          type={
                            condition.field === "custom_attribute"
                              ? "text"
                              : "number"
                          }
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(idx, { value: e.target.value })
                          }
                        />
                      </div>

                      {condition.field === "custom_attribute" && (
                        <div className="md:col-span-3 mt-1">
                          <select
                            className="w-full bg-muted/50 px-3 py-2 rounded-[10px] text-xs font-bold uppercase border-none outline-none"
                            value={condition.attributeKey || ""}
                            onChange={(e) =>
                              updateCondition(idx, {
                                attributeKey: e.target.value,
                              })
                            }
                          >
                            <option value="">Chọn thuộc tính tùy chỉnh...</option>
                            {attributes.map((attr) => (
                              <option key={attr.id} value={attr.key}>
                                {attr.label} ({attr.key})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {conditions.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-border rounded-[10px] text-muted-foreground text-sm">
                    Chỉ sử dụng ngưỡng điểm cơ bản để thăng hạng.
                  </div>
                )}
              </div>
            </div>

            {/* THIẾT LẬP NÂNG CAO: QUY TẮC CHUYỂN CẤP */}
            <div className="p-5 border border-border/80 bg-muted/10 rounded-[10px] space-y-5 text-left">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2f6cf5]" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Điều kiện chuyển cấp ({prevTier ? `${prevTier.name} ➔ ${name || "Hạng hiện tại"}` : "Hạng tiêu chuẩn"})
                </h4>
              </div>

              {!prevTier ? (
                <div className="p-4 bg-muted/40 rounded-[10px] border border-border text-xs text-muted-foreground">
                  ✨ Đây là hạng hội viên thấp nhất (Cấp tiêu chuẩn). Khách hàng sẽ mặc định đạt hạng này mà không cần thoả mãn điều kiện chuyển cấp từ bất kỳ phân hạng nào thấp hơn.
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Thiết lập các điều kiện ràng buộc giữa hai phân hạng <strong>{prevTier.name}</strong> và <strong>{name || "Hạng hiện tại"}</strong> để cá nhân hoá hành trình nâng/giữ cấp độ của khách hàng.
                  </p>

                  {/* 1. LUẬT THĂNG CẤP */}
                  <div className="border border-border rounded-[10px] bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">1. Quy tắc nâng cấp (Upgrade Rules)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={enablePrevTierUpgradeConditions} 
                          onChange={(e) => setEnablePrevTierUpgradeConditions(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-2 text-xs font-bold text-muted-foreground peer-checked:text-emerald-500">Kích hoạt</span>
                      </label>
                    </div>

                    {enablePrevTierUpgradeConditions && (
                      <div className="space-y-4 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Số ngày giữ hạng tối thiểu ở {prevTier.name}</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 30"
                              value={minDaysInPrevTier || ""}
                              onChange={(e) => setMinDaysInPrevTier(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Khách hàng buộc phải ở hạng cũ tối thiểu bấy nhiêu ngày trước khi thăng cấp.</p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Doanh thu phát sinh thêm ở {prevTier.name} (VND)</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 5000000"
                              value={minSpendInPrevTier || ""}
                              onChange={(e) => setMinSpendInPrevTier(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Tổng chi tiêu phát sinh kể từ ngày đạt hạng {prevTier.name}.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Số đơn mua thành công khi ở {prevTier.name}</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 3"
                              value={minOrdersInPrevTier || ""}
                              onChange={(e) => setMinOrdersInPrevTier(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Yêu cầu tần suất mua tối thiểu khi đang giữ hạng trước.</p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Kiểu khớp điều kiện</label>
                            <select
                              className="w-full px-4 py-3 bg-muted border border-border rounded-[10px] text-xs font-bold outline-none"
                              value={transitionUpgradeMatchType}
                              onChange={(e) => setTransitionUpgradeMatchType(e.target.value as any)}
                            >
                              <option value="and">Thỏa mãn TẤT CẢ tiêu chí trên (AND)</option>
                              <option value="or">Chỉ cần thỏa mãn MỘT trong các tiêu chí (OR)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. LUẬT DUY TRÌ & HẠ CẤP */}
                  <div className="border border-border rounded-[10px] bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">2. Quy tắc duy trì & giáng cấp (Demotion Rules)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={enablePrevTierMaintenanceConditions} 
                          onChange={(e) => setEnablePrevTierMaintenanceConditions(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                        <span className="ml-2 text-xs font-bold text-muted-foreground peer-checked:text-rose-500">Kích hoạt</span>
                      </label>
                    </div>

                    {enablePrevTierMaintenanceConditions && (
                      <div className="space-y-4 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Thời gian không hoạt động tối đa (Ngày)</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 180"
                              value={maxInactivityDaysBeforeDowngrade || ""}
                              onChange={(e) => setMaxInactivityDaysBeforeDowngrade(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Hạ về cấp {prevTier.name} nếu không có giao dịch mới sau số ngày này.</p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Doanh thu cần duy trì tối thiểu (VND)</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 2000000"
                              value={minSpendToMaintain || ""}
                              onChange={(e) => setMinSpendToMaintain(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Chi tiêu tối thiểu trong chu kỳ để tránh bị hạ hạng.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase">Số đơn mua tối thiểu để giữ hạng</label>
                            <input 
                              type="number"
                              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-[10px] text-xs font-bold outline-none focus:bg-background transition-colors"
                              placeholder="v.d. 2"
                              value={minOrdersToMaintain || ""}
                              onChange={(e) => setMinOrdersToMaintain(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-muted-foreground">Số đơn giao dịch tối thiểu cần tích luỹ trong kỳ.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold uppercase tracking-widest text-[#2f6cf5] flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Tuyến đặc quyền (Benefits)
                </label>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Thêm đặc quyền
                </button>
              </div>
              
              <div className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex gap-2 p-3 bg-background border border-border rounded-[10px] relative group items-center">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        className="w-full px-3 py-2 bg-muted rounded-[10px] text-sm outline-none font-bold"
                        value={benefit.name}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const rule = availableRules?.find(r => r.name === selectedName);
                          updateBenefit(idx, selectedName, rule ? `Thuộc loại: ${rule.rewardType}` : benefit.value);
                        }}
                      >
                        <option value="">Chọn ưu đãi hoặc nhập tên...</option>
                        {availableRules?.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                        {benefit.name && !availableRules?.find(r => r.name === benefit.name) && (
                          <option value={benefit.name}>{benefit.name}</option>
                        )}
                      </select>
                      <input
                        className="w-full px-3 py-2 bg-muted rounded-[10px] text-sm outline-none"
                        placeholder="Ghi chú thêm (VD: Giảm 5%)"
                        value={benefit.value}
                        onChange={(e) => updateBenefit(idx, benefit.name, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {benefits.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-border rounded-[10px] text-muted-foreground text-sm">
                    Cấp bậc này chưa có cấu hình đặc quyền cụ thể.
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          /* DETAIL VIEW */
          <div className="overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar text-left bg-background/50">
            {/* Header info card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-card border border-border shadow-sm rounded-[10px] flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg mb-1" style={{ backgroundColor: tier?.color }}>
                  <TierIcon className="w-6 h-6 fill-current" />
                </div>
                <h4 className="text-xl font-black text-foreground">{tier?.name}</h4>
                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${tier?.color}15`, color: tier?.color }}>
                  Hạng Hội Viên
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="p-5 bg-card border border-border shadow-sm rounded-[10px] flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Ngưỡng thăng hạng</span>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">{tier?.threshold.toLocaleString()}</span>
                      <span className="text-xs font-bold text-muted-foreground">pts</span>
                   </div>
                </div>
                <div className="p-5 bg-card border border-border shadow-sm rounded-[10px] flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Hệ số tích lũy</span>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-foreground">x{tier?.multiplier}</span>
                      <span className="text-xs font-bold text-muted-foreground">multiplier</span>
                   </div>
                </div>
              </div>
            </div>

            {tier?.description && (
              <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-[10px] text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Mô tả cấp bậc</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{tier.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-[10px] border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Thời hạn duy trì</span>
                </div>
                <span className="text-sm font-black text-foreground">{tier?.maintenanceDays} Ngày</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CONDITIONS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 px-1">
                  <Sliders className="w-4 h-4 text-primary" /> Điều kiện thăng hạng
                </h4>
                <div className="bg-card border border-border rounded-[10px] p-2 space-y-1">
                  {tier?.conditions && tier.conditions.length > 0 ? (
                    tier.conditions.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-[8px] hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                           </div>
                           <span className="text-xs font-bold text-muted-foreground">
                             {CONDITION_FIELDS.find(f => f.value === c.field)?.label}
                           </span>
                        </div>
                        <span className="text-xs font-black text-foreground">
                          {c.operator === 'gte' ? '≥' : c.operator === 'gt' ? '>' : c.operator === 'eq' ? '=' : c.operator === 'lte' ? '≤' : '<'} {c.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center space-y-2 opacity-60">
                      <Star className="w-8 h-8 mx-auto text-muted-foreground/30" />
                      <p className="text-[11px] font-medium text-muted-foreground">Áp dụng ngưỡng điểm cơ bản duy nhất</p>
                    </div>
                  )}
                </div>
              </div>

              {/* BENEFITS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 px-1">
                  <Award className="w-4 h-4 text-amber-500" /> Đặc quyền hội viên
                </h4>
                <div className="bg-card border border-border rounded-[10px] p-2 space-y-1">
                  {tier?.benefits && tier.benefits.length > 0 ? (
                    tier.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-[8px] hover:bg-muted/50 transition-colors group">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{b.value}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center space-y-2 opacity-60">
                      <Zap className="w-8 h-8 mx-auto text-muted-foreground/30" />
                      <p className="text-[11px] font-medium text-muted-foreground">Chưa cấu hình đặc quyền</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DISPLAY READ-ONLY TRANSITION CONDITIONS */}
            <div className="p-5 border border-border bg-card rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Sliders className="w-4 h-4 text-[#2f6cf5]" />
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">
                  Quy tắc chuyển cấp ({prevTier ? `${prevTier.name} ➔ ${tier?.name}` : "Hạng đầu tiên"})
                </h4>
              </div>

              {!prevTier ? (
                <p className="text-[11px] font-medium text-muted-foreground italic">
                  ✨ Đây là cấp độ chào mừng đầu tiên. Mọi khách hàng tham gia chương trình đều mặc định khởi đầu ở hạng này.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Upgrade conditions read-only */}
                  <div className="space-y-2 md:border-r md:border-border/40 md:pr-4">
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <TrendingUp className="w-3.5 h-3.5" /> Điều kiện thăng cấp từ {prevTier.name}
                    </p>
                    {tier?.enablePrevTierUpgradeConditions ? (
                      <div className="space-y-1.5">
                        {tier.minDaysInPrevTier ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Giữ hạng {prevTier.name} tối thiểu:</span>
                            <span className="font-black text-foreground">{tier.minDaysInPrevTier} ngày</span>
                          </div>
                        ) : null}
                        {tier.minSpendInPrevTier ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Doanh thu phát sinh tại {prevTier.name}:</span>
                            <span className="font-black text-foreground">{Number(tier.minSpendInPrevTier).toLocaleString()} ₫</span>
                          </div>
                        ) : null}
                        {tier.minOrdersInPrevTier ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Đơn hàng phát sinh tại {prevTier.name}:</span>
                            <span className="font-black text-foreground">{tier.minOrdersInPrevTier} đơn</span>
                          </div>
                        ) : null}
                        <div className="pt-1 text-[10px] text-muted-foreground italic">
                          * Phương pháp ghép: <strong className="text-foreground uppercase">{tier.transitionUpgradeMatchType === 'or' ? "Thoả mãn 1 trong các điều kiện" : "Thoả mãn ĐỒNG THỜI toàn bộ"}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-[11px] pt-1">Thăng hạng tự động ngay khi đạt ngưỡng {tier?.threshold.toLocaleString()} điểm lý thuyết.</p>
                    )}
                  </div>

                  {/* Demotion/Maintenance conditions read-only */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <HistoryIcon className="w-3.5 h-3.5" /> Điều kiện duy trì & tránh hạ cấp
                    </p>
                    {tier?.enablePrevTierMaintenanceConditions ? (
                      <div className="space-y-1.5">
                        {tier.maxInactivityDaysBeforeDowngrade ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Giới hạn không mua sắm:</span>
                            <span className="font-black text-foreground">{tier.maxInactivityDaysBeforeDowngrade} ngày</span>
                          </div>
                        ) : null}
                        {tier.minSpendToMaintain ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Chi tiêu duy trì tối thiểu:</span>
                            <span className="font-black text-foreground">{Number(tier.minSpendToMaintain).toLocaleString()} ₫</span>
                          </div>
                        ) : null}
                        {tier.minOrdersToMaintain ? (
                          <div className="flex justify-between py-1 border-b border-border/30">
                            <span className="text-muted-foreground">Tổng số đơn hàng duy trì:</span>
                            <span className="font-black text-foreground">{tier.minOrdersToMaintain} đơn</span>
                          </div>
                        ) : null}
                        <div className="pt-1 text-[10px] text-rose-500/80 italic leading-snug">
                          * Hạ cấp về hạng {prevTier.name} nếu không đạt các yêu cầu duy trì trên.
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic text-[11px] pt-1">Giữ hạng theo chu kỳ duy trì mặc định ({tier?.maintenanceDays} ngày).</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
               <div className="p-4 bg-[#2f6cf5]/5 border border-[#2f6cf5]/10 rounded-[10px] flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#2f6cf5] shrink-0" />
                  <p className="text-[11px] text-[#2f6cf5] font-medium leading-relaxed">
                    Hệ thống tự động đồng bộ hóa đặc quyền và xếp hạng khách hàng theo thời gian thực dựa trên hành vi mua sắm.
                  </p>
               </div>
            </div>
          </div>
        )}

        <div className="p-8 border-t border-border flex items-center justify-between bg-muted/10">
          {isEditing ? (
            <>
              {tier ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-[10px] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => tier ? setIsEditing(false) : onClose()}
                  className="px-8 py-3 border border-border rounded-[10px] text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-10 py-3 bg-primary text-primary-foreground rounded-[10px] text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center cursor-pointer"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {submitting ? "Đang xác thực..." : "Lưu cấp bậc"}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
               <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hệ thống sẵn sàng</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#2f6cf5]" /> Đồng bộ Real-time</span>
               </div>
               <button
                  onClick={onClose}
                  className="px-10 py-3 bg-foreground text-background rounded-[10px] text-sm font-bold hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Đóng cửa sổ <ChevronRight className="w-4 h-4" />
                </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
