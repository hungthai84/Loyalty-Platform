import React, { useState, useEffect } from "react";
import {
  Tag,
  Sparkles,
  Loader2,
  RefreshCw,
  Plus,
  Settings,
  Trash2,
  DollarSign,
  Clock,
  Search,
  Award,
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { Customer, SegmentationRule } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SegmentationRuleDialog } from "@/components/loyalty/SegmentationRuleDialog";
import { toast } from "sonner";
import { getGuestCustomers } from "@/data/guestData";

const COLOR_PRESET_MAP_SHORT: Record<string, string> = {
  gold: "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20",
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  sky: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  slate: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export function calculateInactivityDays(lastOrderDate: string | any): number | null {
  if (!lastOrderDate) return null;
  const date = typeof lastOrderDate === "string" ? new Date(lastOrderDate) : lastOrderDate.toDate();
  const diffTime = Math.abs(new Date().getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function filterCustomersByRule(customers: Customer[], rule: SegmentationRule) {
  return customers.filter((c) => {
    let matchValue = 0;
    if (rule.criteriaType === "total_spend") {
      matchValue = c.customFields?.spend || 0;
    } else if (rule.criteriaType === "points_balance") {
      matchValue = c.points || 0;
    } else if (rule.criteriaType === "time_since_last_purchase") {
      const days = calculateInactivityDays(c.lastOrderDate) || 0;
      matchValue = days;
    }

    switch (rule.operator) {
      case "gte": return matchValue >= rule.value;
      case "lte": return matchValue <= rule.value;
      case "gt": return matchValue > rule.value;
      case "lt": return matchValue < rule.value;
      case "eq": return matchValue === rule.value;
      default: return false;
    }
  });
}

export function SegmentationView() {
  return null;
  const { user } = useFirebase();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SegmentationRule | undefined>(undefined);
  const [viewingMetricsId, setViewingMetricsId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.isLocal) {
        setCustomers(getGuestCustomers());
    } else {
        const q = query(collection(db, "customers"));
        const unsub = onSnapshot(q, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer)));
        });
        return unsub;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user.isLocal) {
        const localRulesStr = localStorage.getItem("crm_guest_segmentation_v6");
        if (localRulesStr) {
            setSegmentationRules(JSON.parse(localRulesStr));
        }
        setLoadingRules(false);
    } else {
        const q = query(collection(db, "segmentation_rules"));
        const unsub = onSnapshot(q, (snapshot) => {
            setSegmentationRules(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SegmentationRule)));
            setLoadingRules(false);
        });
        return unsub;
    }
  }, [user]);

  const handleBootstrapRules = async () => {
    if (!user) return;
    const defaultRules: Partial<SegmentationRule>[] = [
      {
        name: "Khách VIP Đỉnh Cao (Whales)",
        criteriaType: "total_spend",
        operator: "gte",
        value: 50000000,
        tag: "VIP Whale",
        color: "amber",
        isActive: true,
        userId: user.uid,
      },
      {
        name: "Khách đang Ngủ đông (Churn Risk)",
        criteriaType: "time_since_last_purchase",
        operator: "gte",
        value: 90,
        tag: "Win-back",
        color: "rose",
        isActive: true,
        userId: user.uid,
      },
    ];

    setLoadingRules(true);
    try {
      if (user.isLocal) {
         let currentLocalRules = [...segmentationRules];
         for (const rule of defaultRules) {
             const newRule = { ...rule, id: "loc_seg_" + Date.now() + Math.random().toString(16).slice(2) };
             currentLocalRules.push(newRule as SegmentationRule);
         }
         localStorage.setItem("crm_guest_segmentation_v6", JSON.stringify(currentLocalRules));
         setSegmentationRules(currentLocalRules);
         toast.success("Khởi tạo bộ lọc mẫu thành công!");
      } else {
          const batch = writeBatch(db);
          defaultRules.forEach((rule) => {
            const docRef = doc(collection(db, "segmentation_rules"));
            batch.set(docRef, {
              ...rule,
              createdAt: serverTimestamp()
            });
          });
          await batch.commit();
          toast.success("Đã khởi tạo bộ lọc mẫu!");
      }
    } catch (e: any) {
      toast.error("Lỗi khởi tạo bộ lọc");
    } finally {
      setLoadingRules(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!user) return;
    if (confirm("Chắc chắn muốn xóa quy tắc này? Khách hàng sẽ không bị xóa tag cũ.")) {
      try {
        if (user.isLocal) {
            const currentLocalRules = segmentationRules.filter(r => r.id !== id);
            localStorage.setItem("crm_guest_segmentation_v6", JSON.stringify(currentLocalRules));
            setSegmentationRules(currentLocalRules);
            toast.success("Đã xóa quy tắc.");
        } else {
            await deleteDoc(doc(db, "segmentation_rules", id));
            toast.success("Đã xóa quy tắc!");
        }
      } catch (err: any) {
        toast.error("Không thể xóa quy tắc.");
      }
    }
  };

  const handleSyncTagsToCustomers = async () => {
    if (!user || customers.length === 0 || segmentationRules.length === 0) return;

    if (!confirm("Tiến trình này sẽ quét toàn bộ dữ liệu và gán thẻ động (Dynamic Tag) tương ứng dựa trên Điều kiện. Sẽ thay thế tất cả Tag động cũ.")) return;

    setSyncing(true);
    let updatedCount = 0;

    try {
        if (user.isLocal) {
            toast.info("Không thể đồng bộ tự động trong chế độ Demo.");
        } else {
            const batch = writeBatch(db);
            const activeRules = segmentationRules.filter(r => r.isActive);

            for (const cust of customers) {
                let dynamicSegments = [];

                for (const rule of activeRules) {
                    const match = filterCustomersByRule([cust], rule).length > 0;
                    if (match && rule.tag) {
                        dynamicSegments.push({ tag: rule.tag, color: rule.color });
                    }
                }

                const currentTags = cust.dynamicSegments || [];
                const isChanged = JSON.stringify(currentTags) !== JSON.stringify(dynamicSegments);

                if (isChanged) {
                    const pRef = doc(db, "customers", cust.id);
                    batch.update(pRef, {
                        ...cust,
                        dynamicSegments,
                        updatedAt: serverTimestamp(),
                    });
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                await batch.commit();
                toast.success(`Đã đồng bộ tự động gán Tag thành công cho ${updatedCount} khách hàng!`);
            } else {
                toast.info("Không có khách hàng nào thay đổi trạng thái trong lần quét này.");
            }
        }
    } catch (e: any) {
        toast.error("Lỗi đồng bộ Tags");
    } finally {
        setSyncing(false);
    }
  };

  const getMetricIcon = (type: string) => {
    if (type === "total_spend") return <DollarSign className="w-3 h-3" />;
    if (type === "points_balance") return <Award className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };
  const getMetricLabel = (type: string) => {
    if (type === "total_spend") return "Chi tiêu (VND)";
    if (type === "points_balance") return "Điểm tích lũy";
    return "Không mua sắm (ngày)";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-sidebar/50 border border-border/80 rounded-3xl backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold font-heading flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Nhóm Khách Hàng Dự Án
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Thiết lập tiêu chí để gán nhãn CRM khách hàng tự động hoặc upload danh sách thủ công.
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
              !customers ||
              customers.length === 0 ||
              segmentationRules.length === 0
            }
            className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              syncing
                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg shadow-emerald-500/30 cursor-pointer"
            }`}
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Đồng bộ quy tắc nhãn
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedRule(undefined);
              setShowRuleDialog(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Dự Án
          </button>
        </div>
      </div>

      {loadingRules ? (
        <div className="py-12 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          Đang tải nguyên tắc...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <div className="lg:col-span-4 grid gap-4 place-content-start">
            {segmentationRules.length === 0 ? (
              <Card className="p-12 border-2 border-dashed border-border/60 bg-sidebar/30 rounded-3xl text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Tag className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-2">
                  Chưa có Quy tắc Phân loại (Segmentation Rule) nào!
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  Quy tắc giúp CRM tự động gắn nhãn Trạng thái Khách hàng.
                </p>
                <button
                  onClick={handleBootstrapRules}
                  className="px-6 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Khởi tạo quy tắc mẫu
                </button>
              </Card>
            ) : (
              segmentationRules.map((rule) => {
                const colorClass = COLOR_PRESET_MAP_SHORT[rule.color || "gold"] || COLOR_PRESET_MAP_SHORT.gold;
                const isViewing = viewingMetricsId === rule.id;

                return (
                  <Card
                    key={rule.id}
                    className={`p-0 overflow-hidden border transition-all duration-300 rounded-3xl ${
                      isViewing
                        ? "border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20 -translate-y-0.5"
                        : "border-border/60 hover:border-border hover:shadow-sm"
                    }`}
                  >
                    <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="space-y-3 flex-1 w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground tracking-tight">
                                {rule.name}
                              </h4>
                              <span className={cn("px-2 py-0.5 text-[10px] uppercase font-black tracking-widest rounded flex items-center gap-1 border", colorClass)}>
                                {rule.tag}
                              </span>
                            </div>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm mt-0.5">
                                {rule.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setViewingMetricsId(isViewing ? null : rule.id)}
                              className={cn(
                                "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors border",
                                isViewing
                                  ? "bg-primary text-white border-transparent shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted border-border"
                              )}
                            >
                                {isViewing ? "Đóng Khám Phá" : "Inspect Filter"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRule(rule);
                                setShowRuleDialog(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="px-2 py-1 bg-muted/40 border text-muted-foreground font-bold rounded-lg flex items-center gap-1">
                              {getMetricIcon(rule.criteriaType)}
                              {getMetricLabel(rule.criteriaType)} {rule.operator.toUpperCase()} {rule.value.toLocaleString()}
                            </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <div className="lg:col-span-3">
            {viewingMetricsId ? (
              (() => {
                const activeRule = segmentationRules.find(r => r.id === viewingMetricsId);
                if (!activeRule) return null;
                
                const listFiltered = filterCustomersByRule(customers, activeRule);
                
                return (
                  <Card className="p-0 border border-primary/20 bg-card rounded-3xl overflow-hidden shadow-lg sticky top-6">
                    <div className="p-4 border-b border-border/60 bg-sidebar/50 flex justify-between items-center">
                       <div>
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                             <Search className="w-4 h-4 text-primary" /> Kết quả Filter: {activeRule.name}
                          </h4>
                       </div>
                       <Badge className="bg-primary/10 text-primary border-primary/20 shadow-none">
                          {listFiltered.length} matches
                       </Badge>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                      {listFiltered.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground italic text-xs">
                           Không tìm thấy khách hàng nào thỏa mãn điều kiện.
                        </div>
                      ) : (
                        listFiltered.slice(0, 50).map(c => {
                          const spendLTV = c.customFields?.spend || 0;
                          const inactiveDays = calculateInactivityDays(c.lastOrderDate);

                          return (
                            <div key={c.id} className="flex items-center justify-between p-3 border border-border/50 bg-background/50 rounded-xl hover:bg-background transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center font-black text-xs text-muted-foreground">
                                  {(c.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-foreground">{c.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{c.phone || c.email}</p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                     {spendLTV > 0 ? `${(spendLTV / 1000000).toFixed(1)}M` : '0đ'}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                     <Clock className="w-2.5 h-2.5" />
                                     {inactiveDays !== null 
                                       ? (inactiveDays > 30 ? `${Math.floor(inactiveDays / 30)}th` : `${inactiveDays}n`) 
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
                  Nhấp chọn bất kỳ nguyên tắc (điều kiện) ở bên trái để soi các khách hàng đạt tiêu chuẩn.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {showRuleDialog && (
        <SegmentationRuleDialog
          rule={selectedRule}
          onClose={() => setShowRuleDialog(false)}
        />
      )}
    </div>
  );
}
