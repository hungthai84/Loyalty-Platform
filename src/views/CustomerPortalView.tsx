import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
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
  Smartphone,
  Award,
  Gem,
  Share2,
  ScanLine,
  X,
  Copy,
  Fingerprint,
  BookOpen,
  Star,
  Database,
  Shield,
  Sliders,
  Tablet,
  Settings,
} from "lucide-react";
import { Activity } from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useFirebase } from "@/components/FirebaseProvider";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RedemptionRule } from "@/types";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface PortalProps {
  onBack?: () => void;
}

export function CustomerPortalView({ onBack }: PortalProps) {
  const { user } = useFirebase();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<"home" | "rewards" | "history" | "gamification">(
    "home",
  );
  
  // Custom interactive workspace states
  const [configActiveTab, setConfigActiveTab] = useState<"interface" | "omnichannel" | "gamification" | "settings">("interface");
  const [brandColor, setBrandColor] = useState<string>("#2f6cf5");
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    f1: true,
    f2: true,
    f3: true,
    f4: true,
    f5: true,
    f6: false,
  });

  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [customerPoints, setCustomerPoints] = useState(480); // Set slightly below Essential (500) for demo
  const [lastTier, setLastTier] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [referralCount, setReferralCount] = useState(2);
  const referralLink = useMemo(() => `https://seva.app/refer/VIP-${user?.uid?.slice(0, 6) || "ELEANOR"}`.toUpperCase(), [user]);

  // QR Scanner Logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((result) => {
        // Success callback
        console.log("QR Result:", result);
        scanner.clear();
        setShowScanner(false);
        
        // Simulate earning points
        setCustomerPoints(prev => prev + 100);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2f6cf5", "#ffffff"]
        });
        toast.success("Quét mã POS thành công!", {
          description: "Chúc mừng! Bạn vừa nhận được 100 điểm thưởng tức thì.",
        });
      }, (error) => {
        // Error callback (too noisy if logged)
      });

      return () => {
        scanner.clear().catch(e => console.warn("Scanner cleanup failed", e));
      };
    }
  }, [showScanner]);

  // Tier detection logic
  useEffect(() => {
    let currentTier = "Member";
    if (customerPoints >= 10000) currentTier = "Atelier";
    else if (customerPoints >= 2500) currentTier = "Icon";
    else if (customerPoints >= 500) currentTier = "Essential";

    if (lastTier && currentTier !== lastTier) {
      // Tier upgraded!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2f6cf5", "#10b981", "#f59e0b", "#ffffff"],
      });
      toast.success(`Chúc mừng! Bạn đã đạt hạng ${currentTier}`, {
        description: `Cảm ơn bạn đã đồng hành cùng SEVA. Tận hưởng các ưu đãi mới của hạng ${currentTier} ngay!`,
        duration: 5000,
      });
    }
    setLastTier(currentTier);
  }, [customerPoints, lastTier]);

  // Theme settings state - default to 'system'
  const [portalThemeOption, setPortalThemeOption] = useState<"system" | "dark">(
    "system",
  );
  const [portalDeviceOption, setPortalDeviceOption] = useState<
    "mobile" | "tablet" | "desktop"
  >("mobile");
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);

  useEffect(() => {
    if (!user || user.isLocal) return;
    const q = query(
      collection(db, "redemption_rules"),
      orderBy("pointsRequired", "asc"),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        setRules(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as RedemptionRule,
          ),
        );
      },
      (error) => console.error("Redemption rules error:", error),
    );
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
  const activeAppTheme =
    theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  // Resolve system state or dark state
  const isPortalDark =
    portalThemeOption === "dark" ||
    (portalThemeOption === "system" && activeAppTheme === "dark");

  const handleRedeem = (rule: RedemptionRule) => {
    if (customerPoints < rule.pointsRequired) {
      toast.error("Không đủ điểm để đổi ưu đãi này");
      return;
    }

    // In a real app, this would create a 'redemption' record and deduct points
    toast.success(`Đã đổi thành công: ${rule.name}`, {
      description: "Mã ưu đãi đã được gửi vào mục Lịch sử của bạn.",
    });
    setCustomerPoints((prev) => prev - rule.pointsRequired);
  };

  const recommendations = useMemo(() => {
    const list = [];
    if (customerPoints < 500) {
      list.push({
        title: "Thăng hạng Essential",
        description: `Bạn chỉ còn thiếu ${(500 - customerPoints).toLocaleString()} điểm để đạt hạng Essential và nhận voucher giảm giá 10%.`,
        icon: Award,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      });
    } else if (customerPoints < 2500) {
      list.push({
        title: "Đường tới hạng Icon",
        description: `Mua sắm thêm ${(2500 - customerPoints).toLocaleString()} điểm để trở thành thành viên Icon với ưu đãi đặc quyền.`,
        icon: Gem,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      });
    } else if (customerPoints < 10000) {
      list.push({
        title: "Trở thành Atelier",
        description: `Chỉ còn ${(10000 - customerPoints).toLocaleString()} điểm nữa để chạm tay vào hạng Atelier cao quý nhất.`,
        icon: Gem,
        color: "text-[#2f6cf5]",
        bg: "bg-[#2f6cf5]/10",
      });
    }

    if (customerPoints >= 500) {
      list.push({
        title: "Đổi quà ngay",
        description:
          "Bạn đang có số điểm tích lũy khá lớn, hãy ghé thăm kho quà để sử dụng nhé!",
        icon: Gift,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      });
    }
    return list;
  }, [customerPoints]);

  // Styled design variables based on active portal theme
  const phoneBg = isPortalDark ? "bg-[#0C0C0E]" : "bg-[#F8FAFC]";
  const textPrimary = isPortalDark ? "text-white" : "text-zinc-900";
  const textSecondary = isPortalDark ? "text-zinc-400" : "text-zinc-600";
  const textMuted = isPortalDark ? "text-zinc-500" : "text-zinc-400";

  // Dynamic brand color mappings to dynamically style the simulated phone
  const brandTextColor = 
    brandColor === "#f43f5e" ? "text-rose-500" :
    brandColor === "#10b981" ? "text-emerald-500" :
    brandColor === "#f59e0b" ? "text-amber-500" :
    brandColor === "#8b5cf6" ? "text-purple-500" : "text-[#2f6cf5]";

  const brandBgColor = 
    brandColor === "#f43f5e" ? "bg-rose-500" :
    brandColor === "#10b981" ? "bg-emerald-500" :
    brandColor === "#f59e0b" ? "bg-amber-500" :
    brandColor === "#8b5cf6" ? "bg-purple-500" : "bg-[#2f6cf5]";

  const brandBorderColor = 
    brandColor === "#f43f5e" ? "border-rose-500" :
    brandColor === "#10b981" ? "border-emerald-500" :
    brandColor === "#f59e0b" ? "border-amber-500" :
    brandColor === "#8b5cf6" ? "border-purple-500" : "border-[#2f6cf5]";

  const brandLightBgColor = 
    brandColor === "#f43f5e" ? "bg-rose-500/10" :
    brandColor === "#10b981" ? "bg-emerald-500/10" :
    brandColor === "#f59e0b" ? "bg-amber-500/10" :
    brandColor === "#8b5cf6" ? "bg-purple-500/10" : "bg-[#2f6cf5]/10";

  const brandLightBorderColor = 
    brandColor === "#f43f5e" ? "border-rose-500/20" :
    brandColor === "#10b981" ? "border-emerald-500/20" :
    brandColor === "#f59e0b" ? "border-amber-500/20" :
    brandColor === "#8b5cf6" ? "border-purple-500/20" : "border-[#2f6cf5]/20";

  const cardBg = isPortalDark
    ? "bg-[#161619] border border-white/5 shadow-inner"
    : "bg-white border border-zinc-200/80 shadow-sm";

  const cardHeaderDivider = isPortalDark ? "bg-white/5" : "bg-zinc-200/50";

  const buttonBg = isPortalDark
    ? "bg-[#161619] border border-white/5 hover:bg-[#202024] transition-colors"
    : "bg-white border border-zinc-200 hover:bg-zinc-100 transition-colors shadow-sm";

  const cardGradient = isPortalDark
    ? "bg-gradient-to-br from-[#1b1b1f] to-[#111113] border border-white/10"
    : brandColor === "#f43f5e" ? "bg-gradient-to-br from-rose-600 to-rose-950 text-white border border-rose-500/30 shadow-md shadow-rose-500/10" :
      brandColor === "#10b981" ? "bg-gradient-to-br from-emerald-600 to-emerald-950 text-white border border-emerald-500/30 shadow-md shadow-emerald-500/10" :
      brandColor === "#f59e0b" ? "bg-gradient-to-br from-amber-500 to-amber-950 text-white border border-amber-500/30 shadow-md shadow-amber-500/10" :
      brandColor === "#8b5cf6" ? "bg-gradient-to-br from-purple-600 to-purple-950 text-white border border-purple-500/30 shadow-md shadow-purple-500/10" :
      "bg-gradient-to-br from-blue-600 to-blue-950 text-white border border-blue-500/30 shadow-md shadow-blue-500/10";

  const currentTierName =
    customerPoints >= 10000
      ? "Atelier"
      : customerPoints >= 2500
        ? "Icon"
        : customerPoints >= 500
          ? "Essential"
          : "Member";

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-[#2f6cf5]/30 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-[#2f6cf5]/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-[#2f6cf5]/10 rounded-[10px] text-[#2f6cf5] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <motion.div
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              rotate: [0, 8, -8, 4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
            }}
          >
            <Fingerprint className="w-8 h-8 text-[#2f6cf5]" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
              Kho Quà Tặng Tích Lũy
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Trung tâm quà tặng đặc quyền: Trải nghiệm giao diện tự phục vụ dành cho khách hàng: tự kiểm tra điểm số, đổi voucher và tích lũy thăng hạng.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {}}
          className={cn(
            "flex items-center px-4 py-2 rounded-[10px] text-xs font-bold transition-all border cursor-pointer",
            "bg-background border-border hover:bg-muted text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4 mr-2 text-[#2f6cf5]" />
          Tài liệu Chỉnh sửa giao diện Cổng Loyalty
        </button>
      </div>
    </motion.div>
  );

  const [savingPortal, setSavingPortal] = useState(false);
  const handleSavePortal = () => {
    setSavingPortal(true);
    setTimeout(() => {
      setSavingPortal(false);
      toast.success("Đã lưu cấu hình Cổng Loyalty!");
    }, 850);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start space-y-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      {/* Main Workspace Layout: Bento Split-Screen Grid on lg+ screens */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        
        {/* Left Column: Premium Workspace Config Hub */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6 text-left">
          
          {/* Glass Navigation Tabs for Config Hub */}
          <div className="bg-card/60 backdrop-blur-md border border-border/60 rounded-xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {[
              { id: "interface", label: "Giao diện", icon: Palette },
              { id: "omnichannel", label: "Điểm chạm", icon: Share2 },
              { id: "gamification", label: "Mini Game", icon: Star },
              { id: "settings", label: "Cấu hình", icon: Sliders },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = configActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setConfigActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-1",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-extrabold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <TabIcon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Config Hub Content Canvas */}
          <div className="bg-card border border-border/70 rounded-xl p-6 shadow-md transition-all">
            <AnimatePresence mode="wait">
              {configActiveTab === "interface" && (
                <motion.div
                  key="interface"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Brand Color Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                      <Palette className="w-4.5 h-4.5 text-primary" />
                      <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                        Màu sắc thương hiệu (Brand Theme)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lựa chọn màu sắc nhận diện chính của thương hiệu. Các nút bấm, dải điểm và icon trên Cổng khách hàng sẽ tự động cập nhật đồng bộ.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      {[
                        { hex: "#2f6cf5", name: "Royal Blue", bgClass: "bg-[#2f6cf5]" },
                        { hex: "#f43f5e", name: "Rose Pink", bgClass: "bg-rose-500" },
                        { hex: "#10b981", name: "Emerald Green", bgClass: "bg-emerald-500" },
                        { hex: "#f59e0b", name: "Amber Yellow", bgClass: "bg-amber-500" },
                        { hex: "#8b5cf6", name: "Purple Dream", bgClass: "bg-purple-500" },
                      ].map((item) => (
                        <button
                          key={item.hex}
                          onClick={() => setBrandColor(item.hex)}
                          className={cn(
                            "w-8 h-8 rounded-[10px] transition-transform hover:scale-110 relative flex items-center justify-center cursor-pointer",
                            item.bgClass,
                            brandColor === item.hex && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                          title={item.name}
                        >
                          {brandColor === item.hex && (
                            <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Mode Selection */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                      <Moon className="w-4.5 h-4.5 text-primary" />
                      <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                        Chế độ Sáng / Tối (Theme Mode)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quyết định giao diện nền màu sáng hay tối cho Cổng VIP nhằm phù hợp với dải màu nhận diện.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setPortalThemeOption("system")}
                        className={cn(
                          "py-3 px-4 border rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                          portalThemeOption === "system"
                            ? "border-primary bg-primary/5 text-primary font-extrabold shadow-sm"
                            : "border-border bg-transparent text-muted-foreground hover:border-foreground/35"
                        )}
                      >
                        <Monitor className="w-4 h-4" />
                        Đồng bộ ({activeAppTheme === "dark" ? "Tối" : "Sáng"})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalThemeOption("dark")}
                        className={cn(
                          "py-3 px-4 border rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                          portalThemeOption === "dark"
                            ? "border-amber-500 bg-amber-500/5 text-amber-500 font-extrabold shadow-sm"
                            : "border-border bg-transparent text-muted-foreground hover:border-foreground/35"
                        )}
                      >
                        <Moon className="w-4 h-4" />
                        Cố định Tối
                      </button>
                    </div>
                  </div>

                  {/* Device Simulation Toggle */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                      <Smartphone className="w-4.5 h-4.5 text-primary" />
                      <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                        Kích thước bộ giả lập (Simulator Frame)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thay đổi hiển thị bên phải để kiểm tra độ phản hồi linh hoạt trên mọi kích cỡ màn hình thiết bị khách hàng.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { id: "mobile", label: "Điện thoại", icon: Smartphone },
                        { id: "tablet", label: "Tablet", icon: Tablet },
                        { id: "desktop", label: "Máy tính", icon: Monitor },
                      ].map((dev) => {
                        const DevIcon = dev.icon;
                        const isSel = portalDeviceOption === dev.id;
                        return (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => setPortalDeviceOption(dev.id as any)}
                            className={cn(
                              "py-3 px-2 border rounded-[10px] text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer",
                              isSel
                                ? "border-primary bg-primary/5 text-primary font-extrabold shadow-sm"
                                : "border-border bg-transparent text-muted-foreground hover:border-foreground/35"
                            )}
                          >
                            <DevIcon className="w-4 h-4" />
                            {dev.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {configActiveTab === "omnichannel" && (
                <motion.div
                  key="omnichannel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                    <Share2 className="w-4.5 h-4.5 text-primary" />
                    <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                      Điểm chạm thành viên (Omnichannel Touchpoints)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Nhúng hoặc tích hợp cổng tích điểm tự phục vụ của SEVA với mọi kênh tiếp cận khác nhau của bạn để tối đa hóa tương tác.
                  </p>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Zalo Mini App */}
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-foreground">Zalo Mini App Client</h5>
                            <p className="text-[10px] text-muted-foreground">Đã đồng bộ dải điểm & API</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full">Đang bật</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        </div>
                      </div>
                      <button className="w-full mt-2 py-2 text-[10px] font-bold bg-background border border-border hover:bg-muted rounded-lg text-foreground transition-all">
                        Xem tài liệu hướng dẫn tích hợp Zalo
                      </button>
                    </div>

                    {/* Website Embed Portal */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.04] transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-foreground">Website Embedded iFrame</h5>
                            <p className="text-[10px] text-muted-foreground">Nhúng trực tiếp vào trang bán hàng</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-primary font-bold bg-primary/15 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(47,108,245,0.8)]"></div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="https://seva.app/portal" width="100%" height="700px" style="border:none;border-radius:12px;"></iframe>`);
                          toast.success("Đã sao chép mã nhúng iFrame!");
                        }}
                        className="w-full mt-2 py-2 text-[10px] font-bold bg-background border border-border hover:bg-muted rounded-lg text-foreground transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Lấy mã nhúng HTML iFrame (Website)
                      </button>
                    </div>

                    {/* Shopify & WooCommerce */}
                    <div className="p-4 rounded-xl border border-border bg-muted/5 opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-foreground">Shopify / WooCommerce</h5>
                            <p className="text-[10px] text-muted-foreground">Tự động khẩu trừ và tích điểm</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">Chưa kết nối</span>
                      </div>
                      <button
                        onClick={() => toast.success("Hệ thống đồng bộ e-commerce đã kết nối thử nghiệm!")}
                        className="w-full mt-2 py-2 text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-all"
                      >
                        Kết nối ngay lập tức (Shopify)
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {configActiveTab === "gamification" && (
                <motion.div
                  key="gamification"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                    <Star className="w-4.5 h-4.5 text-amber-500" />
                    <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                      Tương tác tăng cường (Gamification)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Giữ chân và thôi thúc khách hàng đổi điểm với các mini game tương tác lôi cuốn, tăng tính gắn kết.
                  </p>

                  <div className="grid grid-cols-1 gap-4 pt-1">
                    {/* Lucky Wheel */}
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] transition-all">
                      <div className="p-2 bg-amber-500/10 rounded-full shrink-0 text-amber-500">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="text-sm font-bold text-foreground">Vòng Quay May Mắn (Lucky Wheel)</h4>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Khách hàng có thể tiêu điểm số tích luỹ để tham gia quay trúng thưởng voucher hoặc quà tặng đặc biệt trực tiếp tại cổng Điểm chạm.
                        </p>
                        <button
                          onClick={() => toast.success("Mở trình chỉnh sửa danh sách phần thưởng Vòng quay.")}
                          className="text-[10px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Thiết lập quà vòng quay
                        </button>
                      </div>
                    </div>

                    {/* Affiliate Invite */}
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-border bg-card">
                      <div className="p-2 bg-primary/10 rounded-full shrink-0 text-primary">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="text-sm font-bold text-foreground">Giới thiệu bạn bè & Affiliate</h4>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Thành viên thuộc cổng tự phục vụ VIP có thể tự copy link mời để chia sẻ nhanh cho người thân nhằm hưởng thêm ưu đãi thăng hạng.
                        </p>
                        <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg border border-border text-[10px]">
                          <span className="font-bold text-muted-foreground">Tự động mời Affiliate</span>
                          <span className="text-emerald-500 font-extrabold">Đang bật</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {configActiveTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 border-b pb-2 border-border/40">
                    <Sliders className="w-4.5 h-4.5 text-primary" />
                    <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                      Bật tắt cấu phần hiển thị (Features)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Tùy chỉnh bật tắt linh hoạt các khối nội dung trực tiếp trên cổng giải lập. Cập nhật tức thì không cần biên dịch lại code.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "f1", label: "Quét mã POS tích điểm", icon: Fingerprint },
                      { id: "f2", label: "Lộ trình thăng hạng VIP", icon: Star },
                      { id: "f3", label: "Kho quà tặng & đổi điểm", icon: Gift },
                      { id: "f4", label: "Gợi ý / Trải nghiệm VIP", icon: Activity },
                      { id: "f5", label: "Hoạt động gần đây", icon: Database },
                      { id: "f6", label: "Hỗ trợ (Ticket online)", icon: Shield },
                    ].map((feat) => {
                      const FeatIcon = feat.icon;
                      const isChecked = enabledFeatures[feat.id];
                      return (
                        <label
                          key={feat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/10 cursor-pointer transition-all select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-1.5 rounded-lg", isChecked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                              <FeatIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-foreground leading-none">{feat.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setEnabledFeatures(prev => ({ ...prev, [feat.id]: !prev[feat.id] }))}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Trigger cards */}
          <div className="flex justify-between items-center bg-card border border-border/70 rounded-xl p-4 shadow-sm w-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-muted-foreground font-semibold">Tự động lưu và cập nhật ngoại tiếp</span>
            </div>
            <button
              onClick={handleSavePortal}
              disabled={savingPortal}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {savingPortal ? "Đang lưu..." : "Lưu thay đổi Cổng"}
            </button>
          </div>
        </div>

        {/* Right Column: Simulated Live Interactive Device Canvas Studio (Col-span 7 sticky) */}
        <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-6 flex flex-col items-center w-full bg-muted/10 border border-border/50 rounded-2xl p-4 md:p-8 backdrop-blur-xs relative overflow-hidden">
          
          {/* Subtle live background grid patterns */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

          <div
            className={cn(
              "w-full transition-all duration-500 ease-in-out flex flex-col items-center",
              portalDeviceOption === "mobile" ? "max-w-[390px]" : 
              portalDeviceOption === "tablet" ? "max-w-[620px]" : "max-w-full"
            )}
          >
            {/* Device Frame layout simulation */}
            <div
              className={cn(
                "w-full overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col shadow-2xl bg-background",
                portalDeviceOption === "mobile" ? "h-[760px] rounded-[3.2rem] border-[10px] border-zinc-800 dark:border-zinc-950 ring-4 ring-zinc-700/10" : 
                portalDeviceOption === "tablet" ? "h-[640px] rounded-[2rem] border-[14px] border-zinc-800 dark:border-zinc-950 ring-4 ring-zinc-700/10" : 
                "h-[680px] rounded-xl border border-border shadow-md"
              )}
            >
              
              {/* Phone Dynamic Island */}
              {portalDeviceOption === "mobile" && (
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 animate-pulse">
                  <div className="w-28 h-5 bg-zinc-800 rounded-b-2xl mt-0.5 flex items-center justify-between px-3 select-none pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900"></div>
                    <div className="w-8 h-1 bg-zinc-900 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Tablet center camera */}
              {portalDeviceOption === "tablet" && (
                <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-50">
                  <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full mt-1"></div>
                </div>
              )}

        {/* Portal Header */}
        <div className="pt-12 pb-4 px-6 relative z-10 flex items-center justify-between">
          <button
            onClick={activeTab === "home" ? onBack : () => setActiveTab("home")}
            className={`${isPortalDark ? "text-white/60 hover:text-white" : "text-zinc-600 hover:text-zinc-900"} transition-colors cursor-pointer`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-heading font-black tracking-widest text-[#2f6cf5]">
            {activeTab === "home"
              ? "SEVA"
              : activeTab === "rewards"
                ? "ƯU ĐÃI"
                : activeTab === "gamification"
                  ? "TIỆN ÍCH"
                  : "LỊCH SỬ"}
          </span>
          <div className="w-5"></div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 flex justify-center">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "px-6 space-y-6 w-full",
              portalDeviceOption === "desktop" || portalDeviceOption === "tablet" ? "max-w-2xl mt-8" : ""
            )}
          >
            {activeTab === "home" && (
              <>
                {/* Greeting & Points Ratio */}
                <div className="mt-4 text-left">
                  <h2
                    className={`text-3xl font-heading ${textPrimary} leading-tight`}
                  >
                    Chào bạn, <br />
                    <span className={cn("italic text-4xl font-extrabold", brandTextColor)}>
                      Eleanor.
                    </span>
                  </h2>
                  <p className={`${textSecondary} mt-2 text-sm`}>
                    Hội viên {currentTierName}
                  </p>
                </div>
                <button
                  onClick={() => setCustomerPoints((prev) => prev + 50)}
                  className={cn(
                    "px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase transition-all cursor-pointer border", 
                    brandLightBgColor, 
                    brandTextColor, 
                    brandLightBorderColor,
                    brandColor === "#f43f5e" ? "hover:bg-rose-500 hover:text-white" :
                    brandColor === "#10b981" ? "hover:bg-emerald-500 hover:text-white" :
                    brandColor === "#f59e0b" ? "hover:bg-amber-500 hover:text-white" :
                    brandColor === "#8b5cf6" ? "hover:bg-purple-500 hover:text-white" :
                    "hover:bg-[#2f6cf5] hover:text-white"
                  )}
                >
                  +50 pts (Demo)
                </button>

                {/* Loyalty Card Element */}
                <div
                  className={`mt-6 aspect-[1.586/1] ${cardGradient} rounded-[10px] relative overflow-hidden shadow-xl flex flex-col justify-between p-6 transition-all duration-300`}
                >
                  <div className={cn("absolute -right-12 -top-12 w-48 h-48 opacity-20 rounded-full blur-3xl", brandBgColor)}></div>

                  <div className="flex justify-between items-start relative z-10">
                    <span className={cn("font-heading font-extrabold tracking-widest text-lg", brandTextColor)}>
                      SEVA
                    </span>
                    {enabledFeatures.f1 && (
                      <button 
                        onClick={() => setShowScanner(true)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-[10px] transition-all cursor-pointer"
                      >
                        <ScanLine className="text-white w-6 h-6" />
                      </button>
                    )}
                  </div>

                  <div className="relative z-10 text-left">
                    <p className="text-xs tracking-[0.2em] text-white/50 uppercase font-bold">
                      Số điểm hiện có
                    </p>
                    <p className="text-white text-4xl mt-1 font-black">
                      {customerPoints.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab("rewards")}
                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] ${buttonBg} cursor-pointer`}
                  >
                    <Gift className="w-5 h-5 text-[#2f6cf5] mb-2" />
                    <span
                      className={`text-[10px] sm:text-xs ${textPrimary} font-bold tracking-wide uppercase text-center w-full truncate`}
                    >
                      Đổi quà
                    </span>
                  </button>
                  <button
                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] ${buttonBg} cursor-pointer`}
                    onClick={() => setActiveTab("history")}
                  >
                    <History className="w-5 h-5 text-[#2f6cf5] mb-2" />
                    <span
                      className={`text-[10px] sm:text-xs ${textPrimary} font-bold tracking-wide uppercase text-center w-full truncate`}
                    >
                      Lịch sử
                    </span>
                  </button>
                  <button
                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] ${buttonBg} cursor-pointer`}
                    onClick={() => setActiveTab("gamification")}
                  >
                    <Star className="w-5 h-5 text-amber-500 mb-2" />
                    <span
                      className={`text-[10px] sm:text-xs ${textPrimary} font-bold tracking-wide uppercase text-center w-full truncate`}
                    >
                      Giải trí
                    </span>
                  </button>
                  <button
                    className={`flex flex-col items-center justify-center py-4 px-2 rounded-[10px] ${buttonBg} cursor-pointer`}
                  >
                    <UserIcon className="w-5 h-5 text-[#2f6cf5] mb-2" />
                    <span
                      className={`text-[10px] sm:text-xs ${textPrimary} font-bold tracking-wide uppercase text-center w-full truncate`}
                    >
                      Hồ sơ
                    </span>
                  </button>
                </div>

                {/* Refer-a-Friend Section */}
                <div className={`${cardBg} rounded-[10px] p-6 transition-colors duration-300 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`${textPrimary} font-bold text-sm flex items-center gap-2`}>
                      <Share2 className="w-4 h-4 text-[#2f6cf5]" /> Giới thiệu bạn bè
                    </h3>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      {referralCount} Bạn đã tham gia
                    </span>
                  </div>
                  <p className={`${textSecondary} text-xs text-left`}>
                    Mời bạn bè tham gia cộng đồng VIP SEVA để cùng nhận ưu đãi đặc quyền và tích lũy điểm thưởng.
                  </p>
                  <div className={`p-4 rounded-[10px] ${isPortalDark ? "bg-zinc-800/50" : "bg-zinc-50"} border border-dashed border-border flex items-center justify-between gap-3`}>
                    <span className={`text-[10px] font-mono ${textMuted} truncate`}>{referralLink}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        toast.success("Đã sao chép link giới thiệu!");
                      }}
                      className="p-1.5 hover:bg-[#2f6cf5]/5 rounded-[10px] text-[#2f6cf5] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="w-full py-3 bg-[#2f6cf5] text-white rounded-[10px] text-xs font-black uppercase tracking-widest hover:bg-[#2f6cf5]/90 transition-all active:scale-95 shadow-md">
                    Gửi lời mời ngay
                  </button>
                </div>

                {/* Tier Progression Progress Card */}
                {enabledFeatures.f2 && (
                  <div
                    className={`${cardBg} rounded-[10px] p-6 transition-colors duration-300 space-y-5 overflow-hidden relative`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Award className="w-24 h-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className={`${textPrimary} font-bold text-sm`}>
                        Lộ trình thăng hạng
                      </h3>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", brandTextColor)}>
                        Hạng hiện tại: {currentTierName}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {[
                        {
                          name: "Essential",
                          points: 500,
                          color: "bg-emerald-500",
                          icon: CheckCircle2,
                        },
                        {
                          name: "Icon",
                          points: 2500,
                          color: "bg-amber-500",
                          icon: Award,
                        },
                        {
                          name: "Atelier",
                          points: 10000,
                          color: brandColor === "#f43f5e" ? "bg-rose-500" :
                                 brandColor === "#10b981" ? "bg-emerald-500" :
                                 brandColor === "#f59e0b" ? "bg-amber-500" :
                                 brandColor === "#8b5cf6" ? "bg-purple-500" : "bg-[#2f6cf5]",
                          icon: Gem,
                        },
                      ].map((tier, idx) => {
                        const isReached = customerPoints >= tier.points;
                        const progress = Math.min(
                          100,
                          (customerPoints / tier.points) * 100,
                        );
                        const pointsNeeded = Math.max(
                          0,
                          tier.points - customerPoints,
                        );

                        return (
                          <div key={idx} className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1.5 rounded-[10px] ${isReached ? tier.color + " text-white" : "bg-muted"}`}
                                >
                                  <tier.icon className="w-3.5 h-3.5" />
                                </div>
                                <span
                                  className={`text-xs font-bold ${isPortalDark ? "text-white" : "text-zinc-800"}`}
                                >
                                  {tier.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold ${textSecondary}`}
                              >
                                {isReached
                                  ? "ĐÃ ĐẠT"
                                  : `CẦN ${pointsNeeded.toLocaleString()} Điểm`}
                              </span>
                            </div>
                            <div
                              className={`h-2 w-full ${isPortalDark ? "bg-zinc-800" : "bg-zinc-100"} rounded-full overflow-hidden`}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full ${tier.color}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                 {/* Recommended Actions Section & VIP Experiences */}
                {enabledFeatures.f4 && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`${textPrimary} font-bold text-sm`}>
                          Gợi ý cho bạn
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {recommendations.map((action, i) => (
                          <div
                            key={i}
                            className={`${cardBg} flex items-start gap-4 rounded-[10px] p-4 shadow-sm transition-all duration-300 hover:scale-[1.02]`}
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${action.bg}`}
                            >
                              <action.icon className={`h-5 w-5 ${action.color}`} />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className={`${textPrimary} text-xs font-bold`}>
                                {action.title}
                              </h4>
                              <p
                                className={`${textSecondary} mt-1 text-[11px] leading-relaxed`}
                              >
                                {action.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`${textPrimary} font-bold text-sm`}>
                          Trải nghiệm VIP
                        </h3>
                        <button className={cn("text-xs font-black uppercase hover:underline", brandTextColor)}>
                          Khám phá
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={
                            isPortalDark
                              ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4 rounded-[10px] border border-indigo-500/20 text-left"
                              : "bg-indigo-50/50 p-4 rounded-[10px] border border-indigo-100/80 text-left"
                          }
                        >
                          <Scissors className="w-5 h-5 text-indigo-500 mb-2" />
                          <p
                            className={`${isPortalDark ? "text-white" : "text-indigo-950"} text-xs font-bold leading-tight`}
                          >
                            AI Stylist
                          </p>
                          <p
                            className={`${isPortalDark ? "text-indigo-300" : "text-indigo-600"} text-xs mt-1 uppercase font-extrabold tracking-tighter`}
                          >
                            +500 Điểm / LẦN
                          </p>
                        </div>
                        <div
                          className={
                            isPortalDark
                              ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-4 rounded-[10px] border border-emerald-500/20 text-left"
                              : "bg-emerald-50/50 p-4 rounded-[10px] border border-emerald-100/80 text-left"
                          }
                        >
                          <Ticket className="w-5 h-5 text-emerald-500 mb-2" />
                          <p
                            className={`${isPortalDark ? "text-white" : "text-emerald-950"} text-xs font-bold leading-tight`}
                          >
                            Trade-in
                          </p>
                          <p
                            className={`${isPortalDark ? "text-emerald-300" : "text-emerald-600"} text-xs mt-1 uppercase font-extrabold tracking-tighter`}
                          >
                            ƯU TIÊN DIAMOND
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                 {/* Recent Activity */}
                {enabledFeatures.f5 && (
                  <div
                    className={`${cardBg} rounded-[10px] p-6 transition-colors duration-300`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`${textPrimary} font-bold text-sm`}>
                        Hoạt động gần đây
                      </h3>
                      <button className={cn("text-xs font-black uppercase tracking-wider hover:underline", brandTextColor)}>
                        Xem tất cả
                      </button>
                    </div>
                    <div className="space-y-6">
                      {[
                        {
                          title: "Mua sắm tại cửa hàng",
                          date: "Hôm nay, 14:45",
                          points: "+2,400",
                          type: "earn",
                        },
                        {
                          title: "Thưởng sinh nhật",
                          date: "12 thg 10, 2023",
                          points: "+1,000",
                          type: "earn",
                        },
                        {
                          title: "Đã đổi phần thưởng",
                          date: "10 thg 10, 2023",
                          points: "-5,000",
                          type: "redeem",
                        },
                      ].map((act, i) => (
                        <React.Fragment key={i}>
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col text-left">
                              <span
                                className={`text-sm ${isPortalDark ? "text-zinc-300" : "text-zinc-800"} font-medium`}
                              >
                                {act.title}
                              </span>
                              <span
                                className={`text-xs ${textMuted} mt-1 uppercase tracking-tight`}
                              >
                                {act.date}
                              </span>
                            </div>
                            <span
                              className={
                                act.type === "earn"
                                  ? cn("text-sm font-bold", brandTextColor)
                                  : `${isPortalDark ? "text-zinc-500" : "text-zinc-400"} text-sm `
                              }
                            >
                              {act.points} pts
                            </span>
                          </div>
                          {i < 2 && (
                            <div
                              className={`w-full h-px ${cardHeaderDivider}`}
                            ></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated Customer Settings Inside the Portal (Option selector inside) */}
                <div
                  className={`${cardBg} rounded-[10px] p-6 space-y-4 transition-colors duration-300 hidden`}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className={`${textPrimary} font-bold text-sm flex items-center gap-2`}
                    >
                      <Palette className="w-4 h-4 text-[#2f6cf5]" /> Thiết lập
                      cổng của bạn
                    </h3>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-left">
                      <div>
                        <span
                          className={`text-xs ${isPortalDark ? "text-zinc-200" : "text-zinc-800"} font-medium block`}
                        >
                          Giao diện hiển thị
                        </span>
                        <span className={`text-xs ${textMuted}`}>
                          Cáp màu màn hình yêu thích
                        </span>
                      </div>

                      <div
                        className={`flex items-center ${isPortalDark ? "bg-zinc-800" : "bg-zinc-100"} p-1 rounded-[10px] border border-transparent gap-1 scale-90 origin-right transition-colors`}
                      >
                        <button
                          type="button"
                          onClick={() => setPortalThemeOption("system")}
                          className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            portalThemeOption === "system"
                              ? "bg-[#2f6cf5] text-white shadow-sm font-black"
                              : `${isPortalDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"}`
                          }`}
                        >
                          <Monitor className="w-3 h-3" />
                          Hệ thống
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortalThemeOption("dark")}
                          className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            portalThemeOption === "dark"
                              ? "bg-amber-500 text-black shadow-sm font-black"
                              : `${isPortalDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"}`
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

            {activeTab === "rewards" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="text-left">
                    <h3 className={`${textPrimary} font-bold text-lg`}>
                      Sử dụng điểm
                    </h3>
                    <p className={`${textSecondary} text-xs`}>
                      Đổi điểm lấy đặc quyền độc quyền
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs ${textSecondary} uppercase font-bold`}
                    >
                      Số dư
                    </p>
                    <p className="text-[#2f6cf5] font-bold text-base">
                      {customerPoints.toLocaleString()} pts
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rules.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Gift
                        className={`w-12 h-12 ${isPortalDark ? "text-zinc-800" : "text-zinc-300"} mx-auto`}
                      />
                      <p className={`${textSecondary} text-sm`}>
                        Hiện chưa có ưu đãi nào khả dụng.
                      </p>
                    </div>
                  ) : (
                    rules.map((rule) => {
                      const canRedeem = customerPoints >= rule.pointsRequired;
                      return (
                        <div
                          key={rule.id}
                          className={`${cardBg} rounded-[10px] p-4 flex items-center gap-4 group transition-colors duration-300`}
                        >
                          <div
                            className={`w-14 h-14 rounded-[10px] ${isPortalDark ? "bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border-white/10" : "bg-gradient-to-br from-zinc-100 to-zinc-50 border-zinc-200/50"} flex items-center justify-center border shrink-0`}
                          >
                            {rule.rewardType === "discount" ? (
                              <Ticket className="w-7 h-7 text-[#2f6cf5]" />
                            ) : rule.rewardType === "voucher" ? (
                              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            ) : (
                              <ShoppingBag className="w-7 h-7 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4
                              className={`${textPrimary} font-bold text-sm truncate`}
                            >
                              {rule.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#2f6cf5] text-xs font-black">
                                {rule.pointsRequired.toLocaleString()} pts
                              </span>
                              <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                              <span
                                className={`${textSecondary} text-xs font-bold`}
                              >
                                {rule.rewardType === "discount"
                                  ? `Giảm $${rule.value}`
                                  : rule.rewardType === "voucher"
                                    ? `Voucher ${rule.value}%`
                                    : "Hiện vật"}
                              </span>
                            </div>

                            {/* Progress bar */}
                            {!canRedeem && (
                              <div
                                className={`mt-2 w-full h-1 ${isPortalDark ? "bg-zinc-800" : "bg-zinc-200"} rounded-full overflow-hidden`}
                              >
                                <div
                                  className="h-full bg-zinc-500"
                                  style={{
                                    width: `${(customerPoints / rule.pointsRequired) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={!canRedeem}
                            onClick={() => handleRedeem(rule)}
                            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                              canRedeem
                                ? "bg-[#2f6cf5] text-white hover:scale-105 active:scale-95"
                                : isPortalDark
                                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                            }`}
                          >
                            {canRedeem ? "Đổi ngay" : "Thêm điểm"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1 border-b pb-3 border-border/10">
                  <div className="text-left">
                    <h3 className={`${textPrimary} font-bold text-lg`}>
                      Lịch sử đổi quà
                    </h3>
                    <p className={`${textSecondary} text-xs`}>
                      Ưu đãi quý thành viên đã quy đổi
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "h1",
                      name: "Voucher High-Tea Sảnh Thượng Vy",
                      code: "HIGHTEASEVA",
                      date: "Hôm nay, 14:45",
                      value: "Trị giá 500k",
                      rewardType: "voucher",
                    },
                    {
                      id: "h2",
                      name: "Đặc quyền Spa Trị Liệu Trầm Hương",
                      code: "SPATRIANVIP",
                      date: "10 thg 10, 2023",
                      value: "Trị giá 1tr5",
                      rewardType: "discount",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className={`${cardBg} rounded-[10px] p-4 space-y-3 transition-colors duration-300 text-left`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-[10px] ${isPortalDark ? "bg-white/5" : "bg-zinc-100"} flex items-center justify-center shrink-0`}
                        >
                          <Gift className="w-5 h-5 text-[#2f6cf5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`${textPrimary} font-bold text-xs truncate`}
                          >
                            {item.name}
                          </h4>
                          <p className={`${textMuted} text-xs`}>
                            {item.date} • {item.value}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-2.5 rounded-[10px] ${isPortalDark ? "bg-zinc-900/50" : "bg-zinc-50"} border border-dashed border-border flex items-center justify-between gap-1`}
                      >
                        <span className="text-xs text-muted-foreground font-semibold">
                          MÃ QUÀ KHẢ DỤNG
                        </span>
                        <span
                          className={` font-bold text-xs ${isPortalDark ? "text-amber-400" : "text-amber-600"} tracking-wider`}
                        >
                          {item.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "gamification" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1 border-b pb-3 border-border/10">
                  <div className="text-left">
                    <h3 className={`${textPrimary} font-bold text-lg`}>
                      Tiện ích & Giải trí
                    </h3>
                    <p className={`${textSecondary} text-xs`}>
                      Tham gia mini game để nhận quà cực sốc
                    </p>
                  </div>
                </div>

                <div className={`${cardBg} overflow-hidden rounded-[10px] border border-amber-500/30 p-6 flex flex-col items-center justify-center space-y-4`} style={{ background: isPortalDark ? 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.1), transparent)' : 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), white)' }}>
                   <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 flex items-center justify-center relative bg-gradient-to-br from-amber-200 to-amber-500 shadow-xl overflow-hidden shadow-amber-500/20">
                     <Star className="w-12 h-12 text-white animate-pulse" />
                     <div className="absolute inset-0 border-8 border-white/20 border-dashed rounded-full animate-[spin_20s_linear_infinite]"></div>
                   </div>
                   <div className="text-center">
                     <h4 className={`font-black uppercase tracking-wider ${textPrimary}`}>VÒNG QUAY MAY MẮN</h4>
                     <p className={`text-xs mt-1 ${textSecondary}`}>10 điểm / lượt quay</p>
                   </div>
                   <button 
                     onClick={() => {
                        toast.success("Hệ thống Gamification đang được kết nối!", { description: "Thử nghiệm tích hợp Vòng quay may mắn thành công." });
                        confetti({
                          particleCount: 150,
                          spread: 100,
                          colors: ["#f59e0b", "#fbbf24", "#d97706"]
                        });
                     }}
                     className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-black py-3 rounded-[10px] shadow-lg shadow-amber-500/20 uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all">
                     Thử Vận May!
                   </button>
                </div>

                <div className={`${cardBg} rounded-[10px] p-5 flex flex-col space-y-3`}>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[#2f6cf5]/10 flex items-center justify-center">
                       <UserIcon className="w-5 h-5 text-[#2f6cf5]" />
                     </div>
                     <div className="flex-1 text-left">
                       <h4 className={`font-bold text-sm ${textPrimary}`}>Mời Bạn Bè (Affiliate)</h4>
                       <p className={`text-[10px] ${textMuted} leading-tight mt-0.5`}>Nhận 500 điểm cho mỗi người bạn. Link của bạn: <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{referralLink}</span></p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                       navigator.clipboard.writeText(referralLink);
                       toast.success("Đã copy mã mời!", { description: "Bạn có thể gửi mã này cho bạn bè." });
                     }}
                     className="w-full mt-2 bg-muted text-foreground py-2 rounded-[10px] text-xs font-bold transition-all hover:bg-muted/80">Copy Mã Mời</button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* QR Scanner Overlay */}
        {showScanner && (
          <div className="absolute inset-0 z-[100] bg-black flex flex-col p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="text-white font-heading font-black tracking-widest">POS SCANNER</span>
              <button 
                onClick={() => setShowScanner(false)}
                className="p-2 bg-white/10 rounded-full text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div id="qr-reader" className="w-full max-w-[300px] overflow-hidden rounded-[10px] border-4 border-[#2f6cf5]" />
              <div className="text-center space-y-2">
                <p className="text-white font-bold">Hãy quét mã tại quầy POS</p>
                <p className="text-zinc-500 text-xs">Để tích điểm hoặc xác thực ưu đãi trực tiếp</p>
              </div>
            </div>
            
            <div className="py-8">
              <div className="p-4 bg-zinc-900 rounded-[10px] border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center overflow-hidden p-2">
                  <QRCodeSVG value="SEVA-POS-IDENTIFIER-123" size={48} />
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-bold">Mã khách hàng của bạn</p>
                  <p className="text-zinc-500 text-[10px]">Đưa mã này cho nhân viên nếu máy quét lỗi</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Indicator */}
        {portalDeviceOption === "mobile" && (
          <div className="absolute bottom-2 inset-x-0 h-1 flex justify-center z-50 pointer-events-none">
            <div className="w-1/3 bg-zinc-600/30 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
</div>
);
}
