import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import * as motion from 'motion/react-client';
import { RedemptionRule } from '@/types';
import { saveGuestRedemptionRule, deleteGuestRedemptionRule } from '@/data/guestData';

interface RedemptionRuleDialogProps {
  onClose: () => void;
  rule?: RedemptionRule;
}

export function RedemptionRuleDialog({ onClose, rule }: RedemptionRuleDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState(rule?.name || '');
  const [pointsRequired, setPointsRequired] = useState(rule?.pointsRequired || 100);
  const [rewardValue, setRewardValue] = useState(rule?.rewardValue || 5);
  const [rewardType, setRewardType] = useState<RedemptionRule['rewardType']>(rule?.rewardType || 'discount');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");

    setSubmitting(true);
    const id = rule?.id || `RULE-${Date.now()}`;

    const newRule: RedemptionRule = {
      id,
      name,
      pointsRequired: Number(pointsRequired),
      rewardValue: Number(rewardValue),
      rewardType,
      userId: user?.uid || 'guest',
      createdAt: rule?.createdAt || new Date().toISOString(),
    };

    try {
      if (!user) {
        saveGuestRedemptionRule(newRule);
        toast.success(rule ? "Đã cập nhật quy tắc (dùng thử)" : "Đã tạo quy tắc mới (dùng thử)");
        onClose();
        return;
      }

      const path = `users/${user.uid}/redemptionRules/${id}`;
      await setDoc(doc(db, path), {
        ...newRule,
        createdAt: rule?.createdAt || serverTimestamp(),
      });
      toast.success(rule ? "Đã cập nhật quy tắc" : "Đã tạo quy tắc mới");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user?.uid || "guest"}/redemptionRules/${id}`);
      toast.error("Không thể lưu quy tắc");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!rule) return;
    if (!confirm("Bạn có chắc chắn muốn xóa quy tắc này không?")) return;

    try {
      if (!user) {
        deleteGuestRedemptionRule(rule.id);
        toast.success("Đã xóa quy tắc (dùng thử)");
        onClose();
        return;
      }

      const path = `users/${user.uid}/redemptionRules/${rule.id}`;
      await deleteDoc(doc(db, path));
      toast.success("Đã xóa quy tắc");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user?.uid || "guest"}/redemptionRules/${rule.id}`);
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
          <h3 className="text-xl font-bold font-heading">{rule ? 'Chỉnh sửa Quy tắc' : 'Quy tắc đổi điểm mới'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên phần thưởng</label>
            <input 
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="v.d. Giảm giá 5$"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại phần thưởng</label>
              <select 
                className="w-full px-3 py-2 bg-background border border-border rounded-md outline-none"
                value={rewardType}
                onChange={e => setRewardType(e.target.value as any)}
              >
                <option value="discount">Giảm giá ($)</option>
                <option value="voucher">Voucher (%)</option>
                <option value="item">Quà hiện vật</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá trị</label>
              <input 
                type="number"
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
                value={rewardValue}
                onChange={e => setRewardValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Điểm yêu cầu</label>
            <input 
              type="number"
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              value={pointsRequired}
              onChange={e => setPointsRequired(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Số điểm cần thiết để đổi phần thưởng này.</p>
          </div>

          <div className="pt-6 flex gap-3">
            {rule && (
              <button 
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-destructive border border-destructive/20 rounded-md text-sm font-medium hover:bg-destructive/10 transition-colors"
              >
                Xóa
              </button>
            )}
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
              {submitting ? 'Đang lưu...' : (rule ? 'Cập nhật' : 'Tạo quy tắc')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
