import React, { useState } from "react";
import { 
 X, 
 Save, 
 Trash2, 
 Tag, 
 Coins, 
 Calendar, 
 Award,
 Sliders
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { SegmentationRule } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveGuestSegmentationRule, deleteGuestSegmentationRule } from "@/data/guestData";

interface SegmentationRuleDialogProps {
 onClose: () => void;
 rule?: SegmentationRule;
}

const CRITERIA_TYPES = [
 { id: 'total_spend', label: 'Tổng chi tiêu', icon: Coins, color: 'text-emerald-500', unit: '₫', placeholder: 'Ví dụ: 10000000' },
 { id: 'time_since_last_purchase', label: 'Thời gian không hoạt động', icon: Calendar, color: 'text-rose-500', unit: 'ngày', placeholder: 'Ví dụ: 30' },
 { id: 'points_balance', label: 'Số dư điểm Loyalty', icon: Award, color: 'text-yellow-500', unit: 'pts', placeholder: 'Ví dụ: 2500' },
];

const OPERATORS = [
 { id: 'gte', label: 'Lớn hơn hoặc bằng (>=)' },
 { id: 'gt', label: 'Lớn hơn (>)' },
 { id: 'eq', label: 'Bằng (=)' },
 { id: 'lte', label: 'Nhỏ hơn hoặc bằng (<=)' },
 { id: 'lt', label: 'Nhỏ hơn (<)' },
];

