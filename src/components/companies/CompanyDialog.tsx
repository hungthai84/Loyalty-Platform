import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Building2, Image as ImageIcon } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Company } from "@/types";
import { toast } from "sonner";

interface CompanyDialogProps {
 onClose: () => void;
 company?: Company;
}

export function CompanyDialog({ onClose, company }: CompanyDialogProps) {
 const { user } = useFirebase();
 const [name, setName] = useState(company?.name || '');
 const [logoUrl, setLogoUrl] = useState(company?.logoUrl || '');
 const [address, setAddress] = useState(company?.address || '');
 const [type, setType] = useState<'company'|'branch'>(company?.type || 'company');
 const [parentId, setParentId] = useState(company?.parentId || '');
 const [submitting, setSubmitting] = useState(false);
 
 const [companies, setCompanies] = useState<Company[]>([]);

 useEffect(() => {
 if (!user) return;
 const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
 const unsub = onSnapshot(q, snap => {
 setCompanies(snap.docs.map(d => ({ ...d.data(), id: d.id } as Company)));
 });
 return () => unsub();
 }, [user]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;
 if (!name) {
 toast.error("Vui lòng nhập tên công ty/chi nhánh");
 return;
 }
 if (type === 'branch' && !parentId) {
 toast.error("Vui lòng chọn công ty quản lý cho chi nhánh này");
 return;
 }

 setSubmitting(true);
 try {
 const id = company?.id || Math.random().toString(36).substring(7);
 const data = {
 id,
 name,
 logoUrl,
 address,
 type,
 parentId: type === 'branch' ? parentId : null,
 userId: user.uid,
 createdAt: company?.createdAt || serverTimestamp(),
 };

 await setDoc(doc(db, "companies", id), data);
 toast.success(company ? "Đã cập nhật thông tin" : "Đã tạo thành công");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Đã xảy ra lỗi");
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async () => {
 if (!user || !company) return;
 if (!confirm("Xóa công ty/chi nhánh này? Dữ liệu khách hàng liên quan sẽ không bị xóa nhưng sẽ mất liên kết.")) return;

 setSubmitting(true);
 try {
 await deleteDoc(doc(db, "companies", company.id));
 toast.success("Đã xóa thành công");
 onClose();
 } catch (error) {
 console.error(error);
 toast.error("Lỗi khi xóa");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
 <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
 <h3 className="text-xl font-bold font-heading flex items-center gap-2">
 <Building2 className="w-5 h-5 text-primary" />
 {company ? "Sửa thông tin" : "Thêm Công ty / Chi nhánh"}
 </h3>
 <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-4">
 <div className="flex justify-center mb-6">
 <div className="relative group">
 <div className="w-24 h-24 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center">
 {logoUrl ? (
 <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
 ) : (
 <Building2 className="w-10 h-10 text-muted-foreground" />
 )}
 </div>
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
 <ImageIcon className="w-6 h-6 text-white" />
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">Tên Công ty / Thương hiệu</label>
 <input 
 autoFocus
 className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
 placeholder="Ví dụ: SEVA Boutique - CN Quận 1"
 value={name}
 onChange={e => setName(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">Loại hình</label>
 <div className="flex gap-4">
 <label className="flex items-center gap-2 cursor-pointer">
 <input 
 type="radio" 
 name="type" 
 value="company" 
 checked={type === 'company'} 
 onChange={() => setType('company')}
 className="text-primary focus:ring-primary"
 />
 <span>Công ty / Thương hiệu</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input 
 type="radio" 
 name="type" 
 value="branch" 
 checked={type === 'branch'} 
 onChange={() => setType('branch')}
 className="text-primary focus:ring-primary"
 />
 <span>Chi nhánh</span>
 </label>
 </div>
 </div>

 {type === 'branch' && (
 <div className="space-y-2">
 <label className="text-sm font-medium">Công ty quản lý</label>
 <select 
 className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
 value={parentId}
 onChange={e => setParentId(e.target.value)}
 >
 <option value="">-- Chọn công ty --</option>
 {companies.filter(c => c.type === 'company' || !c.type).map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 )}

 <div className="space-y-2">
 <label className="text-sm font-medium">Link Logo (URL)</label>
 <input 
 className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
 placeholder="https://example.com/logo.png"
 value={logoUrl}
 onChange={e => setLogoUrl(e.target.value)}
 />
 <p className="text-xs text-muted-foreground">Nếu để trống, hệ thống sẽ tự tạo logo theo tên.</p>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">Địa chỉ</label>
 <input 
 className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
 placeholder="123 Đường ABC, Quận X, TP. HCM"
 value={address}
 onChange={e => setAddress(e.target.value)}
 />
 </div>
 </div>

 <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/10">
 {company ? (
 <button 
 type="button" 
 onClick={handleDelete}
 disabled={submitting}
 className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
 title="Xóa"
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
 {submitting ? "Đang lưu..." : "Lưu thông tin"}
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 );
}
