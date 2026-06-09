import React, { useState } from "react";
import { X, Star, Building2, SlidersHorizontal, GitCompare } from "lucide-react";
import * as motion from "motion/react-client";
import { TierManagementView } from "@/components/loyalty/TierManagementView";
import { CompanyManager } from "@/components/settings/CompanyManager";
import { AttributeManager } from "@/components/customers/AttributeManager";
import { StatusTransitionConfigView } from "@/components/loyalty/StatusTransitionConfigView";
import { AttributeDefinition } from "@/types";

interface CrmSettingsDialogProps {
  onClose: () => void;
  attributes: AttributeDefinition[];
}

type TabType = "tiers" | "companies" | "custom_fields" | "transitions";

export function CrmSettingsDialog({ onClose, attributes }: CrmSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("tiers");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl bg-card border border-border shadow-2xl rounded-[1.5rem] flex flex-col h-[85vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="text-left">
            <h2 className="text-xl font-bold text-foreground font-heading flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
              Cài đặt Hệ thống CRM & VIP
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cấu hình cấp bậc hội viên, quản lý hệ thống đại lý/chi nhánh trực thuộc, bộ quy luật chuyển trạng thái và tùy chỉnh các trường bổ sung.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-muted/80 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation bar */}
        <div className="flex border-b border-border bg-muted/10 px-6 py-2 gap-1 overflow-x-auto">
          {[
            { id: "tiers", label: "Cấu hình phân hạng VIP", icon: Star, color: "text-amber-500" },
            { id: "companies", label: "Công ty & Chi nhánh", icon: Building2, color: "text-blue-500" },
            { id: "transitions", label: "Quy luật trạng thái", icon: GitCompare, color: "text-purple-500" },
            { id: "custom_fields", label: "Trường dữ liệu tùy chỉnh", icon: SlidersHorizontal, color: "text-emerald-500" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-background shadow-xs text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background/50">
          {activeTab === "tiers" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <TierManagementView />
            </div>
          )}

          {activeTab === "companies" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 mb-6 flex items-center justify-between text-left">
                <div>
                  <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" /> Quản lý Công ty & Chi nhánh
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hệ thống phân cấp chi nhánh bán lẻ trang sức Seva, gán khách hàng & đối soát doanh thu đa vùng.
                  </p>
                </div>
              </div>
              <CompanyManager />
            </div>
          )}

          {activeTab === "transitions" && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 mb-6 flex items-center justify-between text-left">
                <div>
                  <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-purple-500" /> Cấu hình Quy luật chuyển trạng thái
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Số ngày không phát sinh giao dịch để tự động chuyển khách hàng giữa các nhóm trạng thái (Chăm sóc, Rời bỏ, ...).
                  </p>
                </div>
              </div>
              <StatusTransitionConfigView />
            </div>
          )}

          {activeTab === "custom_fields" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 mb-4 flex items-center justify-between text-left">
                <div>
                  <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-500" /> Quản lý thuộc tính mở rộng
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tùy chỉnh thông tin bổ sung cho hồ sơ khách hàng (Ví dụ: Sở thích đá phong thủy, Cỡ tay nhẫn, FB/Zalo link).
                  </p>
                </div>
              </div>
              <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
                <AttributeManager inline attributes={attributes} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
