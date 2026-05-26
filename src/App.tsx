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
import { FirebaseProvider, useFirebase } from "@/components/FirebaseProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ShieldAlert, LogIn, LogOut, Lock, Trophy, Sparkles } from "lucide-react";

function AppContent() {
  const [activeView, setActiveView] = useState("dashboard");
  const { user, loading, signIn, logout } = useFirebase();

  // 1. Loading State
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background/50 relative">
        <div className="uiverse-container" />
        <div className="relative text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-md" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse font-mono">Đang xác thực hệ thống CRM...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="uiverse-container" />
        <div className="relative bg-card/60 backdrop-blur-2xl border border-border w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/5 border border-primary/20">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest uppercase rounded-full leading-none">
              <Sparkles className="w-3.5 h-3.5" /> CRM & LOYALTY PLATFORM
            </span>
            <h2 className="text-2xl font-black tracking-tight font-heading text-foreground pt-1">Hệ Thống Phân Khúc & Ưu Đãi VIP</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
              Giải pháp tích điểm, phân loại & gán nhãn tự động dành riêng cho tập đoàn. Đăng nhập để sử dụng tiếp.
            </p>
          </div>

          <button 
            onClick={signIn}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-primary/25 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Đăng nhập bằng Google Account
          </button>
          
          <div className="pt-2 text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Đường truyền kết nối hoàn toàn SSL mã hóa bảo mật
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Email Rule check (Only hungthai84@gmail.com is granted highest access)
  const isAuthorizedAdmin = user.email?.toLowerCase() === "hungthai84@gmail.com";

  if (!isAuthorizedAdmin) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="uiverse-container" />
        <div className="relative bg-card/80 backdrop-blur-3xl border border-rose-500/20 w-full max-w-md rounded-3xl p-8 shadow-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex px-3 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider rounded-md">
              Hạn Chế Truy Cập
            </span>
            <h3 className="text-xl font-extrabold tracking-tight font-heading text-rose-500">Quyền Hạn Cao Nhất Bị Từ Chối</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Xin lỗi! Hệ thống CRM & quản trị VIP này có cấu hình phân quyền bảo mật nghiêm ngặt. Chỉ người sở hữu tài khoản được ủy quyền độc quyền dưới đây mới có thể tiếp tục:
            </p>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs text-foreground font-mono font-bold select-all inline-block">
              hungthai84@gmail.com
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Bạn đang đăng nhập với tài khoản: <span className="font-semibold text-rose-500">{user.email || "Không rõ email"}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={logout}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất & Đổi tài khoản khác
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-[10px] text-muted-foreground/60 hover:text-foreground font-semibold transition-all"
            >
              Nhấp để tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Content for hungthai84@gmail.com
  return (
    <div className="h-full w-full flex bg-white/45 dark:bg-[#080808]/40 backdrop-blur-3xl rounded-[16px] overflow-hidden shadow-2xl shadow-black/15 border border-white/40 dark:border-white/5 relative selection:bg-primary/20">
      <Sidebar 
        className="hidden md:flex shrink-0" 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
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
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="h-screen w-screen p-[10px] overflow-hidden relative theme-transition">
          {/* Gorgeous Uiverse.io Soft Pastel Rotating Glow Background */}
          <div className="uiverse-container" />
          <AppContent />
        </div>
        <Toaster />
      </ThemeProvider>
    </FirebaseProvider>
  );
}


