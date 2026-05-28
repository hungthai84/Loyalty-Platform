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
  user: any | null;
  systemUser: SystemUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithRedirectOnly: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (displayName?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  signInWithCredentials: (userId: string, password: string) => Promise<boolean>;
  registerWithCredentials: (userId: string, password: string, displayName: string) => Promise<boolean>;
  updateProfileData: (displayName: string, password?: string, linkedLocalUserId?: string) => Promise<boolean>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
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
      
      if (isSuperAdminEmail) {
        // Explicitly sync the local credential table for hungthai84 as requested
        try {
          const localUserRef = doc(db, 'system_users', 'local_hungthai84');
          await setDoc(localUserRef, {
            uid: 'local_hungthai84',
            email: 'hungthai84@gmail.com',
            displayName: "Thái Hồng Hưng",
            photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
            role: "Admin",
            status: "approved",
            password: 'HungTh@i22061984',
            isLocal: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (localErr) {
          console.warn("Could not sync local credential linking: ", localErr);
        }
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
        const localUserStr = localStorage.getItem('crm_sys_local_user');
        if (localUserStr) {
          try {
            const parsed = JSON.parse(localUserStr);
            if (parsed && parsed.user && parsed.systemUser) {
              setUser(parsed.user);
              setSystemUser(parsed.systemUser);
            } else {
              setUser(null);
              setSystemUser(null);
            }
          } catch (e) {
            setUser(null);
            setSystemUser(null);
          }
        } else {
          setUser(null);
          setSystemUser(null);
        }
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
    } else {
      const localUserStr = localStorage.getItem('crm_sys_local_user');
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed && parsed.user && parsed.user.uid) {
            setLoading(true);
            const userDocRef = doc(db, 'system_users', parsed.user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              const refreshedSystemUser = {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
                role: data.role,
                status: data.status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              } as SystemUser;
              
              localStorage.setItem('crm_sys_local_user', JSON.stringify({
                user: parsed.user,
                systemUser: refreshedSystemUser
              }));
              setSystemUser(refreshedSystemUser);
            }
            setLoading(false);
          }
        } catch (e) {
          setLoading(false);
        }
      }
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
      const isSuperAdminEmail = u.email?.toLowerCase() === 'hungthai84@gmail.com';
      
      const systemUserData = {
        uid: u.uid,
        email: u.email,
        displayName: displayName || u.displayName || (isSuperAdminEmail ? "Thái Hồng Hưng" : "Thành viên mới"),
        photoURL: u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        role: (isSuperAdminEmail ? "Admin" : "Support") as "Admin" | "Manager" | "Support",
        status: (isSuperAdminEmail ? "approved" : "pending") as "pending" | "approved" | "rejected",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, systemUserData);
      
      setSystemUser({
        ...systemUserData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      if (isSuperAdminEmail) {
        toast.success("Hệ thống nhận diện Super Admin! Tài khoản của bạn đã được phê duyệt trực tiếp.");
      } else {
        toast.success("Đăng ký thành công! Đang chờ Admin duyệt.");
      }
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
      localStorage.removeItem('crm_sys_local_user');
      toast.success("Đã đăng xuất.");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const signInWithCredentials = async (userId: string, password: string): Promise<boolean> => {
    const userIdClean = userId.trim().toLowerCase();
    if (!userIdClean || !password) {
      toast.error("Vui lòng điền đầy đủ tài khoản và mật khẩu.");
      return false;
    }
    setLoading(true);
    try {
      const isSuperAdmin = userIdClean === 'hungthai84';
      const userDocRef = doc(db, 'system_users', `local_${userIdClean}`);
      
      // Auto seed / link local 'hungthai84' and password 'HungTh@i22061984'
      if (isSuperAdmin && password === 'HungTh@i22061984') {
        const sysOwnerData = {
          uid: 'local_hungthai84',
          email: 'hungthai84@gmail.com',
          displayName: "Thái Hồng Hưng",
          photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
          role: "Admin" as const,
          status: "approved" as const,
          password: 'HungTh@i22061984',
          isLocal: true,
          updatedAt: serverTimestamp()
        };
        await setDoc(userDocRef, sysOwnerData, { merge: true });
      }

      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        toast.error("Tài khoản không tồn tại. Vui lòng đăng ký.");
        setLoading(false);
        return false;
      }
      const data = userDoc.data();
      if (data.password !== password) {
        toast.error("Mật khẩu không chính xác.");
        setLoading(false);
        return false;
      }

      // Successful local authentication!
      
      const mockUserObj = {
        uid: `local_${userIdClean}`,
        email: data.email || (isSuperAdmin ? 'hungthai84@gmail.com' : `${userIdClean}@local.crm`),
        displayName: data.displayName || (isSuperAdmin ? "Thái Hồng Hưng" : userId),
        photoURL: data.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        isLocal: true
      };

      const systemUserObj = {
        uid: `local_${userIdClean}`,
        email: data.email || (isSuperAdmin ? 'hungthai84@gmail.com' : `${userIdClean}@local.crm`),
        displayName: data.displayName || (isSuperAdmin ? "Thái Hồng Hưng" : userId),
        photoURL: data.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        role: isSuperAdmin ? "Admin" : (data.role || "Support"),
        status: isSuperAdmin ? "approved" : (data.status || "pending"),
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt) : new Date()
      } as SystemUser;

      // Persist locally
      localStorage.setItem('crm_sys_local_user', JSON.stringify({
        user: mockUserObj,
        systemUser: systemUserObj
      }));

      setUser(mockUserObj);
      setSystemUser(systemUserObj);
      toast.success("Đăng nhập thành công!");
      setLoading(false);
      return true;
    } catch (e: any) {
      console.error("Credential login failed: ", e);
      toast.error(`Đăng nhập thất bại: ${e.message}`);
      setLoading(false);
      return false;
    }
  };

  const registerWithCredentials = async (userId: string, password: string, displayName: string): Promise<boolean> => {
    const userIdClean = userId.trim().toLowerCase();
    if (!userIdClean || !password || !displayName) {
      toast.error("Vui lòng điền đầy đủ và chính xác tất cả các thông tin.");
      return false;
    }

    // Basic format validator for user id
    if (!/^[a-zA-Z0-9_.-]+$/.test(userIdClean)) {
      toast.error("Tên tài khoản viết liền không dấu, có thể bao gồm chữ số, số, dấu gạch dưới, gạch ngang.");
      return false;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'system_users', `local_${userIdClean}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        toast.error("Tên tài khoản này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.");
        setLoading(false);
        return false;
      }

      const isSuperAdmin = userIdClean === 'hungthai84';
      const emailVal = isSuperAdmin ? 'hungthai84@gmail.com' : `${userIdClean}@local.crm`;

      const systemUserData = {
        uid: `local_${userIdClean}`,
        email: emailVal,
        displayName: displayName,
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        role: (isSuperAdmin ? "Admin" : "Support") as "Admin" | "Manager" | "Support",
        status: (isSuperAdmin ? "approved" : "pending") as "pending" | "approved" | "rejected",
        password: password,
        isLocal: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userDocRef, systemUserData);

      const mockUserObj = {
        uid: `local_${userIdClean}`,
        email: emailVal,
        displayName: displayName,
        photoURL: systemUserData.photoURL,
        isLocal: true
      };

      const systemUserObj = {
        uid: `local_${userIdClean}`,
        email: emailVal,
        displayName: displayName,
        photoURL: systemUserData.photoURL,
        role: systemUserData.role,
        status: systemUserData.status,
        createdAt: new Date(),
        updatedAt: new Date()
      } as SystemUser;

      // Automatically sign them in
      localStorage.setItem('crm_sys_local_user', JSON.stringify({
        user: mockUserObj,
        systemUser: systemUserObj
      }));

      setUser(mockUserObj);
      setSystemUser(systemUserObj);

      if (isSuperAdmin) {
        toast.success("Hệ thống nhận diện Super Admin của Thái Hồng Hưng! Tài khoản đã trực tiếp kích hoạt.");
      } else {
        toast.success("Đăng ký tài khoản thành công! Tài khoản đang chờ Admin duyệt trạng thái hoạt động.");
      }

      setLoading(false);
      return true;
    } catch (e: any) {
      console.error("Register credentials write failed: ", e);
      toast.error(`Không thể thực hiện đăng ký: ${e.message}`);
      setLoading(false);
      return false;
    }
  };

  const updateProfileData = async (displayName: string, password?: string, linkedLocalUserId?: string): Promise<boolean> => {
    if (!displayName.trim()) {
      toast.error("Vui lòng điền tên hiển thị.");
      return false;
    }
    
    setLoading(true);
    try {
      const isLocal = !!user?.isLocal;
      const uid = user?.uid;
      
      if (!uid) {
        toast.error("Không xác định được phiên đăng nhập.");
        setLoading(false);
        return false;
      }
      
      if (isLocal) {
        // Local user flow
        const userDocRef = doc(db, 'system_users', uid);
        const updates: any = {
          displayName: displayName,
          updatedAt: serverTimestamp()
        };
        if (password) {
          updates.password = password;
        }
        
        await setDoc(userDocRef, updates, { merge: true });
        
        // Refresh local cache & states
        const newUserObj = {
          ...user,
          displayName: displayName
        };
        const newSystemUserObj = systemUser ? {
          ...systemUser,
          displayName: displayName,
          updatedAt: new Date()
        } : null;
        
        localStorage.setItem('crm_sys_local_user', JSON.stringify({
          user: newUserObj,
          systemUser: newSystemUserObj
        }));
        
        setUser(newUserObj);
        setSystemUser(newSystemUserObj);
        toast.success("Cập nhật thông tin tài khoản thành công!");
      } else {
        // Google auth user flow
        const userDocRef = doc(db, 'system_users', uid);
        const updates: any = {
          displayName: displayName,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, updates, { merge: true });
        
        // Update user state and cache
        const newUserObj = {
          ...user,
          displayName: displayName
        };
        const newSystemUserObj = systemUser ? {
          ...systemUser,
          displayName: displayName,
          updatedAt: new Date()
        } : null;
        
        localStorage.setItem(`crm_sys_user_${uid}`, JSON.stringify(newSystemUserObj));
        setUser(newUserObj);
        setSystemUser(newSystemUserObj);
        
        // If linkedLocalUserId is supplied, register/update the local credential record so they map together!
        if (linkedLocalUserId && linkedLocalUserId.trim()) {
          const userIdClean = linkedLocalUserId.trim().toLowerCase();
          
          if (!/^[a-zA-Z0-9_.-]+$/.test(userIdClean)) {
            toast.error("Tên tài khoản viết liền không dấu, có thể bao gồm chữ số, số, dấu gạch dưới, gạch ngang.");
            setLoading(false);
            return false;
          }
          
          if (!password) {
            toast.error("Vui lòng nhập mật khẩu khi thiết lập liên kết User ID.");
            setLoading(false);
            return false;
          }
          
          const localUserRef = doc(db, 'system_users', `local_${userIdClean}`);
          const checkDoc = await getDoc(localUserRef);
          
          if (checkDoc.exists() && checkDoc.data()?.email && checkDoc.data()?.email.toLowerCase() !== user.email?.toLowerCase()) {
            toast.error("Tên tài khoản này đã được sử dụng bởi một email khác.");
            setLoading(false);
            return false;
          }
          
          await setDoc(localUserRef, {
            uid: `local_${userIdClean}`,
            email: user.email,
            displayName: displayName,
            photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
            role: systemUser?.role || "Support",
            status: systemUser?.status || "approved",
            password: password,
            isLocal: true,
            createdAt: checkDoc.exists() ? (checkDoc.data()?.createdAt || serverTimestamp()) : serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          toast.success(`Đã liên kết thành công với tài khoản nội bộ User ID: ${userIdClean}`);
        } else {
          toast.success("Cập nhật thông tin tài khoản thành công!");
        }
      }
      
      setLoading(false);
      return true;
    } catch (e: any) {
      console.error("Update profile failed: ", e);
      toast.error(`Cập nhật thất bại: ${e.message}`);
      setLoading(false);
      return false;
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, systemUser, loading, signIn, signInWithRedirectOnly, logout, registerUser, refreshStatus, signInWithCredentials, registerWithCredentials, updateProfileData }}>
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
