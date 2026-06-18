import React, { useState } from "react";
import { 
  X, 
  Save, 
  Trash2, 
  Coins, 
  Star, 
  Share2, 
  Gift, 
  Camera, 
  Heart,
  Scissors,
  UserPlus, 
  CalendarHeart, 
  ShoppingBag, 
  Target, 
  Trophy, 
  TrendingUp, 
  ThumbsUp, 
  Youtube, 
  Search, 
  MessageSquareQuote, 
  Puzzle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { EarnRule } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveGuestEarnRule, deleteGuestEarnRule } from "@/data/guestData";

interface EarnRuleDialogProps {
  onClose: () => void;
  rule?: EarnRule;
}

const EARN_CATEGORIES = [
  {
    id: "account",
    title: "Tài khoản",
    items: [
      { id: "signup", label: "Trở thành thành viên", icon: UserPlus, color: "text-emerald-500", description: "Tặng điểm đăng ký" }
    ]
  },
  {
    id: "customer_details",
    title: "Thông tin chi tiết",
    items: [
      { id: "anniversary", label: "Kỷ niệm ngày cưới", icon: CalendarHeart, color: "text-pink-500", description: "Kỷ niệm ngày đặc biệt" },
      { id: "birthday", label: "Kỷ niệm sinh nhật", icon: Gift, color: "text-rose-500", description: "Quà tặng sinh nhật" }
    ]
  },
  {
    id: "referral",
    title: "Giới thiệu",
    items: [
      { id: "referral", label: "Giới thiệu bạn bè", icon: Share2, color: "text-blue-500", description: "Mời bạn bè thành công" },
      { id: "referral_purchase", label: "Mua hàng giới thiệu", icon: ShoppingBag, color: "text-emerald-500", description: "Người được mời mua hàng" }
    ]
  },
  {
    id: "purchase",
    title: "Mua hàng",
    items: [
      { id: "purchase", label: "Mua hàng", icon: Coins, color: "text-emerald-500", description: "Tích điểm theo đơn hàng" },
      { id: "purchase_quantity", label: "Mục tiêu SL mua", icon: Target, color: "text-indigo-500", description: "Đạt mốc số lượng" },
      { id: "beat_best", label: "Vượt kỷ lục", icon: Trophy, color: "text-amber-500", description: "Đánh bại giá trị tốt nhất" },
      { id: "purchase_value", label: "Mục tiêu giá trị", icon: TrendingUp, color: "text-amber-600", description: "Đạt mốc giá trị mua" }
    ]
  },
  {
    id: "social",
    title: "Xã hội",
    items: [
      { id: "social_share", label: "Chia sẻ nội dung", icon: Heart, color: "text-pink-500", description: "Share Fb/X/IG..." },
      { id: "social_follow", label: "Theo dõi Kênh", icon: ThumbsUp, color: "text-blue-600", description: "Follow channel" },
      { id: "youtube_sub", label: "Đăng ký YouTube", icon: Youtube, color: "text-red-500", description: "Sub Youtube" }
    ]
  },
  {
    id: "reviews",
    title: "Nhận xét",
    items: [
      { id: "review", label: "Review sản phẩm", icon: Star, color: "text-yellow-500", description: "Review cơ bản" },
      { id: "review_google", label: "Đánh giá Google", icon: Search, color: "text-blue-500", description: "Google reviews" },
      { id: "testimonial", label: "Lời chứng thực", icon: MessageSquareQuote, color: "text-teal-600", description: "Khách hàng xác thực" }
    ]
  },
  {
    id: "other",
    title: "Khác",
    items: [
      { id: "custom_task", label: "Nhiệm vụ tùy chỉnh", icon: Puzzle, color: "text-slate-500", description: "Thiết lập nhiệm vụ tùy ý" },
      { id: "ai_styling", label: "Dùng tính năng AI", icon: Scissors, color: "text-indigo-500", description: "Tặng điểm khi xài tech" },
      { id: "checkin", label: "Check-in Sự kiện", icon: Camera, color: "text-purple-500", description: "Sự kiện offline" }
    ]
  }
];

