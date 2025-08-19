import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

// Build-time injected public config:
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

let app: FirebaseApp | undefined;
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const apps = getApps();
    app = apps.length > 0 ? apps[0]! : initializeApp(cfg);
  }
  return app!;
}

let _auth: Auth | undefined;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}
