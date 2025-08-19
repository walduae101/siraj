import "server-only";

let cachedApp: import("firebase-admin/app").App | null = null;

export async function getAdminApp() {
  const { getApps, initializeApp, applicationDefault } = await import(
    "firebase-admin/app"
  );
  if (!cachedApp) {
    cachedApp =
      getApps()[0] ??
      initializeApp({
        // On GCP, default ADC is available; locally, configure gcloud auth/applicationDefault
        credential: applicationDefault(),
      });
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
