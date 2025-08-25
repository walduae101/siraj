import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";
import { env } from "~/env";

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;

  const cfg = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: `${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: "207501673877",
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:207501673877:web:8c8265c153623cf14ae29c",
  };

  // Minimal required fields
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    // Don't throw — log and let UI render without auth features
    console.error("[firebase] Missing/invalid public config. Check NEXT_PUBLIC_FIREBASE_* at build time.");
    return null;
  }

  try {
    app = getApps()[0] ?? initializeApp(cfg);
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
