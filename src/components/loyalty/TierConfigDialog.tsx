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
} from "firebase/firestore";
import { useFirebase } from "@/components/FirebaseProvider";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { X, Plus, Trash2, Sliders, Palette, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import { TierConfig, TierCondition, AttributeDefinition } from "@/types";
import { cn } from "@/lib/utils";

interface TierConfigDialogProps {
  onClose: () => void;
  tier?: TierConfig;
}

const CONDITION_FIELDS = [
  { value: "points", label: "Tổng điểm (PTS)" },
  { value: "spend", label: "Tổng chi tiêu ($)" },
  { value: "orders", label: "Số lượng đơn hàng" },
  { value: "referrals", label: "Số lượt giới thiệu" },
  { value: "days_since_join", label: "Số ngày tham gia" },
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

export function TierConfigDialog({ onClose, tier }: TierConfigDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState(tier?.name || "");
  const [threshold, setThreshold] = useState(tier?.threshold || 0);
  const [multiplier, setMultiplier] = useState(tier?.multiplier || 1);
  const [color, setColor] = useState(tier?.color || PRESET_COLORS[0]);
  const [conditions, setConditions] = useState<TierCondition[]>(
    tier?.conditions || [],
  );
  const [benefits, setBenefits] = useState<{name: string, value: string}[]>(
    tier?.benefits || []
  );
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

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

    try {
      await setDoc(doc(db, path), {
        id,
        name,
        threshold: Number(threshold),
        multiplier: Number(multiplier),
        color,
        conditions,
        benefits: benefits.filter(b => b.name.trim() !== ""),
        userId: user.uid,
        createdAt: tier?.createdAt || serverTimestamp(),
      });
      toast.success(tier ? "Đã cập nhật cấu hình hạng" : "Đã tạo hạng mới");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "tiers" } }),
      );
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Không thể lưu cấu hình");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !tier) return;
    if (!confirm("Bạn có chắc chắn muốn xóa hạng này không?")) return;

    const path = `tier_configs/${tier.id}`;
    try {
      await deleteDoc(doc(db, path));
      toast.success("Đã xóa hạng");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "tiers" } }),
      );
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div>
            <h3 className="text-xl font-bold font-heading">
              {tier ? "Cấu hình Hạng VIP" : "Tạo Hạng VIP mới"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xác định đặc quyền và điều kiện thăng hạng động.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar"
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Tên hạng
              </label>
              <input
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
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
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none "
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4">
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
                    "w-10 h-10 rounded-full border-2 transition-all",
                    color === c
                      ? "border-foreground scale-110 shadow-lg"
                      : "border-transparent scale-100",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Điều kiện Thăng hạng động
              </label>
              <button
                type="button"
                onClick={addCondition}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Thêm điều kiện
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2">
                <p className="text-xs font-medium">
                  Ngưỡng điểm mặc định (để hiển thị dashboard)
                </p>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg outline-none "
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
              </div>

              {conditions.map((condition, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 p-4 bg-background border border-border rounded-2xl relative group"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      className="bg-muted px-3 py-2 rounded-lg text-sm border-none outline-none"
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
                      className="bg-muted px-3 py-2 rounded-lg text-sm border-none outline-none"
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
                        className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none"
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
                          className="w-full bg-muted/50 px-3 py-2 rounded-lg text-xs font-bold uppercase border-none outline-none"
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
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {conditions.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                  Chỉ sử dụng ngưỡng điểm cơ bản để thăng hạng.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" /> Tuyến ưu đãi (Benefits)
              </label>
              <button
                type="button"
                onClick={addBenefit}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Thêm ưu đãi
              </button>
            </div>
            
            <div className="space-y-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-2 p-3 bg-background border border-border rounded-2xl relative group items-center">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none font-bold"
                      placeholder="Tên chương trình (VD: Welcome Voucher)"
                      value={benefit.name}
                      onChange={(e) => updateBenefit(idx, e.target.value, benefit.value)}
                    />
                    <input
                      className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none"
                      placeholder="Nội dung ưu đãi (VD: Giảm 5%)"
                      value={benefit.value}
                      onChange={(e) => updateBenefit(idx, benefit.name, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBenefit(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {benefits.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                  Cấp bậc này chưa có cấu hình ưu đãi cụ thể.
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-border flex items-center justify-between bg-muted/10">
          {tier ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-10 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              {submitting ? "Đang xác thực..." : "Lưu cấp bậc"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
