import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardView } from "@/views/DashboardView";
import { CustomersView } from "@/views/CustomersView";
import { LoyaltyView } from "@/views/LoyaltyView";
import { MarketingView } from "@/views/MarketingView";
import { CompaniesView } from "@/views/CompaniesView";
import { SettingsView } from "@/views/SettingsView";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsView } from "./views/AnalyticsView";
import { AnalysisView } from "./views/AnalysisView";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <FirebaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="h-screen w-screen p-[10px] overflow-hidden relative theme-transition">
          {/* Gorgeous Uiverse.io Soft Pastel Rotating Glow Background */}
          <div className="uiverse-container" />
          
          <div className="h-full w-full flex bg-white/45 dark:bg-[#080808]/40 backdrop-blur-3xl rounded-[16px] overflow-hidden shadow-2xl shadow-black/15 border border-white/40 dark:border-white/5 relative selection:bg-primary/20">
            <>
              {/* Sidebar hidden on mobile, width controlled by component on desktop */}
              <Sidebar 
                className="hidden md:flex shrink-0" 
                activeView={activeView} 
                setActiveView={setActiveView} 
              />
              
              {/* Main Content Space */}
              <div className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300">
                <Topbar />
                
                <main className="flex-1 overflow-auto bg-background/60">
                  {activeView === "dashboard" && <DashboardView />}
                  {activeView === "customers" && <CustomersView />}
                  {activeView === "companies" && <CompaniesView />}
                  {activeView === "loyalty" && <LoyaltyView />}
                  {activeView === "marketing" && <MarketingView />}
                  {activeView === "analytics" && <AnalyticsView />}
                  {activeView === "analysis" && <AnalysisView />}
                  {activeView === "settings" && <SettingsView />}
                  
                  {/* Fallback for other standard views */}
                  {["support", "billing"].includes(activeView) && (
                    <div className="flex-1 flex items-center justify-center p-8 h-[80vh]">
                      <div className="text-center space-y-4">
                        <h3 className="text-2xl font-bold text-muted-foreground font-heading capitalize">Phân hệ {activeView}</h3>
                        <p className="text-muted-foreground/60 max-w-sm mx-auto">Phân hệ doanh nghiệp này đang được phát triển.</p>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </FirebaseProvider>
  );
}

