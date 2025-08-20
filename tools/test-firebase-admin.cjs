console.log("Script started");
require("dotenv").config();
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const creds = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

if (!creds) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not set or invalid.");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(creds), projectId: creds.project_id });
}

const db = getFirestore();

async function main() {
  try {
    const snap = await db.collection("test").limit(1).get();
    console.log("Firestore test query succeeded:", snap.size, "docs");
  } catch (e) {
    console.error("Firebase Admin error:", e);
    process.exit(1);
  }
}

main();
