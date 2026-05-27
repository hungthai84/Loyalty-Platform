import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Customer, Company, AttributeDefinition } from '@/types';
import { toast } from 'sonner';
import { 
  ArrowLeft, Gift, Shield, User, Phone, Mail, Calendar, 
  Facebook, Linkedin, Instagram, Landmark, Plus, Minus, 
  Sparkles, Check, Edit2, CheckCircle2, Award, ExternalLink,
  MessageSquare, Heart, RefreshCw, Smartphone, Upload
} from 'lucide-react';
import * as motion from 'motion/react-client';
import { CUSTOMER_STATUSES } from '@/data/customerStatuses';

// Mock high-end transactions for demo purposes
const MOCK_CRM_ACTIVITIES = [
  { id: '1', type: 'order', content: 'Mua sắm bộ sưu tập Hè Atelier Premium', value: '+35.000.000 ₫', points: '+350 pts', date: 'Hôm qua, 14:20' },
  { id: '2', type: 'reward', content: 'Đổi Voucher ẩm thực đặc quyền tại Private Lounge', value: '-1.000 pts', points: '-1000 pts', date: '22/05/2026' },
  { id: '3', type: 'event', content: 'Tham gia Sự kiện Private Showcase Atelier', value: 'Đăng ký VIP', points: '+200 pts', date: '18/05/2026' },
  { id: '4', type: 'referral', content: 'Giới thiệu thành viên mới liên kết thẻ VIP', value: 'Mã REF-302', points: '+150 pts', date: '10/05/2026' },
];

interface CustomerDashboardProps {
  customer: Customer;
  userId: string;
  companies: Company[];
  attributes: AttributeDefinition[];
  onBack: () => void;
}