export function EarnRuleDialog({ onClose, rule }: EarnRuleDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [type, setType] = useState<string>(rule?.type || "purchase");
  const [points, setPoints] = useState(rule?.points || 0);
  const [value, setValue] = useState(rule?.value || 0);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    account: true,
    customer_details: true,
    referral: true,
    purchase: true,
    social: true,
    reviews: true,
    other: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || points <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    const id = rule?.id || Math.random().toString(36).substring(7);
    const ruleData: EarnRule = {
      id,
      name,
      description,
      type,
      points: Number(points),
      value: type === "purchase" ? Number(value) : 0,
      isActive,
      userId: user?.uid || "guest",
      createdAt: rule?.createdAt || new Date().toISOString(),
    };

    try {
      if (!user) {
        saveGuestEarnRule(ruleData);
        toast.success(rule ? "Đã cập nhật quy tắc (dùng thử)" : "Đã tạo quy tắc mới (dùng thử)");
        onClose();
        return;
      }

      await setDoc(doc(db, `earn_rules`, id), {
        ...ruleData,
        createdAt: rule?.createdAt || serverTimestamp(),
      });
      toast.success(rule ? "Đã cập nhật quy tắc" : "Đã tạo quy tắc mới");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!rule) return;
    if (!confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) return;

    setSubmitting(true);
    try {
      if (!user) {
        deleteGuestEarnRule(rule.id);
        toast.success("Đã xóa quy tắc (dùng thử)");
        onClose();
        return;
      }

      await deleteDoc(doc(db, `earn_rules`, rule.id));
      toast.success("Đã xóa quy tắc");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa quy tắc");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-[10px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="text-xl font-bold font-heading">
            {rule ? "Sửa quy tắc tích điểm" : "Chọn một nhiệm vụ & thiết lập"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loại hoạt động</label>
            <div className="space-y-4">
              {EARN_CATEGORIES.map((category) => (
                <div key={category.id} className="border border-border/80 rounded-[10px] overflow-hidden bg-muted/10">
                  <button 
                    type="button" 
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors font-bold text-sm text-foreground"
                  >
                    {category.title}
                    {expandedCategories[category.id] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  
                  {expandedCategories[category.id] && (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-border/50">
                      {category.items.map((t) => {
                        const Icon = t.icon;
                        const isSelected = type === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setType(t.id);
                              if (!name) setName(t.label);
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-[10px] border transition-all text-center gap-2 h-full",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary" 
                                : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 bg-background"
                            )}
                          >
                            <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : t.color)} />
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold leading-tight block">{t.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 pt-4 border-t border-border/50">
            <h4 className="font-bold text-base text-foreground">Thiết lập điểm thưởng</h4>
            <div className="space-y-4 bg-muted/20 p-5 rounded-[10px] border border-border/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên quy tắc hiển thị</label>
                <input 
                  autoFocus
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ví dụ: Đánh giá App tặng 500 điểm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả (Ghi chú)</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[80px]"
                  placeholder="Nhập mô tả chi tiết cho nhiệm vụ này..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số điểm thưởng</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full pl-4 pr-12 py-2.5 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={points}
                      onChange={e => setPoints(Number(e.target.value))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Điểm</span>
                  </div>
                </div>
                {type === "purchase" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cho mỗi chi tiêu ($)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={value}
                        onChange={e => setValue(Number(e.target.value))}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-[10px] border border-border/50">
              <input 
                type="checkbox" 
                id="active"
                className="w-5 h-5 rounded-[10px] text-primary focus:ring-primary border-border"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              <label htmlFor="active" className="text-sm font-medium">Kích hoạt nhiệm vụ này ngay lập tức</label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/10 shrink-0">
          {rule ? (
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={submitting}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors"
              title="Xóa quy tắc"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : <div />}
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 border border-border rounded-[10px] text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-[10px] text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Đang lưu..." : "Lưu nhiệm vụ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
