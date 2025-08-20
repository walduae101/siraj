import { getAuth } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
// @ts-nocheck
import { db } from "../src/server/firebase/admin";

async function listAllAuthUsers(nextPageToken?: string) {
  const auth = getAuth();
  const users: any[] = [];
  let pageToken = nextPageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

async function main() {
  const users = await listAllAuthUsers();
  for (const user of users) {
    const ref = db
      .collection("users")
      .doc(user.uid)
      .collection("wallet")
      .doc("points");
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        paidBalance: 0,
        promoBalance: 0,
        promoLots: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        v: 1,
      });
      console.log(`Initialized wallet for ${user.uid}`);
    }
  }
  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
