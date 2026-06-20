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
    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}
      {/* Unified Configuration Panel */}
      <div className="w-full max-w-[800px] bg-card border border-border/70 rounded-[10px] p-6 shadow-lg space-y-8 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-border/40">
              <Palette className="w-5 h-5 text-[#2f6cf5]" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Định dạng hiển thị cổng VIP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPortalThemeOption("system")}
                className={`py-3 px-4 border rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  portalThemeOption === "system"
                    ? "border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Hệ thống ({activeAppTheme === "dark" ? "Tối" : "Sáng"})
              </button>
              <button
                type="button"
                onClick={() => setPortalThemeOption("dark")}
                className={`py-3 px-4 border rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  portalThemeOption === "dark"
                    ? "border-amber-500 bg-amber-500/5 text-amber-500 font-extrabold shadow-sm"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Moon className="w-4 h-4" />
                Tối (Obsidian)
              </button>
            </div>
          </div>

          {/* Device Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-border/40">
              <Monitor className="w-5 h-5 text-[#2f6cf5]" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Thiết bị hiển thị
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPortalDeviceOption("mobile")}
                className={`py-3 px-2 border rounded-[10px] text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  portalDeviceOption === "mobile"
                    ? "border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Điện thoại
              </button>
              <button
                type="button"
                onClick={() => setPortalDeviceOption("tablet")}
                className={`py-3 px-2 border rounded-[10px] text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  portalDeviceOption === "tablet"
                    ? "border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Tablet className="w-4 h-4" />
                Máy tính bảng
              </button>
              <button
                type="button"
                onClick={() => setPortalDeviceOption("desktop")}
                className={`py-3 px-2 border rounded-[10px] text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  portalDeviceOption === "desktop"
                    ? "border-[#2f6cf5] bg-[#2f6cf5]/5 text-[#2f6cf5] font-extrabold shadow-sm"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/30"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Máy tính
              </button>
            </div>
          </div>
        </div>

        {/* Omnichannel / Touchpoints Integrations */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#2f6cf5]" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Tích hợp Đa Điểm chạm (Omnichannel)
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[10px] border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Zalo Mini App</h5>
                    <p className="text-[10px] text-muted-foreground">Đã kết nối</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-background border border-border hover:bg-muted rounded text-foreground transition-colors">
                Cấu hình API Key
              </button>
            </div>

            <div className="p-4 rounded-[10px] border border-[#2f6cf5]/30 bg-[#2f6cf5]/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2f6cf5]/20 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-[#2f6cf5]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Website Portal</h5>
                    <p className="text-[10px] text-muted-foreground">Web SDK & iFrame</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2f6cf5] shadow-[0_0_8px_rgba(47,108,245,0.8)]"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-background border border-border hover:bg-muted rounded text-foreground transition-colors">
                Lấy mã nhúng
              </button>
            </div>

            <div className="p-4 rounded-[10px] border border-border/50 bg-muted/10 relative overflow-hidden group opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">WooCommerce / Shopify</h5>
                    <p className="text-[10px] text-muted-foreground">E-commerce Plugin</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 rounded transition-colors">
                Kết nối ngay
              </button>
            </div>

            <div className="p-4 rounded-[10px] border border-border/50 bg-muted/10 relative overflow-hidden group opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Máy POS Offline (KiotViet)</h5>
                    <p className="text-[10px] text-muted-foreground">Tích điểm tự động</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 rounded transition-colors">
                Thiết lập Webhook
              </button>
            </div>
            <div className="p-4 rounded-[10px] border border-border/50 bg-muted/10 relative overflow-hidden group opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Tablet className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Self-Service Kiosk</h5>
                    <p className="text-[10px] text-muted-foreground">App cài đặt tại thiết bị Kiosk</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 rounded transition-colors">
                Xem API cấu hình
              </button>
            </div>

            <div className="p-4 rounded-[10px] border border-border/50 bg-muted/10 relative overflow-hidden group opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Wifi Marketing</h5>
                    <p className="text-[10px] text-muted-foreground">Tích điểm khi khách truy cập Wifi</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
              </div>
              <button className="w-full mt-3 py-1.5 text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 rounded transition-colors">
                Thiết lập Captive Portal
              </button>
            </div>
          </div>
        </div>

        {/* Gamification & Extensibility Section */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Tích hợp Gamification (Tiện ích)
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 flex items-start gap-4 rounded-[10px] border border-amber-500/30 bg-amber-500/5 relative">
              <div className="p-2.5 bg-amber-500/20 rounded-full shrink-0">
                <Gift className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Vòng Quay May Mắn</h4>
                <p className="text-[11px] text-muted-foreground mt-1 mb-3 leading-snug">Tính năng giúp khách hàng dùng điểm tích lũy để quay thưởng, tăng tương tác ứng dụng Điểm Chạm của bạn.</p>
                <button className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded transition-colors w-full sm:w-auto text-center">Tùy chỉnh Vòng quay</button>
              </div>
            </div>

            <div className="p-4 flex items-start gap-4 rounded-[10px] border border-border bg-card relative">
              <div className="p-2.5 bg-muted rounded-full shrink-0">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Giới thiệu (Affiliate)</h4>
                <p className="text-[11px] text-muted-foreground mt-1 mb-3 leading-snug">Cho phép thành viên lấy mã giới thiệu tại App Điểm Chạm để mời bạn bè, hưởng hoa hồng hoa điểm thưởng.</p>
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted rounded">
                  <span className="text-xs font-medium text-muted-foreground">Đang bật (Tự động)</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                     <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Customization Section */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#2f6cf5]" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Tuy chỉnh chung hiển thị
              </span>
            </div>
            <button 
              onClick={() => setShowGeneralSettings(true)}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/20 border border-dashed border-border rounded-[10px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2f6cf5]/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#2f6cf5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Cấu hình chi tiết</p>
                <p className="text-[10px] text-muted-foreground">Nhấn vào biểu tượng cài đặt để tùy chỉnh giao diện và tính năng</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSavePortal}
              disabled={savingPortal}
              className="px-8 py-2.5 rounded-[10px] bg-primary text-primary-foreground text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {savingPortal ? "Đang lưu..." : "Lưu Cấu Hình Cổng"}
            </button>
          </div>
        </div>
      </div>

      {/* General Customization Popup */}
      <AnimatePresence>
        {showGeneralSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGeneralSettings(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sliders className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Tùy chỉnh chung hiển thị</h3>
                    <p className="text-xs text-muted-foreground">Cấu hình màu sắc và tính năng cho cổng thành viên</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGeneralSettings(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Màu sắc thương hiệu chủ đạo
                      </label>
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-[10px] bg-[#2f6cf5] ring-2 ring-offset-2 ring-[#2f6cf5] ring-offset-background"></button>
                        <button className="w-8 h-8 rounded-[10px] border border-border bg-rose-500 hover:scale-110 transition-transform"></button>
                        <button className="w-8 h-8 rounded-[10px] border border-border bg-emerald-500 hover:scale-110 transition-transform"></button>
                        <button className="w-8 h-8 rounded-[10px] border border-border bg-amber-500 hover:scale-110 transition-transform"></button>
                        <button className="w-8 h-8 rounded-[10px] border border-border bg-purple-500 hover:scale-110 transition-transform"></button>
                      </div>
                    </div>
                    <div className="space-y-4 pt-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Trạng thái Cổng Website
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-[10px] border border-primary/20 bg-primary/5 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-xs font-medium text-primary">Đang hoạt động (Online)</span>
                        </div>
                        <button className="text-[10px] font-bold px-2 py-1.5 rounded-[10px] border border-border bg-background hover:bg-muted transition-colors whitespace-nowrap">
                          Copy Link Tích hợp
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Tính năng hiển thị
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "f1", label: "Mã QR", icon: Fingerprint, checked: true },
                        { id: "f2", label: "Hạng, điểm", icon: Star, checked: true },
                        { id: "f3", label: "Cửa hàng", icon: Gift, checked: true },
                        { id: "f4", label: "Thông báo", icon: Activity, checked: true },
                        { id: "f5", label: "Lịch sử mua", icon: Database, checked: true },
                        { id: "f6", label: "Hỗ trợ (Ticket)", icon: Shield, checked: false },
                      ].map((f) => (
                        <label key={f.id} className="flex items-center justify-between gap-2 p-3 rounded-[10px] border border-border/40 hover:bg-muted/20 cursor-pointer transition-all">
                          <div className="flex items-center gap-2">
                            <f.icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[11px] font-medium">{f.label}</span>
                          </div>
                          <input type="checkbox" defaultChecked={f.checked} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
                <button
                  onClick={() => setShowGeneralSettings(false)}
                  className="px-6 py-2 rounded-[10px] border border-border bg-background text-xs font-bold hover:bg-muted transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleSavePortal();
                    setShowGeneralSettings(false);
                  }}
                  className="px-6 py-2 rounded-[10px] bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <div 
          className={cn(
            "w-full transition-all duration-500 ease-in-out flex flex-col items-center",
            portalDeviceOption === "mobile" ? "max-w-[400px]" : 
            portalDeviceOption === "tablet" ? "max-w-[700px]" : "max-w-5xl"
          )}
        >
          {/* Device Selection Wrapper */}
          <div
            className={cn(
              "w-full overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col shadow-2xl",
              phoneBg,
              portalDeviceOption === "mobile" ? "h-[800px] rounded-[3rem] border-8 border-zinc-800" : 
              portalDeviceOption === "tablet" ? "h-[700px] rounded-[2rem] border-[12px] border-zinc-800" : 
              "h-[800px] rounded-[10px] border border-border/50"
            )}
          >
        {/* Dynamic Island / Notch Simulation */}
        {portalDeviceOption === "mobile" && (
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
            <div className="w-32 h-6 bg-zinc-800 rounded-b-xl"></div>
          </div>
        )}

        {portalDeviceOption === "tablet" && (
          <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-50">
            <div className="w-24 h-4 bg-zinc-800 rounded-b-lg"></div>
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
                    <span className="text-[#2f6cf5] italic text-4xl">
                      Eleanor.
                    </span>
                  </h2>
                  <p className={`${textSecondary} mt-2 text-sm`}>
                    Hội viên {currentTierName}
                  </p>
                </div>
                <button
                  onClick={() => setCustomerPoints((prev) => prev + 50)}
                  className="px-3 py-1.5 bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 rounded-[10px] text-[10px] font-bold uppercase transition-all hover:bg-[#2f6cf5] hover:text-white cursor-pointer"
                >
                  +50 pts (Demo)
                </button>

                {/* Loyalty Card Element */}
                <div
                  className={`mt-6 aspect-[1.586/1] ${cardGradient} rounded-[10px] relative overflow-hidden shadow-xl flex flex-col justify-between p-6 transition-all duration-300`}
                >
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#2f6cf5] opacity-20 rounded-full blur-3xl"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <span className="font-heading font-extrabold text-[#2f6cf5] tracking-widest text-lg">
                      SEVA
                    </span>
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-[10px] transition-all cursor-pointer"
                    >
                      <ScanLine className="text-white w-6 h-6" />
                    </button>
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
                    <span className="text-[10px] font-black text-[#2f6cf5] uppercase tracking-widest">
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
                        color: "bg-[#2f6cf5]",
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

                {/* Recommended Actions Section */}
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
                    <button className="text-xs text-[#2f6cf5] font-black uppercase hover:underline">
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

                {/* Recent Activity */}
                <div
                  className={`${cardBg} rounded-[10px] p-6 transition-colors duration-300`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`${textPrimary} font-bold text-sm`}>
                      Hoạt động gần đây
                    </h3>
                    <button className="text-xs text-[#2f6cf5] font-black uppercase tracking-wider hover:underline">
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
                                ? "text-[#2f6cf5] text-sm font-bold"
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
  </AnimatePresence>
</div>
);
}
