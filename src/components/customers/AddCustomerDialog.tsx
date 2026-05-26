import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Building2, Facebook, Link2, Linkedin, Instagram, Play } from 'lucide-react';
import * as motion from 'motion/react-client';
import { AttributeDefinition, Company } from '@/types';
import { CUSTOMER_STATUSES } from '@/data/customerStatuses';

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces&q=80",
];

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
  const [activityStatus, setActivityStatus] = useState('ACTIVE');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // New Avatar and Social link states
  const [avatarUrl, setAvatarUrl] = useState('');
  const [facebook, setFacebook] = useState('');
  const [zalo, setZalo] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

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
    if (!name.trim()) return toast.error("Họ và tên là bắt buộc");

    setSubmitting(true);
    const customerId = `CUS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const path = `users/${user.uid}/customers/${customerId}`;

    // Select default avatar if empty
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;

    try {
      await setDoc(doc(db, path), {
        id: customerId,
        name,
        email,
        phone,
        avatarUrl: finalAvatar,
        facebook,
        zalo,
        linkedin,
        instagram,
        tiktok,
        points: Math.floor(Math.random() * 250), // Starter loyalty points
        companyId: selectedCompanyId || null,
        activityStatus,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-sidebar border border-border shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div>
            <h3 className="text-xl font-bold font-heading">Thêm Khách hàng mới</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Hồ sơ cá nhân hóa kết nối các nền tảng mạng xã hội.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* THÔNG TIN CƠ BẢN (Cột 1) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b">1. Thông tin liên hệ</h4>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Họ và tên *</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Địa chỉ Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@vidu.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Số điện thoại</label>
                  <input 
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Công ty
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none text-sm transition-all"
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="">-- Cá nhân --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Phân nhóm trạng thái</label>
                  <select
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none text-sm transition-all"
                    value={activityStatus}
                    onChange={e => setActivityStatus(e.target.value)}
                  >
                    {CUSTOMER_STATUSES.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.classification}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {attributes.length > 0 && (
                <div className="pt-4 border-t mt-4 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider pb-1">Trường thông tin bổ sung</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {attributes.map(attr => (
                      <div key={attr.id} className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">{attr.label}</label>
                        <input 
                          type={attr.type === 'number' ? 'number' : 'text'}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            </div>

            {/* HÌNH ẢNH & MẠNG XÃ HỘI (Cột 2) */}
            <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-border/40">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b">2. Ảnh đại diện & Mạng xã hội</h4>
              
              {/* Avatar Selection */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground block">Ảnh đại diện (Avatar URL)</span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-border overflow-hidden bg-background shrink-0 shadow-sm flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="Preview" onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/pixel-art/svg"; }} />
                    ) : (
                      <div className="text-[10px] text-muted-foreground font-semibold text-center p-1">Tự động tạo</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input 
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <div className="flex gap-1.5">
                      {PRESET_AVATARS.map((p, idx) => (
                        <button 
                          key={idx}
                          type="button" 
                          onClick={() => setAvatarUrl(p)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-white hover:scale-110 active:scale-95 transition-all shadow-xs"
                        >
                          <img src={p} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${name || 'happy'}`)}
                        className="text-[9px] font-bold hover:underline ml-1.5 text-[#D4AF37]"
                      >
                        Tạo Avatar vẽ tay ⚡
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links inputs */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground block">Liên kết mạng xã hội (Social URLs)</span>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Facebook */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <span className="bg-blue-600/10 text-blue-600 p-1 rounded-lg"><Facebook className="w-3.5 h-3.5" /></span>
                      Facebook:
                    </span>
                    <input 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={facebook}
                      onChange={e => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/user..."
                    />
                  </div>

                  {/* Zalo */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <span className="bg-sky-500/10 text-sky-600 px-1 py-0.5 rounded-lg font-bold text-[10px] leading-tight font-sans">Z</span>
                      Zalo Sđt:
                    </span>
                    <input 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={zalo}
                      onChange={e => setZalo(e.target.value)}
                      placeholder="0901234567 hoặc link cá nhân zalo"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <span className="bg-blue-700/10 text-blue-700 p-1 rounded-lg"><Linkedin className="w-3.5 h-3.5" /></span>
                      LinkedIn:
                    </span>
                    <input 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/user..."
                    />
                  </div>

                  {/* Instagram */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <span className="bg-pink-600/10 text-pink-600 p-1 rounded-lg"><Instagram className="w-3.5 h-3.5" /></span>
                      Instagram:
                    </span>
                    <input 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={instagram}
                      onChange={e => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/user..."
                    />
                  </div>

                  {/* TikTok */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <span className="bg-foreground/10 text-foreground p-1 rounded-lg font-bold text-[10px] font-sans">TT</span>
                      TikTok:
                    </span>
                    <input 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={tiktok}
                      onChange={e => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@user..."
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-3 justify-end bg-muted/10 -mx-8 -mb-8 p-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button 
              disabled={submitting}
              className="px-8 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 min-w-[140px]"
            >
              {submitting ? 'Đang lưu...' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
