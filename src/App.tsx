import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardView } from "@/views/DashboardView";
import { CustomersView } from "@/views/CustomersView";
import { LoyaltyView } from "@/views/LoyaltyView";
import { CustomerPortalView } from "@/views/CustomerPortalView";
import { MarketingView } from "@/views/MarketingView";
import { CompaniesView } from "@/views/CompaniesView";
import { SettingsView } from "@/views/SettingsView";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsView } from "./views/AnalyticsView";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <FirebaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="h-screen w-screen bg-muted/40 p-[10px] overflow-hidden relative theme-transition">
          {/* Glass background decorative elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="h-full w-full flex bg-background/50 dark:bg-background/30 backdrop-blur-2xl rounded-[10px] overflow-hidden shadow-2xl shadow-black/10 border border-white/20 dark:border-white/5 relative selection:bg-primary/20">
            {activeView === "portal" ? (
              <CustomerPortalView onBack={() => setActiveView("dashboard")} />
            ) : (
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
                
                <main className="flex-1 overflow-auto bg-muted/5">
                  {activeView === "dashboard" && <DashboardView />}
                  {activeView === "customers" && <CustomersView />}
                  {activeView === "companies" && <CompaniesView />}
                  {activeView === "loyalty" && <LoyaltyView />}
                  {activeView === "marketing" && <MarketingView />}
                  {activeView === "analytics" && <AnalyticsView />}
                  {activeView === "settings" && <SettingsView />}
                  
                  {/* Fallback for other standard views */}
                  {["support", "billing"].includes(activeView) && (
                    <div className="flex-1 flex items-center justify-center p-8 h-[80vh]">
                      <div className="text-center space-y-4">
                        <h3 className="text-2xl font-bold text-muted-foreground font-heading capitalize">Phân hệ {activeView}</h3>
                        <p className="text-muted-foreground/60 max-w-sm mx-auto">Phân hệ doanh nghiệp này đang được phát triển. Để xem trải nghiệm phía khách hàng, vui lòng nhấp vào Cổng Khách hàng.</p>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </>
          )}
        </div>
        <Toaster />
      </div>
      </ThemeProvider>
    </FirebaseProvider>
  );
}

