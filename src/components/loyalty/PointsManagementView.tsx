import React, { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  RefreshCw,
  Award,
  TrendingUp,
  CircleDollarSign,
  MousePointerClick,
  ShoppingBag,
  Save,
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { EarnRule } from "@/types";
import { LoyaltyPointsBanner } from "./LoyaltyPointsBanner";
import { Input } from "@/components/ui/input";
import { serverTimestamp, addDoc } from "firebase/firestore";

const EARN_ICON_MAP: Record<string, any> = {
  transaction: ShoppingBag,
  action: MousePointerClick,
  referral: TrendingUp,
  birthday: Award,
  special: Zap,
};

const EARN_STYLE_MAP: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  transaction: { 
    bg: "bg-blue-500/5", 
    text: "text-blue-500", 
    border: "border-blue-500/10 hover:border-blue-500/30", 
    accent: "bg-blue-500" 
  },
  action: { 
    bg: "bg-emerald-500/5", 
    text: "text-emerald-500", 
    border: "border-emerald-500/10 hover:border-emerald-500/30", 
    accent: "bg-emerald-500" 
  },
  referral: { 
    bg: "bg-purple-500/5", 
    text: "text-purple-500", 
    border: "border-purple-500/10 hover:border-purple-500/30", 
    accent: "bg-purple-500" 
  },
  birthday: { 
    bg: "bg-rose-500/5", 
    text: "text-rose-500", 
    border: "border-rose-500/10 hover:border-rose-500/30", 
    accent: "bg-rose-500" 
  },
  special: { 
    bg: "bg-amber-500/5", 
    text: "text-amber-500", 
    border: "border-amber-500/10 hover:border-amber-500/30", 
    accent: "bg-amber-500" 
  },
};

const DEFAULT_STYLE = { 
  bg: "bg-slate-500/5", 
  text: "text-slate-500", 
  border: "border-slate-500/10 hover:border-slate-500/30", 
  accent: "bg-slate-500" 
};

interface PointsManagementViewProps {
  onEditRule: (rule: EarnRule) => void;
  onAddRule: () => void;
}

