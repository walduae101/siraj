// @ts-nocheck
import { db } from "../src/server/firebase/admin";

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
