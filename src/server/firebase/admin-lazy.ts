import { getConfig } from "../config";

let cachedApp: import("firebase-admin/app").App | null = null;

export async function getAdminApp() {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApps()[0]!;
    } else {
      const config = await getConfig();

      // If we have a service account JSON, use it
      if (config.firebase.serviceAccountJson) {
        const serviceAccount = JSON.parse(config.firebase.serviceAccountJson);
        cachedApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || config.firebase.projectId,
        });
      } else {
        // Otherwise, try to use application default credentials with explicit project ID
        const { applicationDefault } = await import("firebase-admin/app");
        cachedApp = initializeApp({
          credential: applicationDefault(),
          projectId: config.firebase.projectId,
        });
      }
    }
  }
  return cachedApp;
}

export async function getFirestore() {
  const app = await getAdminApp();
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(app);
}

export async function getAdminAuth() {
  const app = await getAdminApp();
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(app);
}

export async function getDb() {
  return getFirestore();
}
