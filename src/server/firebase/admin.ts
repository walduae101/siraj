// import { env } from "../../env-server";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || "walduae-project-20250809071906",
    });
  } else {
    // Initialize with default credentials (useful on GCP/Firebase hosting)
    app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "walduae-project-20250809071906" });
  }
}

export const adminAuth = getAuth();
export const db = getFirestore();
