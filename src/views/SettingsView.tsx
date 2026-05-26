import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Settings as SettingsIcon, 
  Star, 
  Clock, 
  ChevronRight, 
  Plus,
  Shield,
  Layers,
  Database,
  Fingerprint,
  Webhook,
  Key as KeyIcon,
  Activity
} from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { CompaniesView } from "@/views/CompaniesView";
import { CustomerPortalView } from "@/views/CustomerPortalView";
import { LoyaltySettingsView } from "@/components/loyalty/LoyaltySettingsView";
import { TierManagementView } from "@/components/loyalty/TierManagementView";
import { SystemStatusMonitor } from "@/components/layout/SystemStatusMonitor";
import { cn } from "@/lib/utils";

type SettingsTab = 'company' | 'tiers' | 'retention' | 'portal' | 'api' | 'monitor';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  const tabs = [
    { id: 'company', label: 'Công ty & Chi nhánh', icon: Building2 },
    { id: 'tiers', label: 'Cấp bậc khách hàng', icon: Star },
    { id: 'retention', label: 'Trạng thái & Rủi ro', icon: Clock },
    { id: 'api', label: 'Kết nối API', icon: Webhook },
    { id: 'portal', label: 'Cổng Khách hàng', icon: Fingerprint },
    { id: 'monitor', label: 'Giám sát Hệ thống', icon: Activity },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/5">
      <div className="px-8 pt-8 pb-4 space-y-6 bg-background border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading">Cấu hình Hệ thống</h2>
            <p className="text-muted-foreground text-sm mt-1">Quản lý các thiết lập nền tảng cho hệ thống ưu đãi và CRM.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border">
             <Shield className="w-4 h-4 text-primary" />
             <span className="text-xs font-bold uppercase tracking-widest">Enterprise Access</span>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  "flex items-center px-6 py-2 rounded-xl text-sm font-bold transition-all gap-2",
                  activeTab === tab.id 
                    ? "bg-background text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'company' && (
              <div className="max-w-6xl mx-auto">
                 <CompaniesView embedded />
              </div>
            )}
            {activeTab === 'tiers' && (
              <div className="max-w-6xl mx-auto">
                <TierManagementView />
              </div>
            )}
            {activeTab === 'retention' && (
              <div className="max-w-3xl mx-auto">
                <LoyaltySettingsView />
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
                      <div className="font-mono text-sm">sk_live_************************4k2p</div>
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
              <div className="h-full">
                <CustomerPortalView />
              </div>
            )}
            {activeTab === 'monitor' && (
              <div className="max-w-6xl mx-auto pb-12">
                <SystemStatusMonitor />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
