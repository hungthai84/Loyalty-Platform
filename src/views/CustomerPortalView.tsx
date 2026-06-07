import React, { useState, useEffect } from "react";
import { 
 QrCode, 
 Gift, 
 History, 
 User as UserIcon, 
 ArrowLeft, 
 Ticket, 
 CheckCircle2, 
 ShoppingBag, 
 Scissors, 
 Monitor, 
 Moon, 
 Palette,
 Smartphone
} from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RedemptionRule } from "@/types";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface PortalProps {
 onBack?: () => void;
}

export function CustomerPortalView({ onBack }: PortalProps) {
 const { user } = useFirebase();
 const { theme } = useTheme();
 
 const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'history'>('home');
 const [rules, setRules] = useState<RedemptionRule[]>([]);
 const [customerPoints, setCustomerPoints] = useState(125000); // Mocked for demo
 
 // Theme settings state - default to 'system'
 const [portalThemeOption, setPortalThemeOption] = useState<'system' | 'dark'>('system');
 const [portalDeviceOption, setPortalDeviceOption] = useState<'mobile' | 'desktop'>('mobile');
 const [systemIsDark, setSystemIsDark] = useState(false);

 useEffect(() => {
 if (!user || user.isLocal) return;
 const q = query(collection(db, "redemption_rules"), orderBy("pointsRequired", "asc"));
 return onSnapshot(q, (snapshot) => {
  setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RedemptionRule)));
 }, (error) => console.error("Redemption rules error:", error));
 }, [user]);

 // System preferred theme detector
 useEffect(() => {
 if (typeof window !== "undefined" && window.matchMedia) {
 const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
 const onChange = (e: MediaQueryListEvent) => {
 setSystemIsDark(e.matches);
 };
 setSystemIsDark(mediaQuery.matches);
 mediaQuery.addEventListener("change", onChange);
 return () => mediaQuery.removeEventListener("change", onChange);
 }
 }, []);

 // Compute active system theme
 const activeAppTheme = theme === "system" ? (systemIsDark ? 'dark' : 'light') : theme;
 
 // Resolve system state or dark state
 const isPortalDark = portalThemeOption === 'dark' || (portalThemeOption === 'system' && activeAppTheme === 'dark');

 const handleRedeem = (rule: RedemptionRule) => {
 if (customerPoints < rule.pointsRequired) {
 toast.error("Không đủ điểm để đổi ưu đãi này");
 return;
 }
 
 // In a real app, this would create a 'redemption' record and deduct points
 toast.success(`Đã đổi thành công: ${rule.name}`, {
 description: "Mã ưu đãi đã được gửi vào mục Lịch sử của bạn.",
 });
 setCustomerPoints(prev => prev - rule.pointsRequired);
 };

 // Styled design variables based on active portal theme
 const phoneBg = isPortalDark ? "bg-[#0C0C0E]" : "bg-[#F8FAFC]";
 const textPrimary = isPortalDark ? "text-white" : "text-zinc-900";
 const textSecondary = isPortalDark ? "text-zinc-400" : "text-zinc-600";
 const textMuted = isPortalDark ? "text-zinc-500" : "text-zinc-400";
 
 const cardBg = isPortalDark 
 ? "bg-[#161619] border border-white/5 shadow-inner" 
 : "bg-white border border-zinc-200/80 shadow-sm";
 
 const cardHeaderDivider = isPortalDark ? "bg-white/5" : "bg-zinc-200/50";
 
 const buttonBg = isPortalDark 
 ? "bg-[#161619] border border-white/5 hover:bg-[#202024] transition-colors" 
 : "bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-sm";

 const cardGradient = isPortalDark 
 ? "bg-gradient-to-br from-[#1b1b1f] to-[#111113] border border-white/10" 
 : "bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white border border-slate-700/50 shadow-md";

 return (
 <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen space-y-6">
 
 {/* Dynamic Theme Settings Control Panel for Showroom Manager */}
 <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-lg space-y-4">
 <div className="flex items-center justify-between border-b pb-3 border-border/40">
 <div className="flex items-center gap-2">
 <Palette className="w-5 h-5 text-[#2f6cf5]" />
 <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">Định dạng hiển thị cổng VIP</span>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-2.5">
 <button 
 type="button"
 onClick={() => setPortalThemeOption('system')}
 className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
 portalThemeOption === 'system' 
 ? 'border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm' 
 : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30'
 }`}
 >
 <Monitor className="w-4 h-4" />
 Hệ thống ({activeAppTheme === 'dark' ? 'Tối' : 'Sáng'})
 </button>
 <button 
 type="button"
 onClick={() => setPortalThemeOption('dark')}
 className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
 portalThemeOption === 'dark' 
 ? 'border-amber-500 bg-amber-500/5 text-amber-500 font-extrabold shadow-sm' 
 : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30'
 }`}
 >
 <Moon className="w-4 h-4" />
 Tối (Obsidian)
 </button>
 </div>
 </div>

 <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-lg space-y-4">
 <div className="flex items-center justify-between border-b pb-3 border-border/40">
 <div className="flex items-center gap-2">
 <Monitor className="w-5 h-5 text-[#2f6cf5]" />
 <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">Thiết bị hiển thị</span>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-2.5">
 <button 
 type="button"
 onClick={() => setPortalDeviceOption('mobile')}
 className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
 portalDeviceOption === 'mobile' 
 ? 'border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm' 
 : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30'
 }`}
 >
 <Smartphone className="w-4 h-4" />
 Điện thoại
 </button>
 <button 
 type="button"
 onClick={() => setPortalDeviceOption('desktop')}
 className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
 portalDeviceOption === 'desktop' 
 ? 'border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm' 
 : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30'
 }`}
 >
 <Monitor className="w-4 h-4" />
 Máy tính
 </button>
 </div>
 </div>
 </div>

 {/* Mobile/Desktop Frame Simulation */}
 <div className={`w-full ${portalDeviceOption === 'mobile' ? 'max-w-[400px] h-[800px] rounded-[3rem] border-8 border-zinc-800' : 'max-w-5xl h-[800px] rounded-[2rem] border border-border/50'} max-h-[85vh] ${phoneBg} shadow-2xl overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col`}>
 
 {/* Dynamic Island / Notch Simulation */}
 {portalDeviceOption === 'mobile' && (
 <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
 <div className="w-32 h-6 bg-zinc-800 rounded-b-xl"></div>
 </div>
 )}

 {/* Portal Header */}
 <div className="pt-12 pb-4 px-6 relative z-10 flex items-center justify-between">
 <button 
 onClick={activeTab === 'home' ? onBack : () => setActiveTab('home')} 
 className={`${isPortalDark ? 'text-white/60 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'} transition-colors cursor-pointer`}
 >
 <ArrowLeft className="w-5 h-5"/>
 </button>
 <span className="font-heading font-black tracking-widest text-[#2f6cf5]">
 {activeTab === 'home' ? 'SEVA' : activeTab === 'rewards' ? 'ƯU ĐÃI' : 'LỊCH SỬ'}
 </span>
 <div className="w-5"></div>
 </div>

 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto no-scrollbar pb-24 flex justify-center">
 <motion.div 
 key={activeTab}
 initial={{ opacity: 0, x: 10 }}
 animate={{ opacity: 1, x: 0 }}
 className={`px-6 space-y-6 w-full ${portalDeviceOption === 'desktop' ? 'max-w-2xl mt-8' : ''}`}
 >
 {activeTab === 'home' && (
 <>
 {/* Greeting & Points Ratio */}
 <div className="mt-4 text-left">
 <h2 className={`text-3xl font-heading ${textPrimary} leading-tight`}>
 Chào bạn, <br/>
 <span className="text-[#2f6cf5] italic text-4xl">Eleanor.</span>
 </h2>
 <p className={`${textSecondary} mt-2 text-sm`}>Hội viên Atelier</p>
 </div>

 {/* Loyalty Card Element */}
 <div className={`mt-6 aspect-[1.586/1] ${cardGradient} rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between p-6 transition-all duration-300`}>
 <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#2f6cf5] opacity-20 rounded-full blur-3xl"></div>
 
 <div className="flex justify-between items-start relative z-10">
 <span className="font-heading font-extrabold text-[#2f6cf5] tracking-widest text-lg">SEVA</span>
 <QrCode className="text-white/50 w-8 h-8"/>
 </div>

 <div className="relative z-10 text-left">
 <p className="text-xs tracking-[0.2em] text-white/50 uppercase font-bold">Số điểm hiện có</p>
 <p className="text-white text-4xl mt-1 font-black">{customerPoints.toLocaleString()}</p>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-3 gap-3">
 <button 
 onClick={() => setActiveTab('rewards')}
 className={`flex flex-col items-center justify-center p-4 rounded-2xl ${buttonBg} cursor-pointer`}
 >
 <Gift className="w-6 h-6 text-[#2f6cf5] mb-2" />
 <span className={`text-xs ${textPrimary} font-bold tracking-wide uppercase`}>Đổi quà</span>
 </button>
 <button 
 className={`flex flex-col items-center justify-center p-4 rounded-2xl ${buttonBg} cursor-pointer`}
 onClick={() => setActiveTab('history')}
 >
 <History className="w-6 h-6 text-[#2f6cf5] mb-2" />
 <span className={`text-xs ${textPrimary} font-bold tracking-wide uppercase`}>Lịch sử</span>
 </button>
 <button 
 className={`flex flex-col items-center justify-center p-4 rounded-2xl ${buttonBg} cursor-pointer`}
 >
 <UserIcon className="w-6 h-6 text-[#2f6cf5] mb-2" />
 <span className={`text-xs ${textPrimary} font-bold tracking-wide uppercase`}>Hồ sơ</span>
 </button>
 </div>

 {/* VIP & AI Experience Promotion */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className={`${textPrimary} font-bold text-sm`}>Trải nghiệm VIP</h3>
 <button className="text-xs text-[#2f6cf5] font-black uppercase hover:underline">Khám phá</button>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className={isPortalDark ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/20 text-left" : "bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80 text-left"}>
 <Scissors className="w-5 h-5 text-indigo-500 mb-2" />
 <p className={`${isPortalDark ? 'text-white' : 'text-indigo-950'} text-xs font-bold leading-tight`}>AI Stylist</p>
 <p className={`${isPortalDark ? 'text-indigo-300' : 'text-indigo-600'} text-xs mt-1 uppercase font-extrabold tracking-tighter`}>+500 PTS / LẦN</p>
 </div>
 <div className={isPortalDark ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-4 rounded-2xl border border-emerald-500/20 text-left" : "bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80 text-left"}>
 <Ticket className="w-5 h-5 text-emerald-500 mb-2" />
 <p className={`${isPortalDark ? 'text-white' : 'text-emerald-950'} text-xs font-bold leading-tight`}>Trade-in</p>
 <p className={`${isPortalDark ? 'text-emerald-300' : 'text-emerald-600'} text-xs mt-1 uppercase font-extrabold tracking-tighter`}>ƯU TIÊN DIAMOND</p>
 </div>
 </div>
 </div>

 {/* Recent Activity */}
 <div className={`${cardBg} rounded-3xl p-6 transition-colors duration-300`}>
 <div className="flex items-center justify-between mb-6">
 <h3 className={`${textPrimary} font-bold text-sm`}>Hoạt động gần đây</h3>
 <button className="text-xs text-[#2f6cf5] font-black uppercase tracking-wider hover:underline">Xem tất cả</button>
 </div>
 <div className="space-y-6">
 {[
 { title: "Mua sắm tại cửa hàng", date: "Hôm nay, 14:45", points: "+2,400", type: "earn" },
 { title: "Thưởng sinh nhật", date: "12 thg 10, 2023", points: "+1,000", type: "earn" },
 { title: "Đã đổi phần thưởng", date: "10 thg 10, 2023", points: "-5,000", type: "redeem" }
 ].map((act, i) => (
 <React.Fragment key={i}>
 <div className="flex justify-between items-center">
 <div className="flex flex-col text-left">
 <span className={`text-sm ${isPortalDark ? "text-zinc-300" : "text-zinc-800"} font-medium`}>{act.title}</span>
 <span className={`text-xs ${textMuted} mt-1 uppercase tracking-tight`}>{act.date}</span>
 </div>
 <span className={act.type === 'earn' ? 'text-[#2f6cf5] text-sm font-bold' : `${isPortalDark ? 'text-zinc-500' : 'text-zinc-400'} text-sm `}>
 {act.points} pts
 </span>
 </div>
 {i < 2 && <div className={`w-full h-px ${cardHeaderDivider}`}></div>}
 </React.Fragment>
 ))}
 </div>
 </div>

 {/* Simulated Customer Settings Inside the Portal (Option selector inside) */}
 <div className={`${cardBg} rounded-3xl p-6 space-y-4 transition-colors duration-300`}>
 <div className="flex items-center justify-between">
 <h3 className={`${textPrimary} font-bold text-sm flex items-center gap-2`}>
 <Palette className="w-4 h-4 text-[#2f6cf5]" /> Thiết lập cổng của bạn
 </h3>
 </div>
 <div className="space-y-3 pt-1">
 <div className="flex items-center justify-between text-left">
 <div>
 <span className={`text-xs ${isPortalDark ? "text-zinc-200" : "text-zinc-800"} font-medium block`}>Giao diện hiển thị</span>
 <span className={`text-xs ${textMuted}`}>Cáp màu màn hình yêu thích</span>
 </div>
 
 <div className={`flex items-center ${isPortalDark ? 'bg-zinc-800' : 'bg-zinc-100'} p-1 rounded-xl border border-transparent gap-1 scale-90 origin-right transition-colors`}>
 <button 
 type="button"
 onClick={() => setPortalThemeOption("system")}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 portalThemeOption === "system" 
 ? "bg-[#2f6cf5] text-white shadow-sm font-black" 
 : `${isPortalDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`
 }`}
 >
 <Monitor className="w-3 h-3" />
 Hệ thống
 </button>
 <button 
 type="button"
 onClick={() => setPortalThemeOption("dark")}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 portalThemeOption === "dark" 
 ? "bg-amber-500 text-black shadow-sm font-black" 
 : `${isPortalDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`
 }`}
 >
 <Moon className="w-3 h-3" />
 Tối
 </button>
 </div>
 </div>
 </div>
 </div>
 </>
 )}

 {activeTab === 'rewards' && (
 <div className="space-y-4 pt-2">
 <div className="flex items-center justify-between px-1">
 <div className="text-left">
 <h3 className={`${textPrimary} font-bold text-lg`}>Sử dụng điểm</h3>
 <p className={`${textSecondary} text-xs`}>Đổi điểm lấy đặc quyền độc quyền</p>
 </div>
 <div className="text-right">
 <p className={`text-xs ${textSecondary} uppercase font-bold`}>Số dư</p>
 <p className="text-[#2f6cf5] font-bold text-base">{customerPoints.toLocaleString()} pts</p>
 </div>
 </div>

 <div className="space-y-3">
 {rules.length === 0 ? (
 <div className="text-center py-12 space-y-3">
 <Gift className={`w-12 h-12 ${isPortalDark ? 'text-zinc-800' : 'text-zinc-300'} mx-auto`} />
 <p className={`${textSecondary} text-sm`}>Hiện chưa có ưu đãi nào khả dụng.</p>
 </div>
 ) : (
 rules.map((rule) => {
 const canRedeem = customerPoints >= rule.pointsRequired;
 return (
 <div 
 key={rule.id}
 className={`${cardBg} rounded-2xl p-4 flex items-center gap-4 group transition-colors duration-300`}
 >
 <div className={`w-14 h-14 rounded-xl ${isPortalDark ? "bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border-white/10" : "bg-gradient-to-br from-zinc-100 to-zinc-50 border-zinc-200/50"} flex items-center justify-center border shrink-0`}>
 {rule.rewardType === 'discount' ? (
 <Ticket className="w-7 h-7 text-[#2f6cf5]" />
 ) : rule.rewardType === 'voucher' ? (
 <CheckCircle2 className="w-7 h-7 text-emerald-500" />
 ) : (
 <ShoppingBag className="w-7 h-7 text-blue-400" />
 )}
 </div>
 <div className="flex-1 min-w-0 text-left">
 <h4 className={`${textPrimary} font-bold text-sm truncate`}>{rule.name}</h4>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[#2f6cf5] text-xs font-black">{rule.pointsRequired.toLocaleString()} pts</span>
 <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
 <span className={`${textSecondary} text-xs font-bold`}>
 {rule.rewardType === 'discount' ? `Giảm $${rule.value}` : rule.rewardType === 'voucher' ? `Voucher ${rule.value}%` : 'Hiện vật'}
 </span>
 </div>
 
 {/* Progress bar */}
 {!canRedeem && (
 <div className={`mt-2 w-full h-1 ${isPortalDark ? "bg-zinc-800" : "bg-zinc-200"} rounded-full overflow-hidden`}>
 <div 
 className="h-full bg-zinc-500"
 style={{ width: `${(customerPoints / rule.pointsRequired) * 100}%` }}
 ></div>
 </div>
 )}
 </div>
 <button 
 type="button"
 disabled={!canRedeem}
 onClick={() => handleRedeem(rule)}
 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
 canRedeem 
 ? 'bg-[#2f6cf5] text-white hover:scale-105 active:scale-95' 
 : isPortalDark ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
 }`}
 >
 {canRedeem ? 'Đổi ngay' : 'Thêm điểm'}
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}

 {activeTab === 'history' && (
 <div className="space-y-4 pt-2">
 <div className="flex items-center justify-between px-1 border-b pb-3 border-border/10">
 <div className="text-left">
 <h3 className={`${textPrimary} font-bold text-lg`}>Lịch sử đổi quà</h3>
 <p className={`${textSecondary} text-xs`}>Ưu đãi quý hội viên đã quy đổi</p>
 </div>
 </div>

 <div className="space-y-3">
 {[
 { id: "h1", name: "Voucher High-Tea Sảnh Thượng Vy", code: "HIGHTEASEVA", date: "Hôm nay, 14:45", value: "Trị giá 500k", rewardType: "voucher" },
 { id: "h2", name: "Đặc quyền Spa Trị Liệu Trầm Hương", code: "SPATRIANVIP", date: "10 thg 10, 2023", value: "Trị giá 1tr5", rewardType: "discount" }
 ].map((item) => (
 <div key={item.id} className={`${cardBg} rounded-2xl p-4 space-y-3 transition-colors duration-300 text-left`}>
 <div className="flex items-center gap-3">
 <div className={`w-11 h-11 rounded-lg ${isPortalDark ? "bg-white/5" : "bg-zinc-100"} flex items-center justify-center shrink-0`}>
 <Gift className="w-5 h-5 text-[#2f6cf5]" />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className={`${textPrimary} font-bold text-xs truncate`}>{item.name}</h4>
 <p className={`${textMuted} text-xs`}>{item.date} • {item.value}</p>
 </div>
 </div>
 <div className={`p-2.5 rounded-xl ${isPortalDark ? 'bg-zinc-900/50' : 'bg-zinc-50'} border border-dashed border-border flex items-center justify-between gap-1`}>
 <span className="text-xs text-muted-foreground font-semibold">MÃ QUÀ KHẢ DỤNG</span>
 <span className={` font-bold text-xs ${isPortalDark ? 'text-amber-400' : 'text-amber-600'} tracking-wider`}>{item.code}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </motion.div>
 </div>

 {/* Home Indicator */}
 {portalDeviceOption === 'mobile' && (
 <div className="absolute bottom-2 inset-x-0 h-1 flex justify-center z-50 pointer-events-none">
 <div className="w-1/3 bg-zinc-600/30 rounded-full"></div>
 </div>
 )}
 </div>
 </div>
 );
}

