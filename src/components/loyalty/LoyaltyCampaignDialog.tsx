import React, { useState } from "react";
import { X, Save, Trash2, Calendar, Clock, Trophy, Mail, Zap, Gift } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { LoyaltyCampaign } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveGuestCampaign, deleteGuestCampaign } from "@/data/guestData";

interface LoyaltyCampaignDialogProps {
  onClose: () => void;
  campaign?: LoyaltyCampaign;
}

const CAMPAIGN_TYPES = [
  { id: 'birthday', label: 'Sinh nhật', icon: Gift, color: 'text-rose-500', description: 'Tự động tặng quà ngày sinh nhật' },
  { id: 'anniversary', label: 'Kỷ niệm gia nhập', icon: Calendar, color: 'text-blue-500', description: 'Tặng quà tròn 1 năm thành viên' },
  { id: 'winback', label: 'Dự báo rời bỏ', icon: Zap, color: 'text-amber-500', description: 'Gửi ưu đãi sau 90 ngày không mua' },
  { id: 'milestone', label: 'Cán mốc đơn hàng', icon: Trophy, color: 'text-yellow-500', description: 'Tặng quà khi đạt số đơn hàng nhất định' },
  { id: 'event', label: 'Sự kiện đặc biệt', icon: Clock, color: 'text-purple-500', description: 'Chiến dịch thời gian giới hạn' },
];

export function LoyaltyCampaignDialog({ onClose, campaign }: LoyaltyCampaignDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState(campaign?.name || '');
  const [type, setType] = useState<LoyaltyCampaign['type']>(campaign?.type || 'birthday');
  const [rewardType, setRewardType] = useState<LoyaltyCampaign['rewardType']>(campaign?.rewardType || 'points');
  const [rewardValue, setRewardValue] = useState(campaign?.rewardValue || 0);
  const [description, setDescription] = useState(campaign?.description || '');
  const [isActive, setIsActive] = useState(campaign?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || rewardValue <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    const id = campaign?.id || Math.random().toString(36).substring(7);
    const data: LoyaltyCampaign = {
      id,
      name,
      type,
      rewardType,
      rewardValue: Number(rewardValue),
      description,
      isActive,
      userId: user?.uid || "guest",
      createdAt: campaign?.createdAt || new Date().toISOString(),
    };

    try {
      if (!user) {
        saveGuestCampaign(data);
        toast.success(campaign ? "Đã cập nhật chiến dịch (dùng thử)" : "Đã tạo chiến dịch mới (dùng thử)");
        onClose();
        return;
      }

      await setDoc(doc(db, `users/${user.uid}/loyaltyCampaigns`, id), {
        ...data,
        createdAt: campaign?.createdAt || serverTimestamp(),
      });
      toast.success(campaign ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch tự động mới");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    if (!confirm("Xóa chiến dịch tự động này?")) return;
    setSubmitting(true);
    try {
      if (!user) {
        deleteGuestCampaign(campaign.id);
        toast.success("Đã xóa chiến dịch (dùng thử)");
        onClose();
        return;
      }

      await deleteDoc(doc(db, `users/${user.uid}/loyaltyCampaigns`, campaign.id));
      toast.success("Đã xóa chiến dịch");
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
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
            <h3 className="text-xl font-bold font-heading">
              {campaign ? "Sửa chiến dịch tự động" : "Tạo chiến dịch Loyalty AI"}
            </h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CAMPAIGN_TYPES.map((t) => {
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
                    <span className="text-[10px] font-bold uppercase leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên chương trình</label>
                <input 
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ví dụ: Tri ân 1 năm gắn bó"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hình thức thưởng</label>
                  <select 
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    value={rewardType}
                    onChange={e => setRewardType(e.target.value as any)}
                  >
                    <option value="points">Tặng điểm (PTS)</option>
                    <option value="voucher">Voucher giảm giá (%)</option>
                    <option value="gift">Quà hiện vật</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giá trị thưởng</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                    value={rewardValue}
                    onChange={e => setRewardValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lời nhắn chúc mừng (Tự động gửi)</label>
                <textarea 
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                  placeholder="Chúc mừng sinh nhật, Eleanor! SEVA dành tặng bạn món quà đặc biệt..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/10">
            {campaign ? (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={submitting}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Hủy</button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center disabled:opacity-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                {submitting ? "Đang xử lý..." : "Kích hoạt Automation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
