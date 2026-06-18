import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Zap,
  Save,
  Info,
  Search,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { LoyaltySettings } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  CUSTOMER_STATUSES,
} from "@/data/customerStatuses";
import { Badge } from "@/components/ui/badge";

export function LoyaltySettingsView() {
  const { user } = useFirebase();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [inactiveDays, setInactiveDays] = useState(30);
  const [churnDays, setChurnDays] = useState(90);
  const [autoApply, setAutoApply] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [systemStatusFilter, setSystemStatusFilter] = useState<
    "all" | "New" | "Active" | "Suspended" | "Inactive"
  >("all");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("ACTIVE");

  const filteredStatuses = CUSTOMER_STATUSES.filter((s) => {
    const matchesSearch =
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.triggerCondition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      systemStatusFilter === "all" || s.systemStatus === systemStatusFilter;
    return matchesSearch && matchesFilter;
  });

  const activeSelectedStatus =
    CUSTOMER_STATUSES.find((s) => s.code === selectedStatusId) ||
    CUSTOMER_STATUSES[0];

  useEffect(() => {
    if (!user || user.isLocal) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, `loyalty_settings`, "main");

    // Using onSnapshot instead of getDoc to be more resilient to offline states
    // and provide better real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as LoyaltySettings;
          setSettings(data);
          setInactiveDays(data.inactiveThresholdDays);
          setChurnDays(data.churnThresholdDays);
          setAutoApply(data.autoApplyStatus);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "loyalty_settings");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const data: LoyaltySettings = {
        id: "main",
        inactiveThresholdDays: inactiveDays,
        churnThresholdDays: churnDays,
        autoApplyStatus: autoApply,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, `loyalty_settings`, "main"), data);
      toast.success("Đã cập nhật cấu hình giữ chân khách hàng");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "retention" } }),
      );
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, "loyalty_settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-muted-foreground italic">
        Đang tải cấu hình...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 p-6 bg-primary/5 border border-primary/10 rounded-[10px]">
        <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-bold">Cấu hình Trạng thái & Rủi ro</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hệ thống sẽ tự động phân loại khách hàng dựa trên thời gian kể từ
            giao dịch cuối cùng. Trạng thái này giúp bạn kích hoạt các chiến
            dịch Marketing tự động phù hợp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl rounded-[10px] overflow-hidden">
          <CardContent className="p-8 space-y-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-[10px]">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-700">
                    Ngưỡng Inactive (Ít tương tác)
                  </p>
                  <p className="text-xs text-amber-600/80 uppercase font-bold tracking-tight">
                    Cảnh báo khi khách hàng không quay lại sau một khoảng thời
                    gian
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <input
                  type="range"
                  min="7"
                  max="180"
                  step="1"
                  className="flex-1 h-2 bg-muted rounded-[10px] appearance-none cursor-pointer accent-amber-500"
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(Number(e.target.value))}
                />
                <div className="w-24 text-center bg-muted/50 px-4 py-2 rounded-[10px] border border-border font-bold text-lg text-amber-600">
                  {inactiveDays}d
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-[10px]">
                <Zap className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-700">
                    Ngưỡng Churn Risk (Rủi ro rời bỏ)
                  </p>
                  <p className="text-xs text-rose-600/80 uppercase font-bold tracking-tight">
                    Mức độ rủi ro cao, cần chiến dịch win-back ngay lập tức
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="1"
                  className="flex-1 h-2 bg-muted rounded-[10px] appearance-none cursor-pointer accent-rose-500"
                  value={churnDays}
                  onChange={(e) => setChurnDays(Number(e.target.value))}
                />
                <div className="w-24 text-center bg-muted/50 px-4 py-2 rounded-[10px] border border-border font-bold text-lg text-rose-600">
                  {churnDays}d
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted/20 rounded-[10px] border border-border flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold">Tự động gắn nhãn trạng thái</p>
                <p className="text-xs text-muted-foreground">
                  Cập nhật thời gian thực dựa trên lịch sử mua hàng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoApply(!autoApply)}
                className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${autoApply ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${autoApply ? "left-8" : "left-1"}`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-[10px] text-sm font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Đang lưu..." : "Cập nhật cấu hình"}
          </button>
        </div>
      </form>

      {/* Interactive Customer Status Design Matrix */}
      <div className="pt-6 border-t border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Thiết kế
              Trạng thái Khách hàng
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dựa theo tài liệu đặc tả cấu trúc hệ thống gồm 15 trạng thái phân
              loại chi tiết.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm trạng thái, định nghĩa..."
                className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[10px] text-xs outline-none focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-1 p-1 bg-muted/40 rounded-[10px]">
              {(["all", "New", "Active", "Suspended", "Inactive"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSystemStatusFilter(tab)}
                    className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all ${
                      systemStatusFilter === tab
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "all" ? "Tất cả" : tab}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Status List */}
          <div className="lg:col-span-7 bg-card border border-border rounded-[10px] overflow-hidden shadow-md max-h-[610px] flex flex-col">
            <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                DANH SÁCH PHÂN LOẠI Trạng thái ({filteredStatuses.length})
              </span>
              <span className="text-xs bg-primary/15 text-primary py-0.5 px-2 rounded-full font-extrabold uppercase">
                Specs Alpha
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-border custom-scrollbar flex-1">
              {filteredStatuses.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm italic">
                  Không tìm thấy trạng thái tương ứng.
                </div>
              ) : (
                filteredStatuses.map((status) => {
                  const isSelected = selectedStatusId === status.code;
                  return (
                    <div
                      key={status.code}
                      onClick={() => setSelectedStatusId(status.code)}
                      className={`p-4 transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-primary"
                          : "hover:bg-muted/30 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status.systemStatus === "Active"
                              ? "bg-emerald-500"
                              : status.systemStatus === "New"
                                ? "bg-blue-500"
                                : status.systemStatus === "Suspended"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                          } shrink-0`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {status.code}
                            </span>
                            <span
                              className={`text-xs font-bold px-1.5 py-0.2 rounded-[10px] ${status.color.bg} ${status.color.text} border ${status.color.border}`}
                            >
                              {status.classification}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[340px]">
                            {status.definition}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {status.permissions.login === "yes" && (
                            <span
                              className="text-emerald-500 font-bold"
                              title="Cổng VIP: Có quyền"
                            >
                              L
                            </span>
                          )}
                          {status.permissions.login === "limited" && (
                            <span
                              className="text-amber-500 font-bold"
                              title="Cổng VIP: Giới hạn"
                            >
                              L
                            </span>
                          )}
                          {status.permissions.login === "no" && (
                            <span
                              className="text-rose-500/40 line-through"
                              title="Cổng VIP: Không"
                            >
                              L
                            </span>
                          )}

                          {status.permissions.accrue === "yes" && (
                            <span
                              className="text-emerald-500 font-bold"
                              title="Tich diem: Co"
                            >
                              T
                            </span>
                          )}
                          {status.permissions.accrue === "bonus" && (
                            <span
                              className="text-purple-500 font-bold"
                              title="Tich diem: Bonus"
                            >
                              T+
                            </span>
                          )}
                          {status.permissions.accrue === "no" && (
                            <span
                              className="text-rose-500/40 line-through"
                              title="Tich diem: Khong"
                            >
                              T
                            </span>
                          )}

                          {status.permissions.redeem === "yes" && (
                            <span
                              className="text-emerald-500 font-bold"
                              title="Doi diem: Co"
                            >
                              Đ
                            </span>
                          )}
                          {status.permissions.redeem === "limited" && (
                            <span
                              className="text-amber-500 font-bold"
                              title="Doi diem: Gioi han"
                            >
                              Đ
                            </span>
                          )}
                          {status.permissions.redeem === "bonus" && (
                            <span
                              className="text-purple-500 font-bold"
                              title="Doi diem: Bonus"
                            >
                              Đ+
                            </span>
                          )}
                          {status.permissions.redeem === "no" && (
                            <span
                              className="text-rose-500/40 line-through"
                              title="Doi diem: Khong"
                            >
                              Đ
                            </span>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 rounded border-none ${
                            status.riskLevel === "Thấp" ||
                            status.riskLevel === "None"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : status.riskLevel === "Trung bình"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          Risk: {status.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details Pane */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className={`bg-card border border-border/80 rounded-[10px] p-6 shadow-xl relative overflow-hidden transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:pointer-events-none`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {activeSelectedStatus.code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-[10px] border ${activeSelectedStatus.color.bg} ${activeSelectedStatus.color.text} ${activeSelectedStatus.color.border}`}
                    >
                      {activeSelectedStatus.classification}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1.5 flex items-center gap-1.5">
                    Trạng thái hệ thống:
                    <span
                      className={`font-extrabold ${
                        activeSelectedStatus.systemStatus === "Active"
                          ? "text-emerald-500"
                          : activeSelectedStatus.systemStatus === "New"
                            ? "text-blue-500"
                            : activeSelectedStatus.systemStatus === "Suspended"
                              ? "text-amber-500"
                              : "text-rose-500"
                      }`}
                    >
                      {activeSelectedStatus.systemStatus}
                    </span>
                  </p>
                </div>

                <span
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${activeSelectedStatus.color.bg} ${activeSelectedStatus.color.text} border ${activeSelectedStatus.color.border}`}
                >
                  {activeSelectedStatus.systemStatus === "Active" ? (
                    <HeartPulse className="w-5 h-5" />
                  ) : activeSelectedStatus.systemStatus === "New" ? (
                    <Sparkles className="w-5 h-5" />
                  ) : activeSelectedStatus.systemStatus === "Suspended" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    Định nghĩa
                  </h4>
                  <p className="text-xs text-foreground mt-1.5 bg-muted/40 p-3 rounded-[10px] border border-border/30">
                    {activeSelectedStatus.definition}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    Điều kiện kích hoạt
                  </h4>
                  <p className="text-xs text-foreground mt-1.5 bg-muted/20 p-3 rounded-[10px] border border-border/20 italic">
                    {activeSelectedStatus.triggerCondition}
                  </p>
                </div>

                {/* Permissions Grid */}
                <div>
                  <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    Quyền & Phép hạn chế trong hệ thống
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted/30 rounded-[10px] border border-border/20 flex flex-col justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Quyền truy cập Cổng VIP
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {activeSelectedStatus.permissions.login === "yes" && (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-bold">
                              Thực hiện được
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.login ===
                          "limited" && (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">
                              Giới hạn quyền
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.login === "no" && (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-bold text-rose-500">
                              Khóa truy cập
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-[10px] border border-border/20 flex flex-col justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Tích luỹ điểm
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {activeSelectedStatus.permissions.accrue === "yes" && (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-bold">
                              Tự động tích
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.accrue ===
                          "bonus" && (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-xs font-bold text-purple-600">
                              Nhân hệ số (Bonus)
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.accrue === "no" && (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-bold text-rose-500">
                              Không tích
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-[10px] border border-border/20 flex flex-col justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Đổi mã quà tặng
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {activeSelectedStatus.permissions.redeem === "yes" && (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-bold">
                              Đổi không giới hạn
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.redeem ===
                          "limited" && (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">
                              Bị giới hạn
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.redeem ===
                          "bonus" && (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-xs font-bold text-purple-600">
                              Hạng VIP ưu đãi
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.redeem === "no" && (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-bold text-rose-500">
                              Chặn quy đổi
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-[10px] border border-border/20 flex flex-col justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Giao dịch mua hàng
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {activeSelectedStatus.permissions.purchase ===
                          "yes" && (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-bold">
                              Thanh toán thường
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.purchase ===
                          "limited" && (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">
                              Bị giới hạn
                            </span>
                          </>
                        )}
                        {activeSelectedStatus.permissions.purchase === "no" && (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-xs font-bold text-rose-500">
                              Chặn giao dịch
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 p-3 bg-muted/40 rounded-[10px] border border-border/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
                        Campaign tiếp thị
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {activeSelectedStatus.permissions.campaign}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
                        Chế độ CSKH
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {activeSelectedStatus.permissions.cshk}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-primary/5 p-3 rounded-[10px] border border-primary/10">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
                      Kịch bản tự động
                    </span>
                    <span className="text-xs font-bold text-primary mt-1 block">
                      {activeSelectedStatus.automation}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-[10px] border ${
                      activeSelectedStatus.riskLevel === "Thấp" ||
                      activeSelectedStatus.riskLevel === "None"
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600"
                        : activeSelectedStatus.riskLevel === "Trung bình"
                          ? "bg-amber-500/5 border-amber-500/10 text-amber-600"
                          : "bg-rose-500/5 border-rose-500/10 text-rose-600"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
                      Risk Level (Mức rủi ro)
                    </span>
                    <span className="text-xs font-extrabold mt-1 block">
                      {activeSelectedStatus.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
