import React, { createContext, useContext, useState } from 'react';

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
  isApproved: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithRedirectOnly: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  signInWithCredentials: (userId: string, password: string) => Promise<boolean>;
  registerWithCredentials: (userId: string, password: string, displayName: string) => Promise<boolean>;
  updateProfileData: (displayName: string, password?: string, linkedLocalUserId?: string) => Promise<boolean>;
  hasPermission: (permissionId: string) => boolean;
  rolePermissions: any[];
  updateRolePermissions: (newPerms: any[]) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<any>({
    uid: 'guest',
    email: 'guest@localhost.internal',
    displayName: "Guest",
    photoURL: ""
  });

  const [systemUser] = useState<SystemUser>({
    uid: 'guest',
    email: 'guest@localhost.internal',
    displayName: "Guest",
    photoURL: "",
    role: "Admin",
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [loading] = useState(false);
  const [rolePermissions] = useState<any[]>([]);

  const signIn = async () => {};
  const signInWithRedirectOnly = async () => {};
  const registerUser = async () => {};
  const logout = async () => {};
  const refreshStatus = async () => {};
  const signInWithCredentials = async () => true;
  const registerWithCredentials = async () => true;
  const updateProfileData = async () => true;
  const hasPermission = () => true;
  const updateRolePermissions = async () => {};

  return (
    <FirebaseContext.Provider value={{
      user,
      systemUser,
      isApproved: true,
      loading,
      signIn,
      signInWithRedirectOnly,
      logout,
      registerUser,
      refreshStatus,
      signInWithCredentials,
      registerWithCredentials,
      updateProfileData,
      hasPermission,
      rolePermissions,
      updateRolePermissions
    }}>
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
