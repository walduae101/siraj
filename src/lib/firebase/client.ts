import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

// Firebase config - we'll use a hybrid approach
// Use runtime config if available, otherwise fall back to our config
let runtimeConfig: any = null;

// Build-time config from our config file (fallback)
const envConfig = firebaseConfig;

// Allow setting runtime config (will be called by FirebaseProvider)
export function setFirebaseConfig(config: any) {
  console.log("[Firebase] setFirebaseConfig called with:", { 
    apiKey: config.apiKey?.substring(0, 10) + "...", 
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId 
  });
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
    if (apps.length > 0 && apps[0]) {
      console.log("[Firebase] Using existing app:", apps[0].name);
      app = apps[0];
    } else {
      // Use runtime config if available, otherwise env config
      const cfg = runtimeConfig || envConfig;
      console.log("[Firebase] Initializing with config:", { 
        apiKey: cfg.apiKey?.substring(0, 10) + "...", 
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        appId: cfg.appId 
      });
      try {
        app = initializeApp(cfg);
        console.log("[Firebase] Successfully initialized app:", app.name);
      } catch (error) {
        console.error("[Firebase] Error initializing app:", error);
        // If initialization fails, try to get the default app
        const defaultApps = getApps();
        if (defaultApps.length > 0 && defaultApps[0]) {
          app = defaultApps[0];
          console.log("[Firebase] Using default app after error:", app.name);
        } else {
          throw error;
        }
      }
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
