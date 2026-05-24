import React, { useState, useEffect } from "react";
import { AlertTriangle, Zap, Save, Clock, Info } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { LoyaltySettings } from "@/types";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function LoyaltySettingsView() {
  const { user } = useFirebase();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [inactiveDays, setInactiveDays] = useState(30);
  const [churnDays, setChurnDays] = useState(90);
  const [autoApply, setAutoApply] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const docRef = doc(db, `users/${user.uid}/loyaltySettings`, 'main');
    
    // Using onSnapshot instead of getDoc to be more resilient to offline states 
    // and provide better real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LoyaltySettings;
        setSettings(data);
        setInactiveDays(data.inactiveThresholdDays);
        setChurnDays(data.churnThresholdDays);
        setAutoApply(data.autoApplyStatus);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading settings:", error);
      // Don't toast here as it might be transient, but log it
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const data: LoyaltySettings = {
        id: 'main',
        inactiveThresholdDays: inactiveDays,
        churnThresholdDays: churnDays,
        autoApplyStatus: autoApply,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, `users/${user.uid}/loyaltySettings`, 'main'), data);
      toast.success("Đã cập nhật cấu hình giữ chân khách hàng");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground italic">Đang tải cấu hình...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4 p-6 bg-primary/5 border border-primary/10 rounded-3xl">
         <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
         <div className="space-y-1">
            <h4 className="font-bold">Cấu hình Trạng thái & Rủi ro</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
               Hệ thống sẽ tự động phân loại khách hàng dựa trên thời gian kể từ giao dịch cuối cùng. 
               Trạng thái này giúp bạn kích hoạt các chiến dịch Marketing tự động phù hợp.
            </p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-700">Ngưỡng Inactive (Ít tương tác)</p>
                  <p className="text-[10px] text-amber-600/80 uppercase font-bold tracking-tight">Cảnh báo khi khách hàng không quay lại sau một khoảng thời gian</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="7" max="180" step="1"
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                  value={inactiveDays}
                  onChange={e => setInactiveDays(Number(e.target.value))}
                />
                <div className="w-24 text-center bg-muted/50 px-4 py-2 rounded-xl border border-border font-mono font-bold text-lg text-amber-600">
                  {inactiveDays}d
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <Zap className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-700">Ngưỡng Churn Risk (Rủi ro rời bỏ)</p>
                  <p className="text-[10px] text-rose-600/80 uppercase font-bold tracking-tight">Mức độ rủi ro cao, cần chiến dịch win-back ngay lập tức</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="30" max="365" step="1"
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
                  value={churnDays}
                  onChange={e => setChurnDays(Number(e.target.value))}
                />
                <div className="w-24 text-center bg-muted/50 px-4 py-2 rounded-xl border border-border font-mono font-bold text-lg text-rose-600">
                  {churnDays}d
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted/20 rounded-3xl border border-border flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold">Tự động gắn nhãn trạng thái</p>
                <p className="text-xs text-muted-foreground">Cập nhật thời gian thực dựa trên lịch sử mua hàng</p>
              </div>
              <button 
                type="button"
                onClick={() => setAutoApply(!autoApply)}
                className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${autoApply ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${autoApply ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Đang lưu..." : "Cập nhật cấu hình"}
          </button>
        </div>
      </form>
    </div>
  );
}
