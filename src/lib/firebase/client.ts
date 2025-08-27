import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null; // never init on server
  if (app) return app;

  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Minimal required fields
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_* envs in client bundle');
    return null;
  }

  try {
    app = getApps().length ? getApps()[0] : initializeApp(cfg);
    return app;
  } catch (e) {
    console.error("[firebase] init failed:", e);
    return null;
  }
}

let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

let _firestore: Firestore | null = null;
export function getFirestore(): Firestore | null {
  if (_firestore) return _firestore;
  const app = getFirebaseApp();
  if (!app) return null;
  _firestore = getFirestoreSDK(app);
  return _firestore;
}
