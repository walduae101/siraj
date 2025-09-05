import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, signOut, type User } from "firebase/auth";
import { getPublicConfig } from "./public-config.client";

let appInstance: FirebaseApp | null = null;

// Initialize Firebase app
async function initializeFirebaseApp(): Promise<FirebaseApp> {
  if (appInstance) return appInstance;

  try {
    const config = await getPublicConfig();
    console.log("🔧 Firebase config loaded:", {
      projectId: config.firebase.projectId,
      authDomain: config.firebase.authDomain
    });
    console.log("🔧 Full Firebase config object:", config.firebase);
    console.log("🔧 Config source:", config.firebase.authDomain);

    const app = initializeApp(config.firebase);
    console.log("✅ Firebase app initialized successfully");
    
    appInstance = app;
    return app;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    throw error;
  }
}

// Get Firebase Auth instance
export async function getFirebaseAuth() {
  const app = await initializeFirebaseApp();
  return getAuth(app);
}

// Google Sign-In with popup
export async function signInWithGoogle() {
  try {
    const auth = await getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("🔐 Starting Google Sign-In...");
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Google Sign-In successful:", result.user.email);
    return result;
  } catch (error) {
    console.error("❌ Google Sign-In failed:", error);
    throw error;
  }
}

// Get redirect result
export async function getGoogleSignInRedirectResult() {
  try {
    const auth = await getFirebaseAuth();
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("✅ Google Sign-In redirect result:", result.user.email);
    }
    return result;
  } catch (error) {
    console.error("❌ Failed to get redirect result:", error);
    throw error;
  }
}

// Sign out
export async function signOutUser() {
  try {
    const auth = await getFirebaseAuth();
    await signOut(auth);
    console.log("✅ User signed out successfully");
  } catch (error) {
    console.error("❌ Sign out failed:", error);
    throw error;
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const auth = await getFirebaseAuth();
    return auth.currentUser;
  } catch (error) {
    console.error("❌ Failed to get current user:", error);
    return null;
  }
}

// Check if user is authenticated
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error("❌ Failed to check authentication status:", error);
    return false;
  }
}
