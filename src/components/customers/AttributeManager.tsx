import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Type, AlignLeft, ChevronDown, Circle, Square, CalendarClock, Trash2 } from 'lucide-react';
import * as motion from 'motion/react-client';
import { AttributeDefinition } from '@/types';
import { Switch } from '@/components/ui/switch';

interface AttributeManagerProps {
 onClose?: () => void;
 attributes: AttributeDefinition[];
 inline?: boolean;
}

const FIELD_TYPES = [
 { id: 'text', label: 'Hộp ký tự', icon: Type },
 { id: 'textarea', label: 'Đoạn văn bản', icon: AlignLeft },
 { id: 'select', label: 'Danh sách tùy chọn', icon: ChevronDown },
 { id: 'radio', label: 'Ô chọn (duy nhất)', icon: Circle },
 { id: 'checkbox', label: 'Ô chọn (nhiều giá trị)', icon: Square },
 { id: 'time', label: 'Thời gian', icon: CalendarClock },
];

export function AttributeManager({ onClose, attributes, inline = false }: AttributeManagerProps) {
 const { user } = useFirebase();
 const [selectedType, setSelectedType] = useState('text');
 const [keepAdding, setKeepAdding] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 
 // Form State
 const [label, setLabel] = useState('');
 const [placeholder, setPlaceholder] = useState('');
 const [isRequired, setIsRequired] = useState(false);
 const [defaultValue, setDefaultValue] = useState('');
 const [options, setOptions] = useState<string[]>([]);
 const [newOption, setNewOption] = useState('');

 const prefersOptions = ['select', 'radio', 'checkbox'].includes(selectedType);

 const handleAddOption = (e?: React.KeyboardEvent | React.MouseEvent) => {
  if (e) e.preventDefault();
  if (newOption.trim() && !options.includes(newOption.trim())) {
   setOptions([...options, newOption.trim()]);
   setNewOption('');
  }
 };

 const handleRemoveOption = (index: number) => {
  setOptions(options.filter((_, i) => i !== index));
 };

 const handleAdd = async () => {
  if (!user) return;
  if (!label.trim()) return toast.error("Tên thuộc tính là bắt buộc");

  const key = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (attributes.some(a => a.key === key)) return toast.error("Thuộc tính với tên này đã tồn tại");

  setSubmitting(true);
  const id = `ATTR-${Date.now()}`;
  const path = `attribute_definitions/${id}`;

  try {
   await setDoc(doc(db, path), {
    id,
    label,
    key,
    type: selectedType as any,
    placeholder,
    isRequired,
    defaultValue,
    options: prefersOptions ? options : undefined,
    userId: user.uid,
    createdAt: serverTimestamp(),
   });
   toast.success("Đã thêm thuộc tính");
   
   if (keepAdding) {
    setLabel('');
    setPlaceholder('');
    setDefaultValue('');
    setIsRequired(false);
    setOptions([]);
    setNewOption('');
   } else {
    onClose?.();
   }
  } catch (error) {
   handleFirestoreError(error, OperationType.WRITE, path);
   toast.error("Không thể thêm thuộc tính");
  } finally {
   setSubmitting(false);
  }
 };

 const handleDelete = async (id: string) => {
  if (!user) return;
  if (!confirm("Bạn có chắc chắn muốn xóa không?")) return;

  const path = `attribute_definitions/${id}`;
  try {
   await deleteDoc(doc(db, path));
   toast.success("Đã xóa thuộc tính");
  } catch (error) {
   handleFirestoreError(error, OperationType.DELETE, path);
  }
 };

 if (inline) {
  return (
   <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 h-full max-h-[70vh]">
    <div className="space-y-4">
     <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider pl-1 font-heading text-left">Thêm mới trường tùy chỉnh</h4>
     <div className="bg-muted/30 p-5 rounded-2xl border border-border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="space-y-1.5 focus-within:text-primary transition-colors text-left font-sans">
        <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">
         Tên hiển thị <span className="text-destructive">*</span>
        </label>
        <input 
         value={label}
         onChange={e => setLabel(e.target.value)}
         placeholder="VD: Sở thích..."
         className="w-full px-4 py-2.5 bg-background border-border border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
        />
       </div>

       <div className="space-y-1.5 text-left font-sans">
        <label className="text-xs font-semibold text-muted-foreground block pl-1">Kiểu dữ liệu</label>
        <select 
         value={selectedType}
         onChange={e => setSelectedType(e.target.value)}
         className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
        >
         {FIELD_TYPES.map(type => (
          <option key={type.id} value={type.id}>{type.label}</option>
         ))}
        </select>
       </div>
      </div>

      {/* Tùy chọn cho danh sách (select, radio, checkbox) */}
      {prefersOptions && (
       <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-left">
        <label className="text-xs font-semibold text-foreground block pl-1 font-sans">Các tùy chọn (Nhấn chọn 'Thêm')</label>
        <div className="flex gap-2">
         <input 
          value={newOption}
          onChange={e => setNewOption(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddOption(e)}
          placeholder="Nhập giá trị tùy chọn..."
          className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-sans"
         />
         <button 
          type="button"
          onClick={handleAddOption}
          className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors text-sm font-sans"
         >
          Thêm
         </button>
        </div>
        {options.length > 0 && (
         <div className="flex flex-wrap gap-2 pt-2">
          {options.map((opt, i) => (
           <div key={i} className="flex items-center gap-2 px-3 py-1 bg-background border border-border rounded-lg text-xs shadow-sm text-foreground font-mono">
            <span>{opt}</span>
            <button 
             type="button"
             onClick={() => handleRemoveOption(i)} 
             className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
            >
             <X className="w-3 h-3" />
            </button>
           </div>
          ))}
         </div>
        )}
       </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="space-y-1.5 focus-within:text-primary transition-colors text-left font-sans">
        <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">Văn bản gợi ý (Placeholder)</label>
        <input 
         value={placeholder}
         onChange={e => setPlaceholder(e.target.value)}
         placeholder="Tùy chọn..."
         className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-sans"
        />
       </div>
       <div className="space-y-1.5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
         <Switch checked={isRequired} onCheckedChange={setIsRequired} id="is-required" />
         <label htmlFor="is-required" className="text-xs font-medium cursor-pointer text-muted-foreground font-sans">Bắt buộc nhập</label>
        </div>
        <div className="flex items-center gap-3">
         <Switch checked={keepAdding} onCheckedChange={setKeepAdding} id="keep-adding" />
         <label htmlFor="keep-adding" className="text-xs font-medium cursor-pointer text-muted-foreground font-sans font-medium">Tiếp tục thêm</label>
        </div>
       </div>
      </div>

      <div className="flex justify-end pt-2">
       <button 
        disabled={submitting || !label.trim()}
        onClick={handleAdd}
        className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm font-sans"
       >
        {submitting ? 'Đang tạo...' : 'Lưu Thuộc Tính'}
       </button>
      </div>
     </div>
    </div>

    <div className="space-y-4">
     <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider pl-1 font-heading text-left">Thuộc tính đã có</h4>
     {attributes.length === 0 ? (
      <div className="text-center py-6 bg-muted/20 border border-dashed rounded-xl">
       <p className="text-xs text-muted-foreground font-sans">Chưa có thuộc tính mở rộng nào.</p>
      </div>
     ) : (
      <div className="space-y-2">
       {attributes.map(attr => (
        <div key={attr.id} className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm hover:border-primary/20 transition-all">
         <div className="flex flex-col text-left font-sans">
          <div className="flex items-center gap-2">
           <span className="font-semibold text-sm">{attr.label}</span>
           {attr.isRequired && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium font-sans">Bắt buộc</span>}
          </div>
          <span className="text-xs text-muted-foreground mt-1 font-mono">Type: {attr.type} - Key: {attr.key}</span>
         </div>
         <button 
          onClick={() => handleDelete(attr.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          title="Xóa thuộc tính"
         >
          <Trash2 className="w-4 h-4" />
         </button>
        </div>
       ))}
      </div>
     )}
    </div>
   </div>
  );
 }

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
   <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[1.25rem] flex flex-col max-h-[85vh] overflow-hidden"
   >
    <div className="flex items-center justify-between p-6 border-b border-border">
     <h2 className="text-lg font-bold text-foreground">Quản lý Thuộc tính Mở rộng</h2>
     <button onClick={onClose} className="p-2 hover:bg-muted/80 rounded-full transition-colors">
      <X className="w-4 h-4 text-muted-foreground" />
     </button>
    </div>

    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
     <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Thêm mới</h3>
      <div className="bg-muted/30 p-5 rounded-2xl border border-border space-y-4">
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 focus-within:text-primary transition-colors">
         <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">
          Tên hiển thị <span className="text-destructive">*</span>
         </label>
         <input 
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="VD: Sở thích..."
          className="w-full px-4 py-2.5 bg-background border-border border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
         />
        </div>

        <div className="space-y-1.5">
         <label className="text-xs font-semibold text-muted-foreground block pl-1">Kiểu dữ liệu</label>
         <select 
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
         >
          {FIELD_TYPES.map(type => (
           <option key={type.id} value={type.id}>{type.label}</option>
          ))}
         </select>
        </div>
       </div>

       {/* Tùy chọn cho danh sách (select, radio, checkbox) */}
       {prefersOptions && (
        <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
         <label className="text-xs font-semibold text-foreground block pl-1">Các tùy chọn (Nhấn chọn 'Thêm')</label>
         <div className="flex gap-2">
          <input 
           value={newOption}
           onChange={e => setNewOption(e.target.value)}
           onKeyDown={e => e.key === 'Enter' && handleAddOption(e)}
           placeholder="Nhập giá trị tùy chọn..."
           className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          />
          <button 
           type="button"
           onClick={handleAddOption}
           className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors text-sm"
          >
           Thêm
          </button>
         </div>
         {options.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
           {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1 bg-background border border-border rounded-lg text-xs shadow-sm text-foreground">
             <span>{opt}</span>
             <button 
              type="button"
              onClick={() => handleRemoveOption(i)} 
              className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
             >
              <X className="w-3 h-3" />
             </button>
            </div>
           ))}
          </div>
         )}
        </div>
       )}

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 focus-within:text-primary transition-colors">
         <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">Văn bản gợi ý (Placeholder)</label>
         <input 
          value={placeholder}
          onChange={e => setPlaceholder(e.target.value)}
          placeholder="Tùy chọn..."
          className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
         />
        </div>
        <div className="space-y-1.5 pt-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
          <Switch checked={isRequired} onCheckedChange={setIsRequired} id="is-required" />
          <label htmlFor="is-required" className="text-xs font-medium cursor-pointer text-muted-foreground">Bắt buộc nhập</label>
         </div>
         <div className="flex items-center gap-3">
          <Switch checked={keepAdding} onCheckedChange={setKeepAdding} id="keep-adding" />
          <label htmlFor="keep-adding" className="text-xs font-medium cursor-pointer text-muted-foreground">Tiếp tục thêm</label>
         </div>
        </div>
       </div>

       <div className="flex justify-end pt-2">
        <button 
         disabled={submitting || !label.trim()}
         onClick={handleAdd}
         className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
        >
         {submitting ? 'Đang tạo...' : 'Lưu Thuộc Tính'}
        </button>
       </div>
      </div>
     </div>

     <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Thuộc tính đã có</h3>
      {attributes.length === 0 ? (
       <div className="text-center py-6 bg-muted/20 border border-dashed rounded-xl">
        <p className="text-xs text-muted-foreground">Chưa có thuộc tính mở rộng nào.</p>
       </div>
      ) : (
       <div className="space-y-2">
        {attributes.map(attr => (
         <div key={attr.id} className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm hover:border-primary/20 transition-all">
          <div className="flex flex-col">
           <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{attr.label}</span>
            {attr.isRequired && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Bắt buộc</span>}
           </div>
           <span className="text-xs text-muted-foreground mt-1">Type: {attr.type} - Key: {attr.key}</span>
          </div>
          <button 
           onClick={() => handleDelete(attr.id)}
           className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
           title="Xóa thuộc tính"
          >
           <Trash2 className="w-4 h-4" />
          </button>
         </div>
        ))}
       </div>
      )}
     </div>
    </div>
   </motion.div>
  </div>
 );
}
