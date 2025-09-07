// Firebase Runtime Client
// This client loads Firebase configuration at runtime via /api/public-config
// No more NEXT_PUBLIC_FIREBASE_* environment variables needed

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, signOut, type User, browserLocalPersistence, setPersistence, signInWithRedirect } from "firebase/auth";
import { getPublicConfig } from "./public-config.client";

let appInstance: FirebaseApp | null = null;

// Initialize Firebase app with runtime config
async function initializeFirebaseApp(): Promise<FirebaseApp> {
  if (appInstance) return appInstance;

  try {
    const config = await getPublicConfig();
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔧 Firebase runtime config loaded:", {
        projectId: config.firebase.projectId,
        authDomain: config.firebase.authDomain
      });
    }

    const app = initializeApp(config.firebase);
    if (process.env.NODE_ENV !== 'production') {
      console.log("✅ Firebase app initialized successfully with runtime config");
    }
    
    appInstance = app;
    return app;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Firebase initialization failed:", error);
    }
    throw error;
  }
}

// Get Firebase Auth instance
export async function getFirebaseAuth() {
  const app = await initializeFirebaseApp();
  const auth = getAuth(app);
  // Set persistence to local storage for session persistence
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

// Robust Google Sign-In with popup fallback to redirect
export async function signInWithGoogle(opts: { redirectTo?: string } = {}) {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  
  // Add custom parameters for better UX
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔐 Starting Google Sign-In with popup...");
    }
    const result = await signInWithPopup(auth, provider);
    if (process.env.NODE_ENV !== 'production') {
      console.log("✅ Google Sign-In successful:", result.user.email);
    }
    if (opts.redirectTo) location.href = opts.redirectTo;
    return result.user;
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("Popup failed, falling back to redirect:", err);
    }
    // Fallback: some browsers/extensions block popups or COOP interferes
    await signInWithRedirect(auth, provider);
    // After redirect back, handle result:
    try {
      const res = await getRedirectResult(auth);
      if (res?.user && opts.redirectTo) location.href = opts.redirectTo;
      return res?.user ?? null;
    } catch (redirectErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Redirect result failed:", redirectErr);
      }
    }
    return null;
  }
}

// Legacy function for backward compatibility
export async function signInWithGoogleLegacy(options?: { redirectTo?: string }) {
  return signInWithGoogle(options);
}

// Get redirect result
export async function getGoogleSignInRedirectResult() {
  try {
    const auth = await getFirebaseAuth();
    const result = await getRedirectResult(auth);
    if (result) {
      if (process.env.NODE_ENV !== 'production') {
        console.log("✅ Google Sign-In redirect result:", result.user.email);
      }
    }
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Failed to get redirect result:", error);
    }
    throw error;
  }
}

// Sign out
export async function signOutUser() {
  try {
    const auth = await getFirebaseAuth();
    await signOut(auth);
    if (process.env.NODE_ENV !== 'production') {
      console.log("✅ User signed out successfully");
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Sign out failed:", error);
    }
    throw error;
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const auth = await getFirebaseAuth();
    return auth.currentUser;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Failed to get current user:", error);
    }
    return null;
  }
}

// Check if user is authenticated
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Failed to check authentication status:", error);
    }
    return false;
  }
}

// Complete server session by posting ID token to session endpoint
export async function completeServerSession() {
  try {
    const auth = await getFirebaseAuth();
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) return false;
    
    const response = await fetch('/api/auth/session-login', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' }, 
      body: JSON.stringify({ idToken }) 
    });
    
    if (response.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.log("✅ Server session created successfully");
      }
      return true;
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.error("❌ Failed to create server session");
      }
      return false;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Error creating server session:", error);
    }
    return false;
  }
}

export async function logoutEverywhere() {
  try {
    const auth = await getFirebaseAuth();
    // Clear server session cookie first
    await fetch('/api/auth/session-logout', { method: 'POST' });
    // Then sign out from Firebase
    await signOut(auth);
    // Redirect to login
    location.href = '/login';
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("❌ Error during logout:", error);
    }
    // Even if Firebase logout fails, clear server session and redirect
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
    } catch {}
    location.href = '/login';
  }
}