export function PointsManagementView({ onEditRule, onAddRule }: PointsManagementViewProps) {
  const { user } = useFirebase();
  const [rules, setRules] = useState<EarnRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [autoRulePoints, setAutoRulePoints] = useState(50);
  const [autoRuleSpend, setAutoRuleSpend] = useState(1000000);
  const [isSubmittingAuto, setIsSubmittingAuto] = useState(false);

  const handleCreateAutoRule = async () => {
    if (autoRulePoints <= 0 || autoRuleSpend <= 0) {
      toast.error("Vui lòng nhập giá trị hợp lệ");
      return;
    }
    setIsSubmittingAuto(true);
    const ruleName = `Tặng ${autoRulePoints} điểm khi chi tiêu trên ${autoRuleSpend.toLocaleString()} VND`;
    
    const ruleData: any = {
      name: ruleName,
      description: `Tự động cộng ${autoRulePoints} điểm cho khách hàng khi tổng giá trị đơn hàng vượt ngưỡng ${autoRuleSpend.toLocaleString()} VND.`,
      type: "purchase_value",
      points: Number(autoRulePoints),
      value: Number(autoRuleSpend),
      isActive: true,
      userId: user?.uid || "guest",
      createdAt: user?.isLocal ? new Date().toISOString() : serverTimestamp(),
    };

    try {
      if (user?.isLocal) {
        const id = "rule_" + Date.now();
        const updated = [{ ...ruleData, id } as EarnRule, ...rules];
        setRules(updated);
        localStorage.setItem("crm_guest_earn_rules_v1", JSON.stringify(updated));
      } else {
        await addDoc(collection(db, "earn_rules"), ruleData);
      }
      toast.success("Đã tạo quy tắc tự động thành công!");
      setShowAutoForm(false);
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tạo quy tắc");
    } finally {
      setIsSubmittingAuto(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.isLocal) {
      const stored = localStorage.getItem("crm_guest_earn_rules_v1");
      if (stored) {
        try {
          setRules(JSON.parse(stored));
        } catch (e) {
          setRules([]);
        }
      }
      setLoading(false);
      return;
    }

    const path = "earn_rules";
    const q = query(collection(db, path), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EarnRule[];
        setRules(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quy tắc "${name}"?`)) return;

    if (user?.isLocal) {
      const updated = rules.filter(r => r.id !== id);
      setRules(updated);
      localStorage.setItem("crm_guest_earn_rules_v1", JSON.stringify(updated));
      toast.success("Đã xóa quy tắc");
    } else {
      try {
        await deleteDoc(doc(db, "earn_rules", id));
        toast.success("Đã xóa quy tắc");
      } catch (e) {
        toast.error("Lỗi khi xóa quy tắc");
      }
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || rule.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <LoyaltyPointsBanner onAddRule={onAddRule} />
      
      {/* Automated Reward Rules Form */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-[10px] p-5 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white shadow-xs rounded-[10px] text-amber-500">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Quy tắc tự động quản trị</h4>
              <p className="text-[11px] text-muted-foreground font-medium">Thiết lập nhanh các mốc tặng thưởng điểm khi đạt giá trị chi tiêu.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAutoForm(!showAutoForm)}
            className={cn(
              "px-4 py-2 rounded-[10px] text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-xs",
              showAutoForm 
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20" 
                : "bg-white hover:bg-muted border-border text-foreground"
            )}
          >
            {showAutoForm ? "Đóng thiết lập" : "Cấu hình ngay"}
            <Plus className={cn("w-3.5 h-3.5 transition-transform", showAutoForm && "rotate-45")} />
          </button>
        </div>

        <AnimatePresence>
          {showAutoForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-amber-500/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 flex flex-col items-start">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Tặng (Điểm)</label>
                  <div className="relative w-full">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <Input
                      type="number"
                      value={autoRulePoints}
                      onChange={(e) => setAutoRulePoints(Number(e.target.value))}
                      className="pl-9 bg-white border-amber-500/20 focus:border-amber-500 h-10 text-sm font-bold"
                      placeholder="v.d. 50"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5 flex flex-col items-start">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider ml-1">Khi chi tiêu trên (VND)</label>
                  <div className="relative w-full">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type="number"
                      value={autoRuleSpend}
                      onChange={(e) => setAutoRuleSpend(Number(e.target.value))}
                      className="pl-9 bg-white border-amber-500/20 focus:border-amber-500 h-10 text-sm font-bold"
                      placeholder="v.d. 1.000.000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAutoForm(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCreateAutoRule}
                  disabled={isSubmittingAuto}
                  className="px-6 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-[10px] text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAuto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Lưu & Áp dụng ngay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Utilities */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between px-1">
        <div className="text-left">
          <h5 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest">
            Danh sách quy tắc tích lũy ({filteredRules.length})
          </h5>
          <p className="text-xs text-muted-foreground">
            Cấu hình các kịch bản tặng thưởng điểm linh hoạt
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm quy tắc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[10px] text-xs outline-none focus:border-amber-500/50 text-foreground"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-[10px] px-2.5 py-1.5 text-xs outline-none focus:border-amber-500/50 text-foreground font-medium"
          >
            <option value="all">Tất cả loại</option>
            <option value="transaction">Giao dịch</option>
            <option value="action">Hành động</option>
            <option value="referral">Giới thiệu</option>
            <option value="birthday">Sinh nhật</option>
            <option value="special">Đặc biệt</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground italic bg-card border border-border rounded-[10px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          Đang tải quy tắc...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-[10px] space-y-4 bg-muted/5">
          <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-bold text-muted-foreground">
              Chưa tìm thấy quy tắc tích điểm nào.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Bắt đầu tạo quy tắc mới để khách hàng có thể tích lũy điểm thưởng.
            </p>
          </div>
          <button
            onClick={onAddRule}
            className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-[10px] text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Tạo quy tắc mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRules.map((rule) => {
            const style = EARN_STYLE_MAP[rule.type] || DEFAULT_STYLE;
            const Icon = EARN_ICON_MAP[rule.type] || Zap;
            
            return (
              <motion.div
                layout
                key={rule.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group h-full"
              >
                <Card className={cn(
                  "h-full p-0 border bg-card overflow-hidden rounded-[10px] flex flex-col shadow-sm transition-all duration-300",
                  style.border
                )}>
                  {/* Card Header Color Strip */}
                  <div className={cn("h-1.5 w-full", style.accent)} />
                  
                  <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4 text-left">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={cn("p-2.5 rounded-[10px]", style.bg, style.text)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            rule.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                          )} />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                            {rule.isActive ? "Đang chạy" : "Tạm dừng"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {rule.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 h-[32px]">
                          {rule.type === 'transaction' 
                            ? `Tích lũy từ chi tiêu hóa đơn với tỷ lệ cấu hình đặc thù.` 
                            : rule.type === 'action' 
                              ? `Tặng điểm ngay khi khách hàng thực hiện hành động tương tác.`
                              : `Quy tắc tích điểm dành cho các trường hợp cụ thể.`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/40 rounded-[10px] border border-border/40">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Ghi nhận</span>
                          <span className="text-sm font-black text-foreground">
                            {rule.type === 'transaction' ? 'Theo hóa đơn' : 'Cố định'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-amber-600 uppercase opacity-70">Reward</span>
                          <span className="text-sm font-black text-amber-500">+{rule.points} pts</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => onEditRule(rule)}
                          className="p-2 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-[10px] transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="p-2 bg-background border border-border text-muted-foreground hover:text-red-500 hover:bg-red-50/10 rounded-[10px] transition-colors cursor-pointer"
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
  );
}
