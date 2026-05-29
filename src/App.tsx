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
 const { user: firebaseUser, systemUser: firebaseSystemUser, loading: firebaseLoading, signIn, logout, registerUser, refreshStatus, signInWithCredentials, registerWithCredentials } = useFirebase();

 // Bỏ tính năng login tạm thời: tự động giả lập tài khoản đã đăng nhập
 const user = firebaseUser || {
 uid: "local_hungthai84",
 email: "hungthai84@gmail.com",
 displayName: "Thái Hồng Hưng",
 photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
 isLocal: true,
 };

 const systemUser = {
 ...(firebaseSystemUser || {
 uid: "local_hungthai84",
 email: "hungthai84@gmail.com",
 displayName: "Thái Hồng Hưng",
 photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
 createdAt: new Date(),
 updatedAt: new Date(),
 }),
 role: (firebaseSystemUser?.role || "Admin") as any,
 status: "approved" as const, // luôn luôn được phê duyệt
 };

 const loading = false; // Bỏ qua trạng thái chờ quay tròn xoay loading ban đầu
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

 // Render directly, no authentication needed
 return (
 <div className="h-full w-full flex bg-white/45 dark:bg-[#080808]/40 backdrop-blur-3xl rounded-[16px] overflow-hidden shadow-2xl shadow-black/15 border border-white/40 dark:border-white/5 relative selection:bg-primary/20">
 <Sidebar 
 className="hidden md:flex shrink-0" 
 activeView={activeView} 
 setActiveView={setActiveView} 
 />
 
 <div className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300">
 <Topbar setActiveView={setActiveView} />
 
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


