import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  getFirestore as getFirestoreSDK,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

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
  return app;
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
