import React, { useState, useEffect } from "react";
import { X, Save, Clock, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { LoyaltySettings } from "@/types";
import { toast } from "sonner";

interface RetentionConfigDialogProps {
 onClose: () => void;
}

export function RetentionConfigDialog({ onClose }: RetentionConfigDialogProps) {
 const { user } = useFirebase();
 const [inactiveDays, setInactiveDays] = useState(30);
 const [churnDays, setChurnDays] = useState(90);
 const [autoApply, setAutoApply] = useState(true);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
 async function loadSettings() {
 if (!user) return;
 try {
 const docRef = doc(db, `users/${user.uid}/loyaltySettings`, 'main');
 const docSnap = await getDoc(docRef);
 if (docSnap.exists()) {
 const data = docSnap.data() as LoyaltySettings;
 setInactiveDays(data.inactiveThresholdDays);
 setChurnDays(data.churnThresholdDays);
 setAutoApply(data.autoApplyStatus);
 }
 } catch (error) {
 console.error("Error loading settings:", error);
 } finally {
 setLoading(false);
 }
 }
 loadSettings();
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
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi lưu cấu hình");
 } finally {
 setSubmitting(false);
 }
 };

 if (loading) return null;

 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
 <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
 <h3 className="text-xl font-bold font-heading flex items-center gap-2">
 <Clock className="w-5 h-5 text-primary" /> Cấu hình Trạng thái Hoạt động
 </h3>
 <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-8">
 <div className="space-y-4">
 <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
 <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="text-sm font-bold text-amber-700">Ngưỡng Inactive (Không hoạt động)</p>
 <p className="text-xs text-amber-600/80 uppercase font-bold tracking-tight">Cảnh báo khách hàng bắt đầu ít tương tác</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <input 
 type="range" 
 min="7" max="180" step="1"
 className="flex-1 accent-amber-500"
 value={inactiveDays}
 onChange={e => setInactiveDays(Number(e.target.value))}
 />
 <div className="w-20 text-center bg-muted px-3 py-1 rounded-lg font-bold text-amber-600">
 {inactiveDays}d
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex items-start gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
 <Zap className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="text-sm font-bold text-rose-700">Ngưỡng Churn Risk (Rủi ro rời bỏ)</p>
 <p className="text-xs text-rose-600/80 uppercase font-bold tracking-tight">Kích hoạt các chiến dịch Win-back ngay lập tức</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <input 
 type="range" 
 min="30" max="365" step="1"
 className="flex-1 accent-rose-500"
 value={churnDays}
 onChange={e => setChurnDays(Number(e.target.value))}
 />
 <div className="w-20 text-center bg-muted px-3 py-1 rounded-lg font-bold text-rose-600">
 {churnDays}d
 </div>
 </div>
 </div>

 <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
 <div className="space-y-0.5">
 <p className="text-sm font-bold">Tự động gắn nhãn trạng thái</p>
 <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Cập nhật realtime dựa trên last transaction</p>
 </div>
 <button 
 type="button"
 onClick={() => setAutoApply(!autoApply)}
 className={`w-12 h-6 rounded-full transition-colors relative ${autoApply ? 'bg-primary' : 'bg-muted-foreground/30'}`}
 >
 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoApply ? 'left-7' : 'left-1'}`} />
 </button>
 </div>
 </div>

 <div className="px-6 py-4 border-t flex justify-end gap-3 bg-muted/10">
 <button 
 type="button" 
 onClick={onClose}
 className="px-6 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
 >
 Hủy
 </button>
 <button 
 type="submit"
 disabled={submitting}
 className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center disabled:opacity-50"
 >
 <Save className="w-4 h-4 mr-2" />
 {submitting ? "Đang lưu..." : "Lưu cấu hình"}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
