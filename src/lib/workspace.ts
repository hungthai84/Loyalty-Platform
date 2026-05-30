import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const downloadDriveFile = async (fileId: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to download file");
  return await res.text();
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const fetchGoogleContacts = async (): Promise<GoogleContact[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=150`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Failed to fetch connections", errorBody);
    throw new Error("Failed to fetch Google Contacts. Please ensure you have authorized the contacts permission.");
  }
  const data = await res.json();
  if (!data.connections) return [];

  return data.connections.map((conn: any) => {
    const nameObj = conn.names?.[0];
    const emailObj = conn.emailAddresses?.[0];
    const phoneObj = conn.phoneNumbers?.[0];
    const photoObj = conn.photos?.[0];

    return {
      resourceName: conn.resourceName,
      name: nameObj?.displayName || nameObj?.givenName || "Không tên",
      email: emailObj?.value || "",
      phone: phoneObj?.value || "",
      photoUrl: photoObj?.url || ""
    };
  });
};
