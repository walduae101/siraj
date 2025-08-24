import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";

// Firebase config - we'll use a hybrid approach
// Use runtime config if available, otherwise fall back to env vars
let runtimeConfig: any = null;

// Build-time config from env vars (fallback)
const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Allow setting runtime config (will be called by FirebaseProvider)
export function setFirebaseConfig(config: any) {
  runtimeConfig = config;
  // If Firebase is already initialized with env config, we need to reinitialize
  if (app && !getApps().length) {
    app = undefined;
    _auth = undefined;
    _firestore = undefined;
  }
}

let app: FirebaseApp | undefined;
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      // Use runtime config if available, otherwise env config
      const cfg = runtimeConfig || envConfig;
      app = initializeApp(cfg);
    }
  }
  return app as FirebaseApp;
}

let _auth: Auth | undefined;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

let _firestore: Firestore | undefined;
export function getFirestore(): Firestore {
  if (!_firestore) _firestore = getFirestoreSDK(getFirebaseApp());
  return _firestore;
}
