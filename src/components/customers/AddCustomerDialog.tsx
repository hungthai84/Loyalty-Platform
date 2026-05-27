import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { toast } from 'sonner';
import { X, Building2, Facebook, Link2, Linkedin, Instagram, Play, Upload } from 'lucide-react';
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
  const [activityStatus, setActivityStatus] = useState('NEW_MEMBER');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Firebase custom document sizes can handle Base64 strings. Let's limit image to ~1.5MB for robustness and faster loadtimes.
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      toast.success("Tải ảnh lên thành công!");
    };
    reader.onerror = () => {
      toast.error("Có lỗi xảy ra khi đọc tệp ảnh.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Họ và tên là bắt buộc");

    setSubmitting(true);
    const customerId = `CUS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const path = `users/${user.uid}/customers/${customerId}`;

    // Select default avatar if empty
    const finalAvatar = avatarUrl;

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
                    {attributes.map(attr => {
                      const value = customFields[attr.key] || '';
                      
                      return (
                        <div key={attr.id} className="space-y-1.5 col-span-2 md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            {attr.label}
                            {attr.isRequired && <span className="text-destructive">*</span>}
                          </label>
                          
                          {attr.type === 'textarea' ? (
                            <textarea 
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-y"
                              placeholder={attr.placeholder}
                              value={value}
                              onChange={e => setCustomFields({ ...customFields, [attr.key]: e.target.value })}
                            />
                          ) : attr.type === 'select' ? (
                            <select
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                              value={value}
                              onChange={e => setCustomFields({ ...customFields, [attr.key]: e.target.value })}
                            >
                              <option value="">-- Chọn --</option>
                              {attr.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : attr.type === 'radio' ? (
                            <div className="flex flex-wrap gap-3 pt-1">
                              {attr.options?.map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                                  <input 
                                    type="radio" 
                                    name={attr.key} 
                                    value={opt} 
                                    checked={value === opt}
                                    onChange={e => setCustomFields({ ...customFields, [attr.key]: e.target.value })}
                                    className="accent-primary w-3.5 h-3.5"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : attr.type === 'checkbox' ? (
                            <div className="flex flex-wrap gap-3 pt-1">
                              {attr.options?.map(opt => {
                                const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
                                const isChecked = currentValues.includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                                    <input 
                                      type="checkbox" 
                                      value={opt} 
                                      checked={isChecked}
                                      onChange={e => {
                                        const newValues = isChecked 
                                          ? currentValues.filter(v => v !== opt)
                                          : [...currentValues, opt];
                                        setCustomFields({ ...customFields, [attr.key]: newValues });
                                      }}
                                      className="accent-primary w-3.5 h-3.5 rounded-sm"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <input 
                              type={attr.type === 'number' ? 'number' : attr.type === 'time' ? 'time' : attr.type === 'date' ? 'date' : 'text'}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                              placeholder={attr.placeholder}
                              value={value}
                              onChange={e => setCustomFields({
                                ...customFields,
                                [attr.key]: attr.type === 'number' ? Number(e.target.value) : e.target.value
                              })}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* HÌNH ẢNH & MẠNG XÃ HỘI (Cột 2) */}
            <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-border/40">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b">2. Ảnh đại diện & Mạng xã hội</h4>
              
              {/* Avatar Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase text-muted-foreground block">Ảnh đại diện</span>
                  <div className="relative">
                    <input 
                      type="file"
                      id="customer-dialog-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="customer-dialog-upload"
                      className="text-[10px] font-bold uppercase py-1 px-2.5 bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/30 text-[#2f6cf5] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3 h-3" /> Tự tải từ thiết bị
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-border overflow-hidden bg-primary/10 shrink-0 shadow-sm flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      name ? name.slice(0, 2) : "KH"
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input 
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-... hoặc Base64"
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
