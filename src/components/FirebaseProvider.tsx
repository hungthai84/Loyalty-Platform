import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithRedirectOnly: () => Promise<void>;
  logout: () => Promise<void>;
  guestLogin: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isGuest = localStorage.getItem("crm_guest_user") === "true";
    if (isGuest) {
      setUser({
        uid: "guest-admin",
        email: "hungthai84@gmail.com",
        displayName: "Khách VIP Admin",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
        isAnonymous: false,
        metadata: {},
        providerData: [],
      } as any);
      setLoading(false);
      return;
    }

    // Handle redirect result
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect sign in failed", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Prioritize popup inside our development/iframe environment
      await signInWithPopup(auth, provider);
      toast.success("Đăng nhập bằng tài khoản Google/Gmail thành công!");
    } catch (error: any) {
      console.warn("Popup sign-in blocked or failed, attempting redirect fallback...", error);
      if (error?.code === 'auth/popup-blocked') {
        toast.info("Trình duyệt đã chặn cửa sổ Popup. Đang chuyển hướng sang trang đăng nhập Google...");
      }
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Sign in with redirect fallback failed", redirectError);
        toast.error("Không thể khởi tạo đăng nhập Google. Hãy kiểm tra cài đặt trình duyệt của bạn.");
      }
    }
  };

  const signInWithRedirectOnly = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Redirect-only login failed", error);
      toast.error("Chuyển hướng đăng nhập thất bại.");
    }
  };

  const guestLogin = async () => {
    try {
      localStorage.setItem("crm_guest_user", "true");
      setUser({
        uid: "guest-admin",
        email: "hungthai84@gmail.com",
        displayName: "Khách VIP Admin",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
        isAnonymous: false,
        metadata: {},
        providerData: [],
      } as any);
      toast.success("Đăng nhập bằng tài khoản Khách thành công với quyền Admin!");
    } catch (error) {
      console.error("Guest login failed", error);
      toast.error("Đăng nhập Khách thất bại.");
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("crm_guest_user");
      await signOut(auth);
      setUser(null);
      toast.success("Đã đăng xuất tài khoản.");
    } catch (error) {
      console.error("Sign out failed", error);
      toast.error("Đăng xuất thất bại.");
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, signInWithRedirectOnly, guestLogin, logout }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
