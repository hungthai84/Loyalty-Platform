import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Settings as SettingsIcon, Star, Clock, ChevronRight, Shield, Layers, Database, Fingerprint, Webhook, Key as KeyIcon, Activity, GitCompare, Gift, User } from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { CustomerPortalView } from "@/views/CustomerPortalView";
import { LoyaltySettingsView } from "@/components/loyalty/LoyaltySettingsView";
import { TierManagementView } from "@/components/loyalty/TierManagementView";
import { StatusTransitionConfigView } from "@/components/loyalty/StatusTransitionConfigView";
import { PointRedemptionConfigView } from "@/components/loyalty/PointRedemptionConfigView";
import { SystemStatusMonitor } from "@/components/layout/SystemStatusMonitor";
import { SeedDemoData } from "@/components/layout/SeedDemoData";
import { RoleManager } from "@/components/settings/RoleManager";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { CompanyManager } from "@/components/settings/CompanyManager";
import { cn } from "@/lib/utils";

type SettingsTab = 'profile' | 'companies' | 'tiers' | 'redemption' | 'retention' | 'transitions' | 'portal' | 'api' | 'monitor' | 'demo' | 'roles';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'companies', label: 'Công ty & Chi nhánh', icon: Building2 },
    { id: 'tiers', label: 'Cấp bậc khách hàng', icon: Star },
    { id: 'redemption', label: 'Đổi quà ưu đãi', icon: Gift },
    { id: 'retention', label: 'Trạng thái & Rủi ro', icon: Clock },
    { id: 'transitions', label: 'Luật chuyển trạng thái', icon: GitCompare },
    { id: 'api', label: 'Kết nối API', icon: Webhook },
    { id: 'portal', label: 'Tùy chỉnh Cổng Loyalty', icon: Fingerprint },
    { id: 'monitor', label: 'Giám sát Hệ thống', icon: Activity },
    { id: 'demo', label: 'Sandbox Dữ liệu', icon: Database },
    { id: 'roles', label: 'Vai trò & Phân quyền', icon: Shield },
  ];

 return (
 <div className="flex-1 space-y-6 p-8 pt-6">
 <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full">
 <div className="flex items-center gap-4 text-left">
 <div className="p-3 bg-[#2f6cf5]/10 rounded-2xl text-[#2f6cf5] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
 <motion.div
 animate={{ 
 rotate: 360
 }}
 transition={{ 
 repeat: Infinity,
 duration: 8,
 ease: "linear"
 }}
 >
 <SettingsIcon className="w-8 h-8 text-[#2f6cf5]" />
 </motion.div>
 </div>
 <div>
 <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Cấu hình Hệ thống</h2>
 <p className="text-muted-foreground text-sm mt-1">Quản lý các thiết lập nền tảng cho hệ thống ưu đãi và CRM.</p>
 </div>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-xl border border-border shrink-0 self-start lg:self-auto">
 <Shield className="w-4 h-4 text-[#2f6cf5]" />
 <span className="text-xs font-bold uppercase tracking-widest text-foreground">Enterprise Access</span>
 </div>
 </div>

 <div className="flex flex-col lg:flex-row gap-6">
 {/* Left Side: Vertical Tabs */}
 <div className="w-full lg:w-72 bg-card/45 backdrop-blur-md border border-border/60 rounded-2xl flex flex-col p-4 shrink-0 gap-1 h-fit">
 <span className="text-xs font-extrabold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2 block">
 Mục cấu hình
 </span>
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as SettingsTab)}
 className={cn(
 "flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all gap-3 text-left w-full cursor-pointer",
 isActive 
 ? "bg-primary/10 text-primary" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
 )}
 >
 <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/80")} />
 <span className="truncate flex-1">{tab.label}</span>
 {isActive && (
 <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
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
 {activeTab === 'profile' && (
 <div className="max-w-6xl mx-auto pb-12">
 <ProfileTab />
 </div>
 )}
 {activeTab === 'companies' && (
 <div className="max-w-6xl mx-auto pb-12">
 <CompanyManager />
 </div>
 )}
 {activeTab === 'tiers' && (
 <div className="max-w-6xl mx-auto">
 <TierManagementView />
 </div>
 )}
 {activeTab === 'redemption' && (
 <div className="max-w-6xl mx-auto pb-12">
 <PointRedemptionConfigView />
 </div>
 )}
 {activeTab === 'retention' && (
 <div className="max-w-3xl mx-auto">
 <LoyaltySettingsView />
 </div>
 )}
 {activeTab === 'transitions' && (
 <div className="max-w-6xl mx-auto pb-12">
 <StatusTransitionConfigView />
 </div>
 )}
 {activeTab === 'api' && (
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
 <div className="p-6 border-b border-border bg-muted/10">
 <h3 className="font-bold font-heading text-lg flex items-center gap-2">
 <KeyIcon className="w-5 h-5 text-primary" /> API Keys
 </h3>
 <p className="text-xs text-muted-foreground mt-1">Sử dụng API Key để tích hợp SEVA với hệ thống POS hoặc Website của bạn.</p>
 </div>
 <div className="p-6 space-y-4">
 <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
 <div className="text-sm">sk_live_************************4k2p</div>
 <div className="flex items-center gap-2">
 <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none">Live</Badge>
 <button className="text-xs text-primary font-bold hover:underline">Sao chép</button>
 </div>
 </div>
 <button className="text-sm text-primary font-bold hover:underline flex items-center gap-2">
 <Plus className="w-4 h-4" /> Tạo API Key mới
 </button>
 </div>
 </div>

 <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
 <div className="p-6 border-b border-border bg-muted/10">
 <h3 className="font-bold font-heading text-lg flex items-center gap-2">
 <Webhook className="w-5 h-5 text-primary" /> Webhooks
 </h3>
 <p className="text-xs text-muted-foreground mt-1">Nhận thông báo thời gian thực khi có sự kiện xảy ra (mua hàng, nâng hạng...).</p>
 </div>
 <div className="p-6">
 <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
 <Webhook className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
 <p className="text-sm text-muted-foreground">Chưa có Webhook nào được cấu hình.</p>
 <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
 Thêm Webhook URL
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 {activeTab === 'portal' && (
 <div className="max-w-4xl mx-auto space-y-6 pb-12">
 <div className="bg-card/45 backdrop-blur-md border border-border/60 p-6 md:p-8 rounded-3xl shadow-sm space-y-8">
 <div>
 <h3 className="text-lg font-bold text-foreground font-heading">Tùy chỉnh Cổng Loyalty</h3>
 <p className="text-xs text-muted-foreground mt-1">
 Cấu hình giao diện và tính năng hiển thị cho khách hàng cuối trên thiết bị di động và web.
 </p>
 </div>

 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Màu sắc thương hiệu chủ đạo</label>
 <div className="flex items-center gap-4">
 <button className="w-10 h-10 rounded-xl bg-[#2f6cf5] ring-2 ring-offset-2 ring-[#2f6cf5] ring-offset-background"></button>
 <button className="w-10 h-10 rounded-xl border border-border bg-rose-500 hover:scale-110 transition-transform"></button>
 <button className="w-10 h-10 rounded-xl border border-border bg-emerald-500 hover:scale-110 transition-transform"></button>
 <button className="w-10 h-10 rounded-xl border border-border bg-amber-500 hover:scale-110 transition-transform"></button>
 <button className="w-10 h-10 rounded-xl border border-border bg-purple-500 hover:scale-110 transition-transform"></button>
 </div>
 </div>

 <div className="space-y-4">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái Cổng Website</label>
 <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
 <span className="text-sm font-medium text-primary flex-1">Đang hoạt động (Online)</span>
 <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
 Copy Link Tích hợp
 </button>
 </div>
 </div>

 <div className="space-y-3">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tính năng hiển thị</label>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {[
 { id: 'f1', label: 'Mã QR thẻ thành viên', icon: Fingerprint, checked: true },
 { id: 'f2', label: 'Hạng và điểm tích lũy', icon: Star, checked: true },
 { id: 'f3', label: 'Cửa hàng quà tặng', icon: Gift, checked: true },
 { id: 'f4', label: 'Thông báo & Ưu đãi', icon: Activity, checked: true },
 { id: 'f5', label: 'Lịch sử mua hàng (POS)', icon: Database, checked: true },
 { id: 'f6', label: 'Yêu cầu hỗ trợ (Ticket)', icon: Shield, checked: false }
 ].map(f => (
 <label key={f.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 hover:bg-muted/20 hover:border-primary/30 cursor-pointer transition-all">
 <input type="checkbox" defaultChecked={f.checked} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
 <div className="flex-1 flex items-center gap-3">
 <span className="p-1.5 rounded-lg bg-muted/50">
 <f.icon className="w-4 h-4 text-muted-foreground" />
 </span>
 <span className="text-sm font-medium">{f.label}</span>
 </div>
 </label>
 ))}
 </div>
 </div>

 <div className="pt-6 border-t border-border/50 flex justify-end">
 <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:scale-105 hover:shadow-lg transition-all active:scale-95">
 Lưu Cấu Hình Cổng
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 {activeTab === 'monitor' && (
 <div className="max-w-6xl mx-auto pb-12">
 <SystemStatusMonitor />
 </div>
 )}
 {activeTab === 'demo' && (
 <div className="max-w-6xl mx-auto pb-12">
 <SeedDemoData />
 </div>
 )}
 {activeTab === 'roles' && (
 <div className="max-w-6xl mx-auto pb-12">
 <RoleManager />
 </div>
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}
