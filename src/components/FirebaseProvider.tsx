import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface SystemUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "Admin" | "Manager" | "Support";
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  updatedAt: any;
}

interface FirebaseContextType {
  user: User | null;
  systemUser: SystemUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithRedirectOnly: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (displayName?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [systemUser, setSystemUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSystemUserStatus = async (authUser: User) => {
    try {
      const isSuperAdminEmail = authUser.email?.toLowerCase() === 'hungthai84@gmail.com';

      // 1. Check local storage cache as immediate fallback/optimistic response
      const cachedString = localStorage.getItem(`crm_sys_user_${authUser.uid}`);
      let cachedUser: SystemUser | null = null;
      if (cachedString) {
        try {
          cachedUser = JSON.parse(cachedString);
          if (cachedUser) {
            if (isSuperAdminEmail) {
              cachedUser.role = "Admin";
              cachedUser.status = "approved";
            }
            setSystemUser(cachedUser);
          }
        } catch (e) {
          console.warn("Invalid cached user JSON", e);
        }
      }

      // If they are deep-linked super-admin and we have no cache yet, we can set temporary local info straight away
      if (isSuperAdminEmail && !cachedUser) {
        const adminData: SystemUser = {
          uid: authUser.uid,
          email: authUser.email || 'hungthai84@gmail.com',
          displayName: authUser.displayName || "Thái Hồng Hưng",
          photoURL: authUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
          role: "Admin",
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSystemUser(adminData);
      }

      const userDocRef = doc(db, 'system_users', authUser.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (dbError: any) {
        console.warn("Firestore lookup failed (could be offline):", dbError.message || dbError);
        
        // If they are super admin or we already loaded from cache, we are good and can exit gracefully
        if (isSuperAdminEmail || cachedUser) {
          return;
        }
        // Otherwise rethrow to be handled in main catch
        throw dbError;
      }
      
      if (!userDoc.exists()) {
        if (isSuperAdminEmail) {
          // Auto approve primary system owner
          const adminData: SystemUser = {
            uid: authUser.uid,
            email: authUser.email || 'hungthai84@gmail.com',
            displayName: authUser.displayName || "Thái Hồng Hưng",
            photoURL: authUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
            role: "Admin",
            status: "approved",
            createdAt: new Date(),
            updatedAt: new Date()
          };
          try {
            await setDoc(userDocRef, {
              ...adminData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (writeError) {
            console.warn("Could not write initial super admin doc to Firestore, but continuing locally:", writeError);
          }
          localStorage.setItem(`crm_sys_user_${authUser.uid}`, JSON.stringify(adminData));
          setSystemUser(adminData);
        } else {
          setSystemUser(null);
          localStorage.removeItem(`crm_sys_user_${authUser.uid}`);
        }
      } else {
        const data = userDoc.data();
        const baseUser = {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as SystemUser;

        // Force Admin and approved status if the email matches hungthai84@gmail.com
        if (isSuperAdminEmail) {
          baseUser.role = "Admin";
          baseUser.status = "approved";
        }
        
        localStorage.setItem(`crm_sys_user_${authUser.uid}`, JSON.stringify(baseUser));
        setSystemUser(baseUser);
      }
    } catch (error: any) {
      console.error("Error loading system user details", error);
      
      // Secondary fallback on complete fail
      const isSuperAdminEmail = authUser.email?.toLowerCase() === 'hungthai84@gmail.com';
      const cachedString = localStorage.getItem(`crm_sys_user_${authUser.uid}`);
      
      if (cachedString) {
        try {
          const cachedUser = JSON.parse(cachedString);
          if (isSuperAdminEmail) {
            cachedUser.role = "Admin";
            cachedUser.status = "approved";
          }
          setSystemUser(cachedUser);
          return;
        } catch (e) {}
      }

      if (isSuperAdminEmail) {
        const adminData: SystemUser = {
          uid: authUser.uid,
          email: authUser.email || 'hungthai84@gmail.com',
          displayName: authUser.displayName || "Thái Hồng Hưng",
          photoURL: authUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
          role: "Admin",
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSystemUser(adminData);
      } else {
        setSystemUser(null);
        toast.error("Hệ thống đang offline hoặc kết nối Firestore bị gián đoạn. Không tải được quyền hạn tài khoản.");
      }
    }
  };

  useEffect(() => {
    // Check redirect result on load
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect sign in failed", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await checkSystemUserStatus(authUser);
      } else {
        setUser(null);
        setSystemUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshStatus = async () => {
    if (auth.currentUser) {
      setLoading(true);
      await checkSystemUserStatus(auth.currentUser);
      setLoading(false);
    }
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      toast.success("Xác thực Google thành công!");
    } catch (error: any) {
      console.warn("Popup sign-in failed, trying redirect fallback...", error);
      if (error?.code === 'auth/popup-blocked') {
        toast.info("Cửa sổ Popup bị chặn. Đang tự chuyển tiếp sang Google login...");
      }
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Sign in with redirect fallback failed", redirectError);
        toast.error("Không thể khởi tạo đăng nhập Google.");
      }
    }
  };

  const signInWithRedirectOnly = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Redirect login failed", error);
    }
  };

  const registerUser = async (displayName?: string) => {
    if (!auth.currentUser) {
      toast.error("Không tìm thấy thông tin từ Google Auth.");
      return;
    }
    setLoading(true);
    try {
      const u = auth.currentUser;
      const userDocRef = doc(db, 'system_users', u.uid);
      const systemUserData = {
        uid: u.uid,
        email: u.email,
        displayName: displayName || u.displayName || "Thành viên mới",
        photoURL: u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        role: "Support",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, systemUserData);
      
      setSystemUser({
        ...systemUserData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      toast.success("Đăng ký thành công! Đang chờ Admin duyệt.");
    } catch (e: any) {
      console.error("Registration write failed: ", e);
      toast.error(`Không thể thực hiện đăng ký: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSystemUser(null);
      toast.success("Đã đăng xuất.");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, systemUser, loading, signIn, signInWithRedirectOnly, logout, registerUser, refreshStatus }}>
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
