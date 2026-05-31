import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Admin SDK for backend-side token verification
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
