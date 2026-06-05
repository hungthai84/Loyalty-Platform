import React, { useState } from "react";
import { 
 X, 
 Save, 
 Trash2, 
 Coins, 
 Star, 
 Share2, 
 Gift, 
 Camera, 
 Heart,
 Scissors
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { EarnRule } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveGuestEarnRule, deleteGuestEarnRule } from "@/data/guestData";

interface EarnRuleDialogProps {
 onClose: () => void;
 rule?: EarnRule;
}

const EARN_TYPES = [
 { id: 'purchase', label: 'Mua hàng', icon: Coins, color: 'text-emerald-500', description: 'Tích điểm theo giá trị đơn hàng' },
 { id: 'review', label: 'Review sản phẩm', icon: Star, color: 'text-yellow-500', description: 'Tặng điểm khi khách đánh giá' },
 { id: 'referral', label: 'Giới thiệu bạn', icon: Share2, color: 'text-blue-500', description: 'Tặng điểm khi mời bạn bè thành công' },
 { id: 'checkin', label: 'Check-in Sự kiện', icon: Camera, color: 'text-purple-500', description: 'Tặng điểm khi tham gia sự kiện' },
 { id: 'birthday', label: 'Quà Sinh nhật', icon: Gift, color: 'text-rose-500', description: 'Tặng điểm nhân dịp sinh nhật' },
 { id: 'ai_styling', label: 'AI Styling', icon: Scissors, color: 'text-indigo-500', description: 'Tặng điểm khi dùng AI thử đồ' },
 { id: 'social_share', label: 'Chia sẻ MXH', icon: Heart, color: 'text-pink-500', description: 'Tặng điểm khi share bài viết' },
];

export function EarnRuleDialog({ onClose, rule }: EarnRuleDialogProps) {
 const { user } = useFirebase();
 const [name, setName] = useState(rule?.name || '');
 const [type, setType] = useState<EarnRule['type']>(rule?.type || 'purchase');
 const [points, setPoints] = useState(rule?.points || 0);
 const [value, setValue] = useState(rule?.value || 0);
 const [isActive, setIsActive] = useState(rule?.isActive ?? true);
 const [submitting, setSubmitting] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name || points <= 0) {
 toast.error("Vui lòng điền đầy đủ thông tin");
 return;
 }

 setSubmitting(true);
 const id = rule?.id || Math.random().toString(36).substring(7);
 const ruleData: EarnRule = {
 id,
 name,
 type,
 points: Number(points),
 value: type === 'purchase' ? Number(value) : 0,
 isActive,
 userId: user?.uid || "guest",
 createdAt: rule?.createdAt || new Date().toISOString(),
 };

 try {
 if (!user) {
 saveGuestEarnRule(ruleData);
 toast.success(rule ? "Đã cập nhật quy tắc (dùng thử)" : "Đã tạo quy tắc mới (dùng thử)");
 onClose();
 return;
 }

 await setDoc(doc(db, `earn_rules`, id), {
 ...ruleData,
 createdAt: rule?.createdAt || serverTimestamp(),
 });
 toast.success(rule ? "Đã cập nhật quy tắc" : "Đã tạo quy tắc mới");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Đã xảy ra lỗi");
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async () => {
 if (!rule) return;
 if (!confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) return;

 setSubmitting(true);
 try {
 if (!user) {
 deleteGuestEarnRule(rule.id);
 toast.success("Đã xóa quy tắc (dùng thử)");
 onClose();
 return;
 }

 await deleteDoc(doc(db, `earn_rules`, rule.id));
 toast.success("Đã xóa quy tắc");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi xóa quy tắc");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
 <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
 <h3 className="text-xl font-bold font-heading">
 {rule ? "Sửa quy tắc tích điểm" : "Thêm quy tắc tích điểm"}
 </h3>
 <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-6">
 <div className="space-y-4">
 <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loại hoạt động</label>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {EARN_TYPES.map((t) => {
 const Icon = t.icon;
 return (
 <button
 key={t.id}
 type="button"
 onClick={() => setType(t.id as any)}
 className={cn(
 "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-2",
 type === t.id 
 ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary" 
 : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
 )}
 >
 <Icon className={cn("w-6 h-6", type === t.id ? "text-primary" : t.color)} />
 <span className="text-xs font-bold uppercase leading-tight">{t.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Tên quy tắc</label>
 <input 
 autoFocus
 className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
 placeholder="Ví dụ: Review tặng 500 điểm"
 value={name}
 onChange={e => setName(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Số điểm thưởng</label>
 <div className="relative">
 <input 
 type="number"
 className="w-full pl-4 pr-12 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none "
 value={points}
 onChange={e => setPoints(Number(e.target.value))}
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">PTS</span>
 </div>
 </div>
 {type === 'purchase' && (
 <div className="space-y-2">
 <label className="text-sm font-medium">Cho mỗi chi tiêu ($)</label>
 <div className="relative">
 <input 
 type="number"
 className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none "
 value={value}
 onChange={e => setValue(Number(e.target.value))}
 />
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl border border-border/50">
 <input 
 type="checkbox" 
 id="active"
 className="w-5 h-5 rounded-md text-primary focus:ring-primary border-border"
 checked={isActive}
 onChange={e => setIsActive(e.target.checked)}
 />
 <label htmlFor="active" className="text-sm font-medium">Kích hoạt quy tắc này ngay lập tức</label>
 </div>
 </div>

 <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/10">
 {rule ? (
 <button 
 type="button" 
 onClick={handleDelete}
 disabled={submitting}
 className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
 title="Xóa quy tắc"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 ) : <div />}
 
 <div className="flex gap-3">
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
 {submitting ? "Đang lưu..." : "Lưu quy tắc"}
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 );
}
