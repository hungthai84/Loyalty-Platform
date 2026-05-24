import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Building2 } from 'lucide-react';
import * as motion from 'motion/react-client';
import { AttributeDefinition, Company } from '@/types';

interface AddCustomerDialogProps {
  onClose: () => void;
  attributes: AttributeDefinition[];
}

export function AddCustomerDialog({ onClose, attributes }: AddCustomerDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, `users/${user.uid}/companies`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCompanies(snap.docs.map(d => d.data() as Company));
    }, (error) => {
      console.error("Error loading companies:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Name is required");

    setSubmitting(true);
    const customerId = `CUS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const path = `users/${user.uid}/customers/${customerId}`;

    try {
      await setDoc(doc(db, path), {
        id: customerId,
        name,
        email,
        phone,
        companyId: selectedCompanyId || null,
        userId: user.uid,
        customFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Thêm khách hàng thành công");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Không thể thêm khách hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <h3 className="text-xl font-bold font-heading">Thêm Khách hàng mới</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Họ và tên *</label>
            <input 
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Địa chỉ Email</label>
            <input 
              type="email"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@vidu.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <input 
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901234567"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
               <Building2 className="w-4 h-4 text-muted-foreground" /> Thuộc Công ty / Chi nhánh
            </label>
            <select
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
            >
              <option value="">-- Không chọn --</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {attributes.length > 0 && (
            <div className="pt-4 border-t border-border mt-4">
              <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">Thuộc tính tùy chỉnh</h4>
              <div className="space-y-3">
                {attributes.map(attr => (
                  <div key={attr.id} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{attr.label} ({attr.type})</label>
                    <input 
                      type={attr.type === 'number' ? 'number' : 'text'}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm outline-none"
                      value={customFields[attr.key] || ''}
                      onChange={e => setCustomFields({
                        ...customFields,
                        [attr.key]: attr.type === 'number' ? Number(e.target.value) : e.target.value
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button 
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