export function CustomerDashboard({ customer, userId, companies, attributes, onBack }: CustomerDashboardProps) {
  const [points, setPoints] = useState(customer.points || 0);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  
  // Local edit states
  const [fb, setFb] = useState(customer.facebook || '');
  const [zl, setZl] = useState(customer.zalo || '');
  const [li, setLi] = useState(customer.linkedin || '');
  const [ig, setIg] = useState(customer.instagram || '');
  const [tt, setTt] = useState(customer.tiktok || '');
  const [avatar, setAvatar] = useState(customer.avatarUrl || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [email, setEmail] = useState(customer.email || '');

  const company = companies.find(c => c.id === customer.companyId);

  // Calculate membership tier locally
  const getTierInfo = (pts: number) => {
    if (pts >= 2500) {
      return { name: 'Atelier (Thượng lưu)', nextTarget: 'Tối đa', progress: 100, color: 'text-[#2f6cf5] border-[#2f6cf5]', bg: 'bg-[#2f6cf5]/10' };
    } else if (pts >= 1000) {
      return { name: 'Icon (Vàng VIP)', nextTarget: `${2500 - pts} pts nâng Atelier`, progress: (pts / 2500) * 100, color: 'text-yellow-500 border-yellow-500', bg: 'bg-yellow-500/10' };
    } else if (pts >= 500) {
      return { name: 'Essential (Hạng Bạc)', nextTarget: `${1000 - pts} pts nâng Icon`, progress: (pts / 1000) * 100, color: 'text-sky-500 border-sky-500', bg: 'bg-sky-500/10' };
    } else {
      return { name: 'Member (Hạng Phổ thông)', nextTarget: `${500 - pts} pts nâng Essential`, progress: (pts / 500) * 100, color: 'text-slate-400 border-slate-400', bg: 'bg-slate-400/10' };
    }
  };

  const tier = getTierInfo(points);

  const updateFirestore = async (updatedData: Partial<Customer>, successMessage?: string) => {
    const docRef = doc(db, `users/${userId}/customers/${customer.id}`);
    const toastId = toast.loading("Đang lưu thông tin...");
    try {
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      if (successMessage) {
        toast.success(successMessage, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
      return true;
    } catch (error) {
      console.error("Error updating customer config: ", error);
      toast.error("Không thể lưu cấu hình đến cloud", { id: toastId });
      return false;
    }
  };

  const handleAdjustPoints = async (amount: number) => {
    const newPts = Math.max(0, points + amount);
    setPoints(newPts);
    const successMsg = `${amount > 0 ? 'Thêm' : 'Khấu trừ'} ${Math.abs(amount)} điểm thành công!`;
    await updateFirestore({ points: newPts }, successMsg);
  };

  const handleSaveSocialLinks = async () => {
    setIsEditingSocial(false);
    await updateFirestore({
      facebook: fb,
      zalo: zl,
      linkedin: li,
      instagram: ig,
      tiktok: tt,
    }, "Đã đồng bộ mạng xã hội của khách hàng!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success("Tải ảnh lên thành công!");
    };
    reader.onerror = () => {
      toast.error("Có lỗi xảy ra khi đọc tệp ảnh.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileHeader = async () => {
    setIsUpdatingField(false);
    await updateFirestore({
      avatarUrl: avatar,
      phone,
      email
    }, "Cập nhật thông tin thành công!");
  };

  // Helper matching the status definition config colors
  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-xs text-muted-foreground">Mới</span>;
    const matched = CUSTOMER_STATUSES.find(s => s.code.toUpperCase() === status.toUpperCase());
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${matched ? matched.color.badge : 'bg-muted text-muted-foreground'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {matched?.classification || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-sidebar-accent text-sm font-semibold hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" /> Trở lại danh sách KH
        </button>

        <div className="text-xs text-muted-foreground font-mono">
          ID: {customer.id} (Tạo: {customer.createdAt?.toDate?.()?.toLocaleDateString('vi-VN') || 'Vừa xong'})
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI - CRM PROFILE CARD */}
        <div className="space-y-6 lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 backdrop-blur-md p-6 relative overflow-hidden shadow-xl"
          >
            {/* Elegant luxury gold visual overlay background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2f6cf5]/5 blur-3xl rounded-full" />
            
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl border-2 border-[#2f6cf5]/30 overflow-hidden bg-background shadow-lg transition-transform hover:scale-105 duration-300">
                  <img 
                    src={avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(customer.name)}`} 
                    className="w-full h-full object-cover" 
                    alt={customer.name} 
                    onError={(e) => { (e.target as any).src = "https://api.dicebear.com/7.x/pixel-art/svg"; }}
                  />
                </div>
                {!isUpdatingField && (
                  <button 
                    onClick={() => setIsUpdatingField(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-background border border-border rounded-xl shadow-md hover:text-primary transition-all text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">{customer.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{company?.name || 'Thành viên Cá nhân'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center">
                {renderStatusBadge(customer.activityStatus)}
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${tier.color} ${tier.bg}`}>
                  🏆 {tier.name}
                </span>
              </div>
            </div>

            {/* Editing avatar, email, phone */}
            {isUpdatingField ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t pt-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-[#2f6cf5] tracking-wider mb-2">Sửa thông tin cơ bản</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-muted-foreground block font-bold">ẢNH ĐẠI DIỆN LINK</span>
                    <div>
                      <input 
                        type="file"
                        id="dashboard-avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="dashboard-avatar-upload"
                        className="text-[8px] font-bold uppercase py-0.5 px-2 bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/30 text-[#2f6cf5] rounded-md cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Upload className="w-2.5 h-2.5" /> Tải từ máy
                      </label>
                    </div>
                  </div>
                  <input 
                    className="w-full p-2 text-xs bg-background border rounded-lg focus:ring-1 focus:ring-primary/20 outline-none font-mono"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/... hoặc Base64"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground block font-bold">SỐ ĐIỆN THOẠI</span>
                  <input 
                    className="w-full p-2 text-xs bg-background border rounded-lg focus:ring-1 focus:ring-primary/20 outline-none"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground block font-bold">EMAIL KHÁCH HÀNG</span>
                  <input 
                    className="w-full p-2 text-xs bg-background border rounded-lg focus:ring-1 focus:ring-primary/20 outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsUpdatingField(false)} 
                    className="flex-1 py-1.5 border rounded-lg text-xs hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveProfileHeader}
                    className="flex-1 py-1.5 bg-[#2f6cf5] text-white rounded-lg text-xs font-bold"
                  >
                    Lưu hồ sơ
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 border-t border-border/40 pt-6 space-y-4 text-xs font-medium">
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span>{phone || 'Chưa cung cấp SĐT'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span className="truncate">{email || 'Chưa có email'}</span>
                </div>
                {company && (
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 pt-3">
                    <Landmark className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{company.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{company.address || 'Không địa chỉ'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* CUSTOM ATTRIBUTES LIST CONTAINER */}
          {attributes.length > 0 && (
            <div className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest border-b pb-2">Thuộc tính mở rộng</h4>
              <div className="space-y-2">
                {attributes.map(attr => (
                  <div key={attr.id} className="flex justify-between items-center bg-background/50 p-2 rounded-xl text-xs">
                    <span className="text-muted-foreground font-medium">{attr.label}</span>
                    <span className="font-bold text-foreground">
                      {customer.customFields?.[attr.key]?.toString() || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT GIỮA & CỘT PHẢI - TOÀN CẢNH ENGAGEMENT ENGINE */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* LOYALTY ENGINE DYNAMIC VISUALIZER CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Interactive Points Control Box */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#2f6cf5]/30 bg-sidebar/75 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden"
            >
              {/* Golden glow decorative bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2f6cf5]" />
              
              <div>
                <span className="text-[10px] font-bold text-[#2f6cf5] uppercase tracking-widest block">QUỸ LOYALTY POINTS</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">{points.toLocaleString()}</span>
                  <span className="text-xs font-bold text-[#2f6cf5]">pts</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Ngân quỹ điểm được tích lũy thông qua giao dịch, các cột mốc chi tiêu và tương tác xã hội.
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 mt-4">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-2">Cập nhật nhanh điểm số (Simulate)</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustPoints(-50)}
                    className="flex-1 py-1 px-3 border border-border bg-background rounded-xl text-xs hover:bg-muted font-bold flex items-center justify-center gap-1 transition-all text-rose-500"
                  >
                    <Minus className="w-3 h-3" /> -50 pt
                  </button>
                  <button 
                    onClick={() => handleAdjustPoints(50)}
                    className="flex-1 py-1 px-3 border border-border bg-background rounded-xl text-xs hover:bg-muted font-bold flex items-center justify-center gap-1 transition-all text-emerald-500"
                  >
                    <Plus className="w-3 h-3" /> +50 pt
                  </button>
                  <button 
                    onClick={() => handleAdjustPoints(200)}
                    className="flex-1 py-1 px-2 border border-[#2f6cf5]/40 bg-[#2f6cf5]/5 rounded-xl text-xs hover:bg-[#2f6cf5]/10 font-bold flex items-center justify-center gap-1 transition-all text-[#2f6cf5]"
                  >
                    <Sparkles className="w-3 h-3" /> +200 pt
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Loyalty tier roadmap & meter */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 flex flex-col justify-between shadow-md"
            >
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">LỘ TRÌNH ĐẶC QUYỀN VIP</span>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground capitalize">{tier.name.split(" ")[0]} Member</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{tier.nextTarget}</span>
                </div>

                {/* Meter road bar */}
                <div className="w-full bg-muted rounded-full h-2.5 mt-2 overflow-hidden relative">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-[#2f6cf5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[8px] text-muted-foreground font-bold mt-1 uppercase">
                  <span>Member (0 pt)</span>
                  <span>Essential (500 pt)</span>
                  <span>Icon (1k pt)</span>
                  <span>Atelier (2.5k pt)</span>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-2xl border border-border/40 mt-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2f6cf5]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-foreground">Sử dụng điểm đổi quà cao cấp</p>
                  <p className="text-[9px] text-muted-foreground">Phòng chờ VIP, Sự kiện kín tại showroom</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SOCIAL NETWORK INTEGRATION GRAPH & LINKS (MỤC LIÊN KẾT TẤT CẢ NỀN TẢNG) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">KỸ THUẬT SỐ & MẠNG XÃ HỘI CONNECTED</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Xác thực tài khoản và liên kết dữ liệu đa điểm của khách hàng.</p>
              </div>
              <button 
                onClick={() => {
                  if (isEditingSocial) {
                    handleSaveSocialLinks();
                  } else {
                    setIsEditingSocial(true);
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                  isEditingSocial 
                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {isEditingSocial ? 'Lưu chỉnh sửa ✓' : 'Sửa liên kết ✎'}
              </button>
            </div>

            {isEditingSocial ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">FB / Messenger Link</span>
                  <input className="w-full p-2 text-xs bg-background border rounded-lg" value={fb} onChange={e => setFb(e.target.value)} placeholder="Link Facebook" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Zalo Sđt / Profile URL</span>
                  <input className="w-full p-2 text-xs bg-background border rounded-lg" value={zl} onChange={e => setZl(e.target.value)} placeholder="0901234567 hoặc link" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">LinkedIn URL</span>
                  <input className="w-full p-2 text-xs bg-background border rounded-lg" value={li} onChange={e => setLi(e.target.value)} placeholder="Link LinkedIn" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Instagram Handler</span>
                  <input className="w-full p-2 text-xs bg-background border rounded-lg" value={ig} onChange={e => setIg(e.target.value)} placeholder="Link Instagram" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">TikTok Profile</span>
                  <input className="w-full p-2 text-xs bg-background border rounded-lg" value={tt} onChange={e => setTt(e.target.value)} placeholder="Link TikTok" />
                </div>
              </div>
            ) : (
              /* High-fidelity interconnected visual graph of socials */
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Facebook Node */}
                <div className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  fb ? 'bg-blue-600/5 border-blue-600/20 text-blue-600' : 'bg-muted/10 border-border/40 text-muted-foreground'
                }`}>
                  <Facebook className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold block truncate max-w-full">Facebook</span>
                  {fb ? (
                    <a href={fb.startsWith('http') ? fb : `https://${fb}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-extrabold flex items-center gap-0.5 hover:underline uppercase text-blue-700">
                      Liên kết <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-[8px] font-extrabold uppercase opacity-40">Trống</span>
                  )}
                </div>

                {/* Zalo Node */}
                <div className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  zl ? 'bg-sky-500/5 border-sky-500/20 text-sky-600' : 'bg-muted/10 border-border/40 text-muted-foreground'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center mb-2 font-sans">Z</div>
                  <span className="text-[10px] font-bold block truncate max-w-full">Zalo Chat</span>
                  {zl ? (
                    <a href={zl.startsWith('http') ? zl : `https://zalo.me/${zl}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-extrabold flex items-center gap-0.5 hover:underline uppercase text-sky-700">
                      Mở Zalo <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-[8px] font-extrabold uppercase opacity-40">Trống</span>
                  )}
                </div>

                {/* LinkedIn Node */}
                <div className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  li ? 'bg-blue-700/5 border-blue-700/20 text-blue-700' : 'bg-muted/10 border-border/40 text-muted-foreground'
                }`}>
                  <Linkedin className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold block truncate max-w-full">LinkedIn</span>
                  {li ? (
                    <a href={li.startsWith('http') ? li : `https://${li}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-extrabold flex items-center gap-0.5 hover:underline uppercase text-blue-800">
                      Hồ sơ <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-[8px] font-extrabold uppercase opacity-40">Trống</span>
                  )}
                </div>

                {/* Instagram Node */}
                <div className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  ig ? 'bg-pink-600/5 border-pink-600/20 text-pink-600' : 'bg-muted/10 border-border/40 text-muted-foreground'
                }`}>
                  <Instagram className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold block truncate max-w-full">Instagram</span>
                  {ig ? (
                    <a href={ig.startsWith('http') ? ig : `https://${ig}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-extrabold flex items-center gap-0.5 hover:underline uppercase text-pink-700">
                      Kênh <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-[8px] font-extrabold uppercase opacity-40">Trống</span>
                  )}
                </div>

                {/* TikTok Node */}
                <div className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                  tt ? 'bg-slate-900/5 border-slate-900/20 text-slate-800 dark:text-slate-200' : 'bg-muted/10 border-border/40 text-muted-foreground'
                }`}>
                  <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-black font-extrabold text-[9px] flex items-center justify-center mb-2 font-mono">♬</div>
                  <span className="text-[10px] font-bold block truncate max-w-full">TikTok</span>
                  {tt ? (
                    <a href={tt.startsWith('http') ? tt : `https://${tt}`} target="_blank" rel="noreferrer" className="mt-2 text-[8px] font-extrabold flex items-center gap-0.5 hover:underline uppercase text-slate-900">
                      Xem k.h <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <span className="mt-2 text-[8px] font-extrabold uppercase opacity-40">Trống</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* CRM TRANSACTION & ACTION HISTORY LOG */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">NHẬT KÝ HÀNH ĐỘNG LOYALTY (JOURNEY LOG)</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Biên niên sử tích/đổi điểm và lịch trình hoạt động trong hệ thống chăm sóc VIP.</p>
            </div>

            <div className="space-y-3">
              {MOCK_CRM_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between bg-background/55 p-3 rounded-2xl border border-border/45 hover:border-[#2f6cf5]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-muted/65 flex items-center justify-center font-bold text-xs text-[#2f6cf5]">
                      {activity.type === 'order' ? '🛒' : activity.type === 'reward' ? '🎁' : '⚡'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{activity.content}</p>
                      <p className="text-[9px] text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold block text-foreground">{activity.value}</span>
                    <span className={`text-[10px] font-bold ${activity.points.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {activity.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
