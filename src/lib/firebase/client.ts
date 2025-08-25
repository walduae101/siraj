import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";
import { env } from "~/env";

// Use environment variables for Firebase configuration
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "207501673877",
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:207501673877:web:8c8265c153623cf14ae29c",
};

let app: FirebaseApp | undefined;
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app!;
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