const COLOR_PRESETS = [
 { id: 'gold', name: 'Vàng Ánh Kim', hex: '#2f6cf5', border: 'border-[#2f6cf5]/30 bg-[#2f6cf5]/10 text-[#2f6cf5]' },
 { id: 'emerald', name: 'Xanh Ngọc Lục Bảo', hex: '#10b981', border: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' },
 { id: 'rose', name: 'Đỏ Ruby', hex: '#f43f5e', border: 'border-rose-500/30 bg-rose-500/10 text-rose-500' },
 { id: 'sky', name: 'Xanh Đại Dương', hex: '#0ea5e9', border: 'border-sky-500/30 bg-sky-500/10 text-sky-500' },
 { id: 'indigo', name: 'Tím Indigo', hex: '#6366f1', border: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500' },
 { id: 'purple', name: 'Tím Hoàng Gia', hex: '#a855f7', border: 'border-purple-500/30 bg-purple-500/10 text-purple-500' },
 { id: 'slate', name: 'Xám Đá Slate', hex: '#64748b', border: 'border-slate-500/30 bg-slate-500/10 text-slate-500' },
];

export function SegmentationRuleDialog({ onClose, rule }: SegmentationRuleDialogProps) {
 const { user } = useFirebase();
 const [name, setName] = useState(rule?.name || '');
 const [tag, setTag] = useState(rule?.tag || '');
 const [color, setColor] = useState(rule?.color || 'gold');
 const [criteriaType, setCriteriaType] = useState<SegmentationRule['criteriaType']>(rule?.criteriaType || 'total_spend');
 const [operator, setOperator] = useState<SegmentationRule['operator']>(rule?.operator || 'gte');
 const [value, setValue] = useState<string>(rule?.value?.toString() || '');
 const [isActive, setIsActive] = useState(rule?.isActive ?? true);
 const [submitting, setSubmitting] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) {
 toast.error("Vui lòng điền tên quy tắc phân khúc");
 return;
 }
 if (!tag.trim()) {
 toast.error("Vui lòng điền nhãn tag tự động");
 return;
 }
 if (value === '' || isNaN(Number(value))) {
 toast.error("Vui lòng điền giá trị ngưỡng hợp lệ");
 return;
 }

 setSubmitting(true);
 const id = rule?.id || Math.random().toString(36).substring(7);
 const ruleData: SegmentationRule = {
 id,
 name: name.trim(),
 tag: tag.trim(),
 color,
 criteriaType,
 operator,
 value: Number(value),
 isActive,
 userId: user?.uid || "guest",
 createdAt: rule?.createdAt || new Date().toISOString(),
 };

 try {
 if (!user) {
 saveGuestSegmentationRule(ruleData);
 toast.success(rule ? "Đã cập nhật quy tắc phân khúc (dùng thử)" : "Đã thiết lập quy tắc phân khúc mới (dùng thử)");
 onClose();
 return;
 }

 await setDoc(doc(db, `segmentation_rules`, id), {
 ...ruleData,
 createdAt: rule?.createdAt || serverTimestamp(),
 });
 toast.success(rule ? "Đã cập nhật quy tắc phân khúc" : "Đã thiết lập quy tắc phân khúc mới");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi lưu quy tắc phân khúc");
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async () => {
 if (!rule) return;
 if (!confirm("Bạn có chắc chắn muốn xóa quy tắc phân khúc này?")) return;

 setSubmitting(true);
 try {
 if (!user) {
 deleteGuestSegmentationRule(rule.id);
 toast.success("Đã xóa quy tắc phân khúc (dùng thử)");
 onClose();
 return;
 }

 await deleteDoc(doc(db, `segmentation_rules`, rule.id));
 toast.success("Đã xóa quy tắc phân khúc");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi xóa quy tắc phân khúc");
 } finally {
 setSubmitting(false);
 }
 };

 const selectedPresetColor = COLOR_PRESETS.find(p => p.id === color) || COLOR_PRESETS[0];

 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
 <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
 <div>
 <h3 className="text-lg font-bold font-heading flex items-center gap-2">
 <Sliders className="w-5 h-5 text-primary" />
 {rule ? "Sửa Quy tắc Phân khúc" : "Thêm Quy tắc Phân khúc mới"}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Thiết lập quy luật tự động gán nhãn khách hàng dựa trên dữ liệu CRM
 </p>
 </div>
 <button 
 type="button"
 onClick={onClose} 
 className="p-1.5 hover:bg-muted rounded-xl transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
 {/* Rule Name */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground">Tên quy tắc phân khúc</label>
 <input
 type="text"
 required
 placeholder="Ví dụ: Khách hàng chi tiêu lớn, Thành viên không hoạt động..."
 className="w-full px-4 py-2 bg-background border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
 value={name}
 onChange={e => setName(e.target.value)}
 />
 </div>

 {/* Tag Badges Setup */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground font-sans">Nhãn Tag tự động gán</label>
 <div className="relative">
 <Tag className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 required
 placeholder="Ví dụ: Big Spender"
 className="w-full pl-9 pr-4 py-2 bg-background border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm font-semibold transition-all"
 value={tag}
 onChange={e => setTag(e.target.value)}
 />
 </div>
 </div>

 {/* Tag Color Presets */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground block">Màu sắc hiển thị</label>
 <select
 value={color}
 onChange={e => setColor(e.target.value)}
 className="w-full px-3 py-2 bg-background border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
 >
 {COLOR_PRESETS.map((p) => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Live Badge Preview */}
 <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between">
 <span className="text-xs text-muted-foreground">Bản xem trước nhãn tag:</span>
 <span className={cn("px-3 py-1 rounded-full text-xs font-bold border transition-all uppercase tracking-wide", selectedPresetColor.border)}>
 {tag || "EXAMPLE_TAG"}
 </span>
 </div>

 {/* Criteria Selector */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase text-muted-foreground block">Loại chỉ số kiểm tra</label>
 <div className="grid grid-cols-3 gap-3">
 {CRITERIA_TYPES.map((c) => {
 const Icon = c.icon;
 return (
 <button
 key={c.id}
 type="button"
 onClick={() => setCriteriaType(c.id as SegmentationRule['criteriaType'])}
 className={cn(
 "p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all gap-1.5 shadow-2xs cursor-pointer",
 criteriaType === c.id 
 ? "border-primary bg-primary/5 text-primary scale-[1.02]" 
 : "border-border hover:border-foreground/20 hover:bg-muted/30"
 )}
 >
 <Icon className={cn("w-5 h-5", criteriaType === c.id ? 'text-primary' : 'text-muted-foreground')} />
 <span className="text-xs font-bold leading-tight">{c.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Operational Formula block */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground">Công thức so sánh</label>
 <select
 value={operator}
 onChange={e => setOperator(e.target.value as SegmentationRule['operator'])}
 className="w-full px-3 py-2 bg-background border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
 >
 {OPERATORS.map((o) => (
 <option key={o.id} value={o.id}>{o.label}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground">
 Ngưỡng giá trị ({CRITERIA_TYPES.find(c => c.id === criteriaType)?.unit})
 </label>
 <input
 type="number"
 required
 placeholder={CRITERIA_TYPES.find(c => c.id === criteriaType)?.placeholder}
 className="w-full px-4 py-2 bg-background border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm transition-all "
 value={value}
 onChange={e => setValue(e.target.value)}
 />
 </div>
 </div>

 {/* Active Switch */}
 <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20">
 <div>
 <span className="text-sm font-bold block">Trạng thái áp dụng</span>
 <span className="text-xs text-muted-foreground leading-none">Quy tắc tự động chạy khi kích hoạt</span>
 </div>
 <input 
 type="checkbox"
 checked={isActive}
 onChange={e => setIsActive(e.target.checked)}
 className="w-4 h-4 accent-primary cursor-pointer"
 />
 </div>
 </div>

 {/* Footer Controls */}
 <div className="px-6 py-4 bg-muted/20 border-t flex justify-between items-center">
 <div>
 {rule && (
 <button
 type="button"
 onClick={handleDelete}
 disabled={submitting}
 className="flex items-center text-rose-500 hover:text-rose-600 transition-colors font-bold text-xs gap-1.5 cursor-pointer"
 >
 <Trash2 className="w-4 h-4" /> Xóa quy tắc
 </button>
 )}
 </div>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={onClose}
 disabled={submitting}
 className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
 >
 Hủy bỏ
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-primary/10"
 >
 <Save className="w-4 h-4" /> {rule ? "Lưu thay đổi" : "Tạo quy tắc"}
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 );
}
