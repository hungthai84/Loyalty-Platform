import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/views/DashboardView";
import { CustomersView } from "@/views/CustomersView";
import { LoyaltyView } from "@/views/LoyaltyView";
import { MarketingView } from "@/views/MarketingView";
import { SettingsView } from "@/views/SettingsView";
import { CustomerPortalView } from "@/views/CustomerPortalView";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsView } from "./views/AnalyticsView";
import { AnalysisView } from "./views/AnalysisView";
import { FirebaseProvider, useFirebase } from "@/components/FirebaseProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

function AppContent() {
  const [activeView, setActiveView] = useState("dashboard");
  const { loading } = useFirebase();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const safeActiveView = activeView;

  return (
    <div className="h-full w-full flex bg-background rounded-[10px] overflow-hidden shadow-[0_45px_120px_-15px_rgba(0,0,0,0.95),_0_0_80px_rgba(255,255,255,0.035)] border-2 border-black dark:border-white relative selection:bg-[#eb7a2e]/10">
      <Sidebar 
        className="hidden md:flex shrink-0" 
        activeView={safeActiveView} 
        setActiveView={setActiveView} 
      />
      
      <div className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300">
        <main className="flex-1 overflow-auto bg-sidebar">
          <div className="mx-auto w-full max-w-[1600px] px-4 md:px-6">
            <div id="dashboard-upper-portal" />
          </div>
          
          <div className="mx-auto w-full max-w-[1600px] px-4 md:px-6 py-6">
            {safeActiveView === "dashboard" && <DashboardView />}
            {safeActiveView === "customers" && <CustomersView />}
            {safeActiveView === "loyalty" && <LoyaltyView />}
            {safeActiveView === "marketing" && <MarketingView />}
            {safeActiveView === "settings" && <SettingsView />}
            {safeActiveView === "portal" && <CustomerPortalView />}
            {safeActiveView === "analysis" && <AnalysisView />}
            {safeActiveView === "analytics" && <AnalyticsView />}
            
            {["support", "billing"].includes(safeActiveView) && (
              <div className="flex-1 flex items-center justify-center p-8 h-[80vh]">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-muted-foreground font-heading capitalize">Phân hệ {safeActiveView}</h3>
                  <p className="text-muted-foreground/60 max-w-sm mx-auto">Phân hệ doanh nghiệp này đang được phát triển.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="h-screen w-screen p-[5px] overflow-hidden relative theme-transition bg-[#6E62E5]">
          <AppContent />
        </div>
        <Toaster />
      </ThemeProvider>
    </FirebaseProvider>
  );
}
