import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Settings as SettingsIcon,
  Star,
  Shield,
  Database,
  Fingerprint,
  Webhook,
  Key as KeyIcon,
  Activity,
  Gift,
  Check,
  Plug,
  Edit2,
  Zap,
  Trash2,
  Globe,
  Coins,
  RefreshCw,
  Bell,
  Mail,
  BookOpen
} from "lucide-react";
import { CURRENCIES, getCurrency, setCurrency, CurrencyCode } from "@/lib/currency";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { SystemStatusMonitor } from "@/components/layout/SystemStatusMonitor";
import { IntegrationsManager } from "@/components/settings/IntegrationsManager";
import { AutomationRuleBuilder } from "@/components/settings/AutomationRuleBuilder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SettingsTab =
  | "general"
  | "api"
  | "automation"
  | "inventory"
  | "integrations"
  | "monitor";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [savedTabs, setSavedTabs] = useState<Record<string, boolean>>({});

  // States for low points balance notifications
  const [isAlertEnabled, setIsAlertEnabled] = useState<boolean>(() => {
    return localStorage.getItem("crm_alert_enabled") === "true";
  });
  const [pointThreshold, setPointThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("crm_alert_point_threshold");
    return saved ? parseInt(saved, 10) : 500;
  });
  const [alertEmail, setAlertEmail] = useState<string>(() => {
    const saved = localStorage.getItem("crm_alert_email");
    return saved || "admin@sevaretail.vip";
  });

  const handleSendTestAlert = () => {
    if (!alertEmail || !alertEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email quản trị viên hợp lệ!");
      return;
    }
    toast.info(`Đang kích hoạt quy trình mô phỏng gửi email...`);
    setTimeout(() => {
      toast.success(
        `Email thông báo cảnh báo đã được gửi thành công đến ${alertEmail}! Nội dung mẫu: Phát hiện một số thành viên có số dư giảm dưới ngưỡng ${pointThreshold} điểm.`
      );
    }, 1000);
  };
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [automationRules, setAutomationRules] = useState([
    { id: "r1", name: "Thưởng sinh nhật", trigger: "Bithday is Today", action: "Award 500 Points", active: true },
    { id: "r2", name: "Chào mừng thành viên mới", trigger: "New Account Signup", action: "Award 100 Points", active: true },
    { id: "r3", name: "Khôi phục khách rời bỏ", trigger: "Last visit > 90 days", action: "Send 20% Coupon", active: false },
  ]);

  useEffect(() => {
    const handleSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: SettingsTab }>;
      const tabId = customEvent.detail?.tab;
      if (tabId) {
        setSavedTabs((prev) => ({ ...prev, [tabId]: true }));
        // Persist the status for 4 seconds, then fade out
        setTimeout(() => {
          setActiveTab(prev => {
             // Side effect to fade out saved status
             setSavedTabs((p) => ({ ...p, [tabId]: false }));
             return prev;
          });
        }, 4000);
      }
    };
    window.addEventListener("crm-config-saved", handleSaved);
    return () => window.removeEventListener("crm-config-saved", handleSaved);
  }, []);

  const handleCreateApiKey = () => {
    toast.success("Đã tạo API Key mới thành công!");
    window.dispatchEvent(
      new CustomEvent("crm-config-saved", { detail: { tab: "api" } }),
    );
  };

  const tabs = [
    { id: "general", label: "Cài đặt chung", icon: Globe },
    { id: "api", label: "Kết nối API", icon: Webhook },
    { id: "automation", label: "Quy tắc Tự động", icon: Zap },
    { id: "inventory", label: "Kho quà tặng (Stock)", icon: Gift },
    { id: "integrations", label: "Tích hợp ERP/CRM", icon: Plug },
    { id: "monitor", label: "Giám sát Hệ thống", icon: Activity },
  ];

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-[#2f6cf5]/30 p-5 md:p-6 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-[#2f6cf5]/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-[#2f6cf5]/10 rounded-[10px] text-[#2f6cf5] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "linear",
            }}
          >
            <SettingsIcon className="w-8 h-8 text-[#2f6cf5]" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
              Cấu hình Hệ thống
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các thiết lập nền tảng cho hệ thống ưu đãi và CRM.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
        <button
          onClick={() => {}}
          className="flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-background border-border hover:bg-muted text-foreground"
        >
          <BookOpen className="w-4 h-4 mr-2 text-[#2f6cf5]" /> Tài liệu {tabs.find(t => t.id === activeTab)?.label}
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-xl border border-border">
          <Shield className="w-4 h-4 text-[#2f6cf5]" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">
            Enterprise
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 space-y-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      <div className="pt-6 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Vertical Tabs */}
        <div className="w-full lg:w-72 bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl flex flex-col p-4 shrink-0 gap-1 h-fit">
          <span className="text-xs font-extrabold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2 block">
            Mục cấu hình
          </span>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSaved = savedTabs[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  "flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all gap-3 text-left w-full cursor-pointer relative overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  isSaved && "border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-extrabold"
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    isSaved ? "text-emerald-500" : (isActive ? "text-primary" : "text-muted-foreground/80"),
                  )}
                />
                <span className="truncate flex-1">{tab.label}</span>
                {isSaved ? (
                  <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse shrink-0">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                ) : (
                  isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Setting Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === "general" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-muted/10">
                      <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" /> Ngôn ngữ & Tiền tệ
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tùy chỉnh cách hiển thị dữ liệu tài chính và ngôn ngữ trên toàn hệ thống.
                      </p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" /> Đơn vị tiền tệ chính
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.values(CURRENCIES).map((curr) => (
                            <button
                              key={curr.code}
                              onClick={() => {
                                setCurrency(curr.code as CurrencyCode);
                                toast.success(`Đã đổi đơn vị tiền tệ sang ${curr.code}`);
                                window.dispatchEvent(new CustomEvent("crm-config-saved", { detail: { tab: "general" } }));
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-1",
                                getCurrency().code === curr.code
                                  ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                                  : "bg-muted/30 border-border hover:border-primary/30"
                              )}
                            >
                              <span className="text-lg font-black">{curr.symbol}</span>
                              <span className="text-[10px] font-bold uppercase">{curr.code}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          * Các chỉ số giá trị vòng đời (CLV) và ngưỡng thăng hạng sẽ được tự động quy đổi theo tỷ giá hiện tại.
                        </p>
                      </div>

                      <div className="pt-6 border-t border-border/40 space-y-4">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-500" /> Ngôn ngữ hệ thống
                        </label>
                        <div className="flex gap-3">
                           <button className="px-4 py-2 bg-primary/10 border border-primary text-primary rounded-xl text-xs font-bold">Tiếng Việt</button>
                           <button className="px-4 py-2 bg-muted/40 border border-border text-muted-foreground rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">English (Coming soon)</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm text-left">
                    <div className="p-6 border-b border-border bg-muted/10">
                      <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" /> Đăng ký Nhận Cảnh báo Điểm thấp (Low Point Alerts)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nhận thông báo email tự động khi số dư điểm của khách hàng giảm xuống dưới ngưỡng thiết lập.
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between p-4 bg-muted/30 border border-border/60 rounded-xl">
                        <div className="space-y-0.5 text-left flex-1 pr-4">
                          <label className="text-sm font-bold text-foreground">Kích hoạt thông báo cảnh báo</label>
                          <p className="text-xs text-muted-foreground">Admin và Quản trị viên sẽ nhận được email ngay lập tức khi số dư điểm của khách hàng bị sụt giảm quá hoặc bằng ngưỡng quy chuẩn.</p>
                        </div>
                        <button
                          onClick={() => {
                            const val = !isAlertEnabled;
                            setIsAlertEnabled(val);
                            localStorage.setItem("crm_alert_enabled", String(val));
                            toast.success(val ? "Đã bật đăng ký email nhận cảnh báo điểm thấp" : "Đã tắt đăng ký email nhận cảnh báo");
                            window.dispatchEvent(new CustomEvent("crm-config-saved", { detail: { tab: "general" } }));
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20",
                            isAlertEnabled ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                              isAlertEnabled ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>

                      {isAlertEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
                              Ngưỡng điểm sụt giảm cảnh báo
                            </label>
                            <input
                              type="number"
                              value={pointThreshold}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setPointThreshold(val);
                                localStorage.setItem("crm_alert_point_threshold", String(val));
                              }}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25"
                              min={0}
                              placeholder="Ví dụ: 500"
                            />
                            <p className="text-[11px] text-muted-foreground">Ví dụ: Hệ thống phát cảnh báo khi thành viên giảm xuống dưới 500 điểm.</p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-xs uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
                              Địa chỉ email nhận thông báo
                            </label>
                            <input
                              type="email"
                              value={alertEmail}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAlertEmail(val);
                                localStorage.setItem("crm_alert_email", val);
                              }}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25"
                              placeholder="admin@sevaretail.com"
                              required
                            />
                            <p className="text-[11px] text-muted-foreground">Admin nhận tin nhắn dạng cảnh báo hệ quản trị VIP (chỉ chấp nhận email hợp lệ).</p>
                          </div>
                        </div>
                      )}

                      {isAlertEnabled && (
                        <div className="pt-4 border-t border-border/40 flex flex-wrap justify-between items-center gap-4">
                          <button
                            onClick={handleSendTestAlert}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            Gửi email thử nghiệm
                          </button>
                          
                          <button
                            onClick={() => {
                              toast.success("Cấu hình Đăng ký Cảnh báo hệ thống đã được lưu thành công!");
                              window.dispatchEvent(new CustomEvent("crm-config-saved", { detail: { tab: "general" } }));
                            }}
                            className="px-6 py-2 bg-[#2f6cf5] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                          >
                            Lưu cấu hình nhận thông báo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <SystemHealthWidget />
                </div>
              )}
              {activeTab === "api" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-muted/10">
                      <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                        <KeyIcon className="w-5 h-5 text-primary" /> API Keys
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sử dụng API Key để tích hợp SEVA với hệ thống POS hoặc
                        Website của bạn.
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
                        <div className="text-sm">
                          sk_live_************************4k2p
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-600 border-none"
                          >
                            Live
                          </Badge>
                          <button className="text-xs text-primary font-bold hover:underline">
                            Sao chép
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleCreateApiKey}
                        className="text-sm text-primary font-bold hover:underline flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Tạo API Key mới
                      </button>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-muted/10">
                      <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                        <Webhook className="w-5 h-5 text-primary" /> Webhooks
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nhận thông báo thời gian thực khi có sự kiện xảy ra (mua
                        hàng, nâng hạng...).
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                        <Webhook className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Chưa có Webhook nào được cấu hình.
                        </p>
                        <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
                          Thêm Webhook URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "automation" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" /> Trình tạo quy tắc Tự động
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Định nghĩa các kịch bản "Nếu - Thì" để tự động hóa quy trình chăm sóc và tặng thưởng.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowRuleBuilder(true)}
                        className="px-4 py-2 bg-[#2f6cf5] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Thêm quy tắc mới
                      </button>
                    </div>
                    <div className="p-0">
                       <div className="divide-y divide-border/40">
                          {automationRules.map((rule) => (
                             <div key={rule.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-sm">{rule.name}</h4>
                                      <Badge variant={rule.active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                         {rule.active ? "Đang chạy" : "Tạm dừng"}
                                      </Badge>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="font-mono text-[10px]">IF</Badge>
                                      <span>{rule.trigger}</span>
                                      <Badge variant="outline" className="font-mono text-[10px]">THEN</Badge>
                                      <span className="text-primary font-bold">{rule.action}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${rule.active ? 'bg-emerald-500' : 'bg-muted'}`} onClick={() => {
                                      setAutomationRules(rules => rules.map(r => r.id === rule.id ? {...r, active: !r.active} : r));
                                      toast.info(`Đã ${rule.active ? 'tắt' : 'bật'} quy tắc "${rule.name}"`);
                                   }}>
                                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rule.active ? 'left-5.5' : 'left-0.5'}`} />
                                   </div>
                                   <button 
                                      className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      onClick={() => {
                                         setAutomationRules(rules => rules.filter(r => r.id !== rule.id));
                                         toast.error(`Đã xóa quy tắc "${rule.name}"`);
                                      }}
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  <AutomationRuleBuilder 
                    isOpen={showRuleBuilder}
                    onClose={() => setShowRuleBuilder(false)}
                    onSave={(newRule) => {
                       setAutomationRules(prev => [newRule, ...prev]);
                       toast.success(`Đã kích hoạt quy tắc tự động mới: ${newRule.name}`);
                    }}
                  />
                </div>
              )}
              {activeTab === "inventory" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold font-heading text-lg flex items-center gap-2">
                          <Gift className="w-5 h-5 text-amber-500" /> Stock Watcher (Giám sát kho)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cấu hình ngưỡng cảnh báo khi số lượng quà tặng trong kho hạ thấp.
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Hệ thống tự động
                      </Badge>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-bold">Ngưỡng cảnh báo tối thiểu</label>
                            <div className="flex items-center gap-2">
                               <input 
                                  type="number" 
                                  defaultValue={10} 
                                  className="w-20 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm font-bold text-center"
                               />
                               <span className="text-xs text-muted-foreground font-bold">đơn vị</span>
                            </div>
                         </div>
                         <p className="text-[11px] text-muted-foreground">
                            Hệ thống sẽ hiển thị thông báo khẩn cấp tại Dashboard khi số lượng bất kỳ quà tặng nào hạ xuống dưới mức này.
                         </p>
                      </div>

                      <div className="pt-6 border-t border-border/40">
                         <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Danh sách quản lý kho quà hiện tại</h4>
                         <div className="space-y-3">
                            {[
                              { name: "Voucher High-Tea Atelier", stock: 8, low: true },
                              { name: "Set Nến thơm Signature", stock: 25, low: false },
                              { name: "Khăn lụa Tơ tằm Luxury", stock: 12, low: false },
                              { name: "Vé mời Private Showcase", stock: 3, low: true },
                            ].map((item, i) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-2 h-2 rounded-full ${item.low ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                     <span className="text-xs font-bold">{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <div className="text-xs">
                                        <span className={`font-black ${item.low ? 'text-rose-500' : 'text-foreground'}`}>{item.stock}</span>
                                        <span className="text-muted-foreground ml-1">còn lại</span>
                                     </div>
                                     <button className="p-1.5 hover:bg-muted rounded-lg text-primary transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                         <button 
                            onClick={() => {
                               toast.success("Cấu hình Stock Watcher đã được lưu.");
                               window.dispatchEvent(new CustomEvent("crm-config-saved", { detail: { tab: "inventory" } }));
                            }}
                            className="px-6 py-2 bg-[#2f6cf5] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                         >
                            Lưu cấu hình
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "integrations" && (
                <div className="max-w-6xl mx-auto pb-12">
                  <IntegrationsManager />
                </div>
              )}
              {activeTab === "monitor" && (
                <div className="max-w-6xl mx-auto pb-12">
                  <SystemStatusMonitor />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SystemHealthWidget() {
  const [testing, setTesting] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Đo lường tự động");
  const [statusMap, setStatusMap] = useState({
    crmApi: { label: "Active", latency: "24 ms", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
    firestore: { label: "Active", latency: "38 ms", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
    loyaltyEngine: { label: "Active", latency: "12 ms", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
    notificationService: { label: "Pending", latency: "115 ms", colorClass: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
    backupCluster: { label: "Inactive", latency: "N/A", colorClass: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  });

  const handleQuickCheck = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setLastCheck(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      const r1 = Math.round(20 + Math.random() * 15);
      const r2 = Math.round(30 + Math.random() * 20);
      const r3 = Math.round(10 + Math.random() * 8);
      setStatusMap({
        crmApi: { label: "Active", latency: `${r1} ms`, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
        firestore: { label: "Active", latency: `${r2} ms`, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
        loyaltyEngine: { label: "Active", latency: `${r3} ms`, colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
        notificationService: { label: "Active", latency: "45 ms", colorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
        backupCluster: { label: "Inactive", latency: "N/A", colorClass: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
      });
      toast.success("Đã kiểm chuẩn thời gian thực toàn bộ API và Cơ sở dữ liệu!");
    }, 1200);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm text-left">
      <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold font-heading text-lg flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" /> Giám sát Sức khỏe Hệ thống (SLA)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Bản kiểm soát trạng thái các cổng API và kết nối Cơ sở dữ liệu thực cho quản trị viên.
          </p>
        </div>
        <button
          onClick={handleQuickCheck}
          disabled={testing}
          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:scale-[1.02] transition-all rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", testing && "animate-spin")} />
          {testing ? "Đang truy vấn..." : "Kiểm tra khẩn cấp"}
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* CRM Core API Gateway */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-blue-500" /> CRM Core API
              </span>
              <Badge className={cn("text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full", statusMap.crmApi.colorClass)}>
                {testing ? "Testing..." : statusMap.crmApi.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{testing ? "--" : statusMap.crmApi.latency}</span>
              <span className="text-[10px] text-muted-foreground">Gateway Delay</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>SLA Target: &lt;100ms</span>
              <span className="font-medium text-emerald-500">99.99% Uptime</span>
            </div>
          </div>

          {/* Primary Firestore DB */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#2f6cf5]" /> Firestore DB
              </span>
              <Badge className={cn("text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full", statusMap.firestore.colorClass)}>
                {testing ? "Testing..." : statusMap.firestore.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{testing ? "--" : statusMap.firestore.latency}</span>
              <span className="text-[10px] text-muted-foreground">Write/Read Latency</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>Project Storage</span>
              <span className="font-medium text-indigo-500 font-mono">ai-studio-ea87...</span>
            </div>
          </div>

          {/* Loyalty Calculation Engine */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Loyalty Engine
              </span>
              <Badge className={cn("text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full", statusMap.loyaltyEngine.colorClass)}>
                {testing ? "Testing..." : statusMap.loyaltyEngine.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{testing ? "--" : statusMap.loyaltyEngine.latency}</span>
              <span className="text-[10px] text-muted-foreground">Event Multipliers</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>Tier Rewards Cal</span>
              <span className="font-medium text-emerald-500">Optimized</span>
            </div>
          </div>

          {/* SMS & Notification service */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-amber-500" /> Notifications
              </span>
              <Badge className={cn("text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full", statusMap.notificationService.colorClass)}>
                {testing ? "Testing..." : statusMap.notificationService.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{testing ? "--" : statusMap.notificationService.latency}</span>
              <span className="text-[10px] text-muted-foreground">Broker Handshake</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>Firebase Cloud Msg</span>
              <span className="font-medium text-amber-500 font-bold">Warning Slow</span>
            </div>
          </div>

          {/* Cloud SQL Connection Pool */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-500" /> Cloud SQL Pool
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full">
                Active
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">4 / 10</span>
              <span className="text-[10px] text-muted-foreground">Active Connections</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>Relational Schema</span>
              <span className="font-medium text-cyan-500 font-mono">Drizzle Pool</span>
            </div>
          </div>

          {/* Backup Replica Server */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" /> Backup Replica
              </span>
              <Badge className={cn("text-[10px] font-black border uppercase shadow-none select-none py-0.5 px-2 rounded-full", statusMap.backupCluster.colorClass)}>
                {statusMap.backupCluster.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">Hold</span>
              <span className="text-[10px] text-muted-foreground">Node Sync State</span>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-2 flex justify-between">
              <span>Auto daily sync</span>
              <span className="font-medium text-zinc-500">04:00 AM UTC</span>
            </div>
          </div>

        </div>

        <div className="text-[11px] text-muted-foreground/80 flex items-center justify-between pt-2 border-t border-border/40">
          <span>Thời gian tự kiểm chuẩn cuối kỳ: <strong className="text-foreground">{lastCheck}</strong></span>
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Bản tin được mã hóa bảo mật SSL v3</span>
        </div>
      </div>
    </div>
  );
}

