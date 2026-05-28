import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardView } from "@/views/DashboardView";
import { CustomersView } from "@/views/CustomersView";
import { LoyaltyView } from "@/views/LoyaltyView";
import { MarketingView } from "@/views/MarketingView";
import { CompaniesView } from "@/views/CompaniesView";
import { SettingsView } from "@/views/SettingsView";
import { CustomerPortalView } from "@/views/CustomerPortalView";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsView } from "./views/AnalyticsView";
import { AnalysisView } from "./views/AnalysisView";
import { FirebaseProvider, useFirebase } from "@/components/FirebaseProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ShieldAlert, LogIn, LogOut, Lock, Trophy, Sparkles, UserCheck } from "lucide-react";

function AppContent() {
  const [activeView, setActiveView] = useState("dashboard");
  const { user, systemUser, loading, signIn, logout, registerUser, refreshStatus, signInWithCredentials, registerWithCredentials } = useFirebase();
  const [regName, setRegName] = useState("");
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');

  // Credentials input states
  const [idInput, setIdInput] = useState("");
  const [pwdInput, setPwdInput] = useState("");
  const [regIdInput, setRegIdInput] = useState("");
  const [regPwdInput, setRegPwdInput] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithCredentials(idInput, pwdInput);
  };

  const handleCredentialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerWithCredentials(regIdInput, regPwdInput, regDisplayName);
  };

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
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: '"Roboto", sans-serif' }}>
        <div className="uiverse-container" />
        <div className="relative bg-card/60 backdrop-blur-2xl border border-border w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-2xl shadow-blue-500/10 hover:scale-105 transition-transform duration-300">
            <BrandLogo className="w-full h-full" />
          </div>

          {/* Interactive Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/80 rounded-xl border border-border/40 text-xs font-bold">
            <button
              onClick={() => setLoginMode('login')}
              className={`py-2 rounded-lg transition-all ${
                loginMode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm font-extrabold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setLoginMode('register')}
              className={`py-2 rounded-lg transition-all ${
                loginMode === 'register'
                  ? 'bg-primary text-primary-foreground shadow-sm font-extrabold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Đăng Ký
            </button>
          </div>
          
          {loginMode === 'login' ? (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest uppercase rounded-full leading-none">
                  <Sparkles className="w-3.5 h-3.5" /> SYSTEM ACCESS
                </span>
                <h2 className="text-xl font-black tracking-tight font-heading text-foreground pt-1">Hệ thống quản lý khách hàng thân thiết</h2>
                <p className="text-muted-foreground text-[11px] leading-relaxed max-w-sm mx-auto">
                  Đăng nhập bằng tài khoản nội bộ (User ID) hoặc email Google.
                </p>
              </div>

              {/* Credential login form */}
              <form onSubmit={handleCredentialLogin} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản (User ID)</label>
                  <input
                    type="text"
                    required
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    placeholder="Nhập User ID (ví dụ: hungthai84, nhanvien...)"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu</label>
                  <input
                    type="password"
                    required
                    value={pwdInput}
                    onChange={(e) => setPwdInput(e.target.value)}
                    placeholder="Mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#2f6cf5] hover:bg-[#1e52db] text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-500/10 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" /> Đăng nhập hệ thống
                </button>
              </form>

              {/* Separator */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-3 text-muted-foreground/60 text-[9px] font-black uppercase tracking-wider">Hoặc đăng nhập bằng</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={signIn}
                  className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-lg cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.2 -0.16,-1.79z" fill="#4285F4" />
                    <path d="M12,20.6c2.4,0 4.41,-0.8 5.88,-2.16l-3.3,-2.57c-0.91,0.61 -2.08,0.98 -3.29,0.98 -2.31,0 -4.26,-1.56 -4.96,-3.66H2.9V15.7c1.47,2.93 4.51,4.9 8.04,4.9z" fill="#34A853" />
                    <path d="M7.04,13.15c-0.18,-0.53 -0.28,-1.1 -0.28,-1.68s0.1,-1.14 0.28,-1.68V7.22H2.9C2.29,8.44 1.95,9.83 1.95,11.3s0.34,2.86 0.95,4.08l4.14,-3.23z" fill="#FBBC05" />
                    <path d="M12,5.2c1.3,0 2.48,0.45 3.4,1.32l2.55,-2.55C16.4,2.54 14.41,1.7 12,1.7c-3.53,0 -6.57,1.97 -8.04,4.9l4.14,3.23c0.7,-2.11 2.65,-3.66 4.96,-3.66z" fill="#EA4335" />
                  </svg>
                  Tài khoản Gmail (Google)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black tracking-widest uppercase rounded-full leading-none">
                  <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> CUSTOM ACCOUNT WAITLIST
                </span>
                <h2 className="text-xl font-black tracking-tight font-heading text-foreground pt-1">Đăng Ký Thành Viên Mới</h2>
                <p className="text-muted-foreground text-[11px] leading-relaxed max-w-sm mx-auto">
                  Tạo tài khoản và mật khẩu của riêng bạn hoặc kết nối trực tiếp qua Google Auth.
                </p>
              </div>

              {/* Credential registration form */}
              <form onSubmit={handleCredentialRegister} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản (User ID)</label>
                  <input
                    type="text"
                    required
                    value={regIdInput}
                    onChange={(e) => setRegIdInput(e.target.value)}
                    placeholder="Viết liền không dấu (vd: hungthai84, oanhcrm...)"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu bảo mật</label>
                  <input
                    type="password"
                    required
                    value={regPwdInput}
                    onChange={(e) => setRegPwdInput(e.target.value)}
                    placeholder="Mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Họ và tên hiển thị</label>
                  <input
                    type="text"
                    required
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Ví dụ: Thái Hồng Hưng"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/10 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  Gửi yêu cầu đăng ký tài khoản
                </button>
              </form>

              {/* Separator */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-3 text-muted-foreground/60 text-[9px] font-black uppercase tracking-wider">Hoặc đăng ký nhanh</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={signIn}
                  className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-lg cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.05,-1.2 -0.16,-1.79z" fill="#4285F4" />
                    <path d="M12,20.6c2.4,0 4.41,-0.8 5.88,-2.16l-3.3,-2.57c-0.91,0.61 -2.08,0.98 -3.29,0.98 -2.31,0 -4.26,-1.56 -4.96,-3.66H2.9V15.7c1.47,2.93 4.51,4.9 8.04,4.9z" fill="#34A853" />
                    <path d="M7.04,13.15c-0.18,-0.53 -0.28,-1.1 -0.28,-1.68s0.1,-1.14 0.28,-1.68V7.22H2.9C2.29,8.44 1.95,9.83 1.95,11.3s0.34,2.86 0.95,4.08l4.14,-3.23z" fill="#FBBC05" />
                    <path d="M12,5.2c1.3,0 2.48,0.45 3.4,1.32l2.55,-2.55C16.4,2.54 14.41,1.7 12,1.7c-3.53,0 -6.57,1.97 -8.04,4.9l4.14,3.23c0.7,-2.11 2.65,-3.66 4.96,-3.66z" fill="#EA4335" />
                  </svg>
                  Kết nối trực tiếp nhanh bằng Gmail
                </button>
              </div>
            </div>
          )}
          
          <div className="pt-1 text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Đường truyền kết nối hoàn toàn SSL mã hóa bảo mật
          </div>
        </div>
      </div>
    );
  }

  // 3. Unregistered waitlist status checking
  if (!systemUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in" style={{ fontFamily: '"Roboto", sans-serif' }}>
        <div className="uiverse-container" />
        <div className="relative bg-card/80 backdrop-blur-3xl border border-primary/20 w-full max-w-md rounded-3xl p-8 shadow-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/10 border border-primary/20">
            <UserCheck className="w-10 h-10 text-primary animate-pulse" />
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex px-3 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider rounded-md">
              Đăng ký thành viên
            </span>
            <h3 className="text-xl font-extrabold tracking-tight font-heading text-primary">Yêu Cầu Truy Cập Phê Duyệt</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Bạn đã xác thực Google thành công! Tuy nhiên, tài khoản Gmail của bạn chưa có quyền sử dụng hệ thống CRM này. Vui lòng đăng ký và chờ Admin cấp quyền.
            </p>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs text-foreground font-mono font-bold select-all inline-block w-full">
              {user.email}
            </div>

            <div className="space-y-2 text-left pt-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Họ và tên hiển thị</label>
              <input
                type="text"
                value={regName || user.displayName || ""}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => registerUser(regName || user.displayName || "")}
              className="w-full py-3 bg-primary text-primary-foreground hover:scale-[1.01] rounded-xl text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/15"
            >
              Gửi yêu cầu đăng ký chờ duyệt
            </button>
            <button 
              onClick={logout}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất & Đổi tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pending Approval state
  if (systemUser.status === 'pending') {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in" style={{ fontFamily: '"Roboto", sans-serif' }}>
        <div className="uiverse-container" />
        <div className="relative bg-card/80 backdrop-blur-3xl border border-amber-500/20 w-full max-w-md rounded-3xl p-8 shadow-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex px-3 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider rounded-md">
              Đang Chờ Phê Duyệt
            </span>
            <h3 className="text-xl font-extrabold tracking-tight font-heading text-amber-500">Đăng Ký Thành Công!</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Yêu cầu của bạn đã được chuyển tới Quản trị viên hệ thống. Sau khi quản trị viên phê duyệt trạng thái & phân vai trò quyền hạn, bạn mới có thể đăng nhập.
            </p>
            <p className="text-xs text-foreground font-semibold">
              Tài khoản: <span className="text-primary">{systemUser.email}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button 
              onClick={refreshStatus}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold hover:scale-[1.01] transition-transform shadow-md duration-300 cursor-pointer"
            >
              Kiểm tra trạng thái duyệt
            </button>
            <button 
              onClick={logout}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất tài khoản này
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Rejected state
  if (systemUser.status === 'rejected') {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden animate-fade-in" style={{ fontFamily: '"Roboto", sans-serif' }}>
        <div className="uiverse-container" />
        <div className="relative bg-card/80 backdrop-blur-3xl border border-rose-500/20 w-full max-w-md rounded-3xl p-8 shadow-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-2.5">
            <span className="inline-flex px-3 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider rounded-md">
              Hạn Chế Truy Cập
            </span>
            <h3 className="text-xl font-extrabold tracking-tight font-heading text-rose-500">Yêu Cầu Bị Từ Chối</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Yêu cầu truy cập CRM này của bạn đã bị từ chối bởi Admin. Vui lòng liên hệ với ban điều hành công ty để biết thêm chi tiết.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={logout}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất & Đổi tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Approved State - Authorized Content and Access
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
          {activeView === "portal" && <CustomerPortalView />}
          
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


