// client-only Firebase init
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebase/config";

const cfg = firebaseConfig;

let app: FirebaseApp | undefined;
export function getFirebaseApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(cfg);
  return app;
}

let auth: Auth | undefined;
export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}
