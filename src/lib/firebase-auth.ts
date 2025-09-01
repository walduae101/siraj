import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, signOut, type User } from "firebase/auth";
import { getPublicConfig } from "./public-config.client";

let appP: Promise<FirebaseApp> | null = null;

async function ensureApp(): Promise<FirebaseApp> {
  if (getApps().length) return getApps()[0]!;
  if (!appP) {
    appP = (async () => {
      const { firebase } = await getPublicConfig();
      const app = initializeApp({
        apiKey: firebase.apiKey,
        authDomain: firebase.authDomain,
        projectId: firebase.projectId,
        appId: firebase.appId,
        storageBucket: firebase.storageBucket,
        messagingSenderId: firebase.messagingSenderId,
      });
      return app;
    })();
  }
  return appP;
}

export async function getFirebaseAuth() {
  const app = await ensureApp();
  const auth = getAuth(app);
  auth.useDeviceLanguage();
  return auth;
}

export async function signInWithGoogle(): Promise<void> {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  
  // Set custom redirect URL for local development
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    provider.setCustomParameters({
      redirect_uri: 'http://localhost:3000/login'
    });
  }
  
  await signInWithRedirect(auth, provider);
}

export async function handleRedirectResult(): Promise<User | null> {
  const auth = await getFirebaseAuth();
  const result = await getRedirectResult(auth);
  return result?.user || null;
}

export async function signOutAll() {
  const auth = await getFirebaseAuth();
  await signOut(auth);
}
