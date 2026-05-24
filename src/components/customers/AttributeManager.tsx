import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Plus, Trash2 } from 'lucide-react';
import * as motion from 'motion/react-client';
import { AttributeDefinition } from '@/types';

interface AttributeManagerProps {
  onClose: () => void;
  attributes: AttributeDefinition[];
}

export function AttributeManager({ onClose, attributes }: AttributeManagerProps) {
  const { user } = useFirebase();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<AttributeDefinition['type']>('text');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!label.trim()) return toast.error("Nhãn là bắt buộc");

    const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (attributes.some(a => a.key === key)) return toast.error("Thuộc tính với khóa này đã tồn tại");

    setSubmitting(true);
    const id = `ATTR-${Date.now()}`;
    const path = `users/${user.uid}/attributeDefinitions/${id}`;

    try {
      await setDoc(doc(db, path), {
        id,
        label,
        key,
        type,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Đã thêm thuộc tính");
      setLabel('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Không thể thêm thuộc tính");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Bạn có chắc chắn muốn xóa không? Dữ liệu đã nhập của khách hàng sẽ không bị mất nhưng trường này sẽ bị ẩn đi.")) return;

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <h3 className="text-xl font-bold font-heading">Quản lý Trường tùy chỉnh</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleAdd} className="space-y-4 p-4 border border-dashed border-border rounded-xl bg-muted/10">
            <h4 className="text-sm font-semibold">Thêm thuộc tính mới</h4>
            <div className="grid grid-cols-2 gap-3">
              <input 
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm outline-none"
                placeholder="Nhãn thuộc tính (v.d. Ngày sinh)"
                value={label}
                onChange={e => setLabel(e.target.value)}
              />
              <select 
                className="px-3 py-2 bg-background border border-border rounded-md text-sm outline-none"
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="text">Văn bản</option>
                <option value="number">Số</option>
                <option value="date">Ngày</option>
                <option value="boolean">Đúng/Sai</option>
              </select>
            </div>
            <button 
              disabled={submitting}
              className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm thuộc tính
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Các thuộc tính đang hoạt động</h4>
            {attributes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Chưa có thuộc tính tùy chỉnh nào.</p>
            ) : (
              <div className="space-y-2">
                {attributes.map(attr => (
                  <div key={attr.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                    <div>
                      <p className="font-medium text-sm">{attr.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">Key: {attr.key} • Loại: {attr.type}</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(attr.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/10">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}
