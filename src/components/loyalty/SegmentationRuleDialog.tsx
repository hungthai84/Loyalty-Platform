import React, { useState, useRef } from "react";
import { 
 X, 
 Save, 
 Trash2, 
 Tag, 
 Coins, 
 Calendar, 
 Award,
 Sliders,
 Upload,
 FileText
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



 export function SegmentationRuleDialog({ onClose, rule }: SegmentationRuleDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [criteriaType, setCriteriaType] = useState<SegmentationRule['criteriaType']>(rule?.criteriaType || 'total_spend');
  const [operator, setOperator] = useState<SegmentationRule['operator']>(rule?.operator || 'gte');
  const [value, setValue] = useState<string>(rule?.value?.toString() || '');
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) {
  toast.error("Vui lòng điền tên dự án / quy tắc");
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
  description: description.trim(),
  tag: name.trim().substring(0, 15), // Auto-generate tag from name
  color: 'slate', // Default color for project
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
 toast.success(rule ? "Đã cập nhật quy tắc phân loại trạng thái (dùng thử)" : "Đã thiết lập quy tắc phân loại trạng thái mới (dùng thử)");
 onClose();
 return;
 }

 await setDoc(doc(db, `segmentation_rules`, id), {
 ...ruleData,
 createdAt: rule?.createdAt || serverTimestamp(),
 });
 toast.success(rule ? "Đã cập nhật quy tắc phân loại trạng thái" : "Đã thiết lập quy tắc phân loại trạng thái mới");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi lưu quy tắc phân loại trạng thái");
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async () => {
 if (!rule) return;
 if (!confirm("Bạn có chắc chắn muốn xóa quy tắc phân loại trạng thái này?")) return;

 setSubmitting(true);
 try {
 if (!user) {
 deleteGuestSegmentationRule(rule.id);
 toast.success("Đã xóa quy tắc phân loại trạng thái (dùng thử)");
 onClose();
 return;
 }

 await deleteDoc(doc(db, `segmentation_rules`, rule.id));
 toast.success("Đã xóa quy tắc phân loại trạng thái");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi xóa quy tắc phân loại trạng thái");
 } finally {
 setSubmitting(false);
 }
 };



 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
 <div className="bg-card w-full max-w-xl rounded-[10px] shadow-2xl border border-border overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
 <div>
 <h3 className="text-lg font-bold font-heading flex items-center gap-2">
 <Sliders className="w-5 h-5 text-primary" />
 {rule ? "Sửa Nhóm Khách Hàng Dự Án" : "Thêm Nhóm Khách Hàng Dự Án mới"}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Thiết lập quy luật tự động gán nhãn khách hàng dựa trên dữ liệu CRM hoặc tải lên danh sách
 </p>
 </div>
 <button 
 type="button"
 onClick={onClose} 
 className="p-1.5 hover:bg-muted rounded-[10px] transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
 {/* Rule Name */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground">Tên dự án / Nhóm</label>
 <input
 type="text"
 required
 placeholder="Ví dụ: Dự án chăm sóc VIP quý 2..."
 className="w-full px-4 py-2 bg-background border rounded-[10px] focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
 value={name}
 onChange={e => setName(e.target.value)}
 />
 </div>

 {/* Rule Description */}
 <div className="space-y-1.5">
 <label className="text-xs font-bold uppercase text-muted-foreground">Mô tả (Tùy chọn)</label>
 <textarea
 placeholder="Chính sách đặc biệt dành riêng, thời gian áp dụng..."
 rows={2}
 className="w-full px-4 py-2 bg-background border rounded-[10px] focus:ring-1 focus:ring-primary outline-none text-sm transition-all resize-none"
 value={description}
 onChange={e => setDescription(e.target.value)}
 />
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
 "p-3 rounded-[10px] border flex flex-col items-center justify-center text-center transition-all gap-1.5 shadow-2xs cursor-pointer",
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
 className="w-full px-3 py-2 bg-background border rounded-[10px] focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
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
 className="w-full px-4 py-2 bg-background border rounded-[10px] focus:ring-1 focus:ring-primary outline-none text-sm transition-all "
 value={value}
 onChange={e => setValue(e.target.value)}
 />
 </div>
 </div>

 {/* File Excel upload */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase text-muted-foreground block">Hoặc: Tải lên danh sách thành viên (Excel/CSV)</label>
 <div 
 onClick={() => fileInputRef.current?.click()}
 className="border-2 border-dashed border-border rounded-[10px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all"
 >
 <input 
 type="file" 
 ref={fileInputRef}
 className="hidden" 
 accept=".csv,.xlsx,.xls"
 onChange={(e) => {
   const file = e.target.files?.[0];
   if (file) {
     setFileName(file.name);
     toast.success("Tính năng chèn tệp Excel đang được nâng cấp để hỗ trợ nhiều định dạng. Tạm thời sử dụng tag chung cho file này.");
   }
 }}
 />
 <div className="p-3 bg-muted rounded-full mb-3">
 {fileName ? <FileText className="w-5 h-5 text-primary" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
 </div>
 <h4 className="text-sm font-bold">{fileName || "Chọn tệp Excel danh sách thành viên"}</h4>
 <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
 Kéo thả hoặc nhấp để tải lên tệp (.csv, .xlsx). Khách hàng sẽ tự động được thêm vào nhóm này.
 </p>
 </div>
 </div>

 {/* Active Switch */}
 <div className="flex items-center justify-between p-4 border rounded-[10px] bg-muted/20">
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
 className="px-4 py-2 border border-border rounded-[10px] text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
 >
 Hủy bỏ
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-[10px] text-xs hover:bg-primary/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-primary/10"
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
