import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Type, AlignLeft, ChevronDown, Circle, Square, CalendarClock, Trash2 } from 'lucide-react';
import * as motion from 'motion/react-client';
import { AttributeDefinition } from '@/types';
import { Switch } from '@/components/ui/switch';

interface AttributeManagerProps {
  onClose: () => void;
  attributes: AttributeDefinition[];
}

const FIELD_TYPES = [
  { id: 'text', label: 'Hộp ký tự', icon: Type },
  { id: 'textarea', label: 'Đoạn văn bản', icon: AlignLeft },
  { id: 'select', label: 'Danh sách tùy chọn', icon: ChevronDown },
  { id: 'radio', label: 'Ô chọn (duy nhất)', icon: Circle },
  { id: 'checkbox', label: 'Ô chọn (nhiều giá trị)', icon: Square },
  { id: 'time', label: 'Thời gian', icon: CalendarClock },
];

export function AttributeManager({ onClose, attributes }: AttributeManagerProps) {
  const { user } = useFirebase();
  const [selectedType, setSelectedType] = useState('text');
  const [keepAdding, setKeepAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [includeLabel, setIncludeLabel] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const activeTypeInfo = FIELD_TYPES.find(t => t.id === selectedType);
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
    if (!label.trim()) return toast.error("Tên trường là bắt buộc");

    const key = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (attributes.some(a => a.key === key)) return toast.error("Thuộc tính với tên này đã tồn tại");

    setSubmitting(true);
    const id = `ATTR-${Date.now()}`;
    const path = `users/${user.uid}/attributeDefinitions/${id}`;

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
        onClose();
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

    const path = `users/${user.uid}/attributeDefinitions/${id}`;
    try {
      await deleteDoc(doc(db, path));
      toast.success("Đã xóa thuộc tính");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
          <h3 className="text-xl font-bold font-heading">Thêm thuộc tính</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={keepAdding} onCheckedChange={setKeepAdding} id="keep-adding" />
              <label htmlFor="keep-adding" className="text-sm font-medium cursor-pointer select-none">
                Tiếp tục thêm mới
              </label>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Type Selection */}
          <div className="w-64 border-r border-border bg-background p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
            {FIELD_TYPES.map(type => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/95 text-primary-foreground shadow-sm' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : ''}`} />
                  {type.label}
                </button>
              );
            })}
            
            {/* View Existing Attributes */}
            {attributes.length > 0 && (
              <div className="mt-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-4">Đã tạo ({attributes.length})</h4>
                <div className="space-y-1">
                  {attributes.map(attr => (
                    <div key={attr.id} className="flex flex-col gap-1 px-4 py-2 hover:bg-muted/50 rounded-lg group">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate pr-2">{attr.label}</span>
                        <button onClick={() => handleDelete(attr.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Xóa thuộc tính">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">{attr.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Area - Configuration Form */}
          <div className="flex-1 bg-muted/20 p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Top Banner / Preview */}
              <div className="bg-background border border-border rounded-xl p-4 shadow-sm text-sm text-muted-foreground">
                <p className="font-mono mb-1">-</p>
                <p>Tối đa 256 ký tự</p>
              </div>

              {/* Form Fields container */}
              <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Tên trường */}
                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">
                      Tên trường <span className="text-destructive">*</span>
                    </label>
                    <input 
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      placeholder="Tối đa 48 ký tự"
                      className="w-full px-4 py-3 bg-background border-border border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Gợi ý */}
                  <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-primary block pl-1">Gợi ý</label>
                    <input 
                      value={placeholder}
                      onChange={e => setPlaceholder(e.target.value)}
                      placeholder="Tối đa 256 ký tự"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Kiểu dữ liệu */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block pl-1">Kiểu dữ liệu</label>
                  <select 
                    disabled
                    value={selectedType}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm outline-none appearance-none cursor-not-allowed opacity-80 font-medium text-foreground"
                  >
                    <option value={selectedType}>{activeTypeInfo?.label}</option>
                  </select>
                </div>

                {prefersOptions && (
                  <div className="space-y-3 p-5 rounded-xl border border-primary/20 bg-primary/5">
                    <label className="text-sm font-semibold text-foreground block pl-1">Tùy chọn cho danh sách</label>
                    <div className="flex gap-2">
                      <input 
                        value={newOption}
                        onChange={e => setNewOption(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddOption(e)}
                        placeholder="Nhập giá trị và nhấn Enter..."
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm shadow-sm">
                            <span>{opt}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveOption(i)} 
                              className="p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Giới hạn block */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block pl-1">Giới hạn dữ liệu</label>
                    <select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option>Không dùng</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex justify-between block pl-1">
                      Giới hạn ký tự
                      <span className="text-muted-foreground/50 border border-muted-foreground/30 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] cursor-help">?</span>
                    </label>
                    <input 
                      placeholder="Tối đa 256 ký tự"
                      disabled
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm outline-none opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <Switch checked={isRequired} onCheckedChange={setIsRequired} id="is-required" />
                    <label htmlFor="is-required" className="text-sm font-medium cursor-pointer">Dữ liệu bắt buộc</label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={includeLabel} onCheckedChange={setIncludeLabel} id="include-label" />
                    <label htmlFor="include-label" className="text-sm font-medium cursor-pointer">Bao gồm nhãn cho hộp ký tự</label>
                  </div>
                </div>

                {/* Giá trị mặc định */}
                <div className="space-y-1.5 pt-2 focus-within:text-primary transition-colors">
                  <label className="text-xs font-semibold text-muted-foreground block pl-1">Giá trị mặc định</label>
                  <input 
                    value={defaultValue}
                    onChange={e => setDefaultValue(e.target.value)}
                    placeholder="Tối đa 256 ký tự"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-background shrink-0 gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors text-sm"
          >
            Hủy
          </button>
          <button 
            disabled={submitting || !label.trim()}
            onClick={handleAdd}
            className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
          >
            Lưu
          </button>
        </div>

      </motion.div>
    </div>
  );
}
