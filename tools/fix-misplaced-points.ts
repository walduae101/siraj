#!/usr/bin/env tsx
// Script to migrate misplaced points from userPoints collection to correct location

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { config } from "dotenv";

config();

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

async function migrateUserPoints() {
  console.log("Starting migration of misplaced points...");

  try {
    // Get all documents from userPoints collection
    const userPointsSnapshot = await db.collection("userPoints").get();
    
    if (userPointsSnapshot.empty) {
      console.log("No documents found in userPoints collection");
      return;
    }

    console.log(`Found ${userPointsSnapshot.size} documents to migrate`);

    for (const doc of userPointsSnapshot.docs) {
      const uid = doc.id;
      const data = doc.data();
      
      console.log(`\nProcessing user: ${uid}`);
      console.log(`Data:`, data);

      // Convert string points to number
      const paidPoints = typeof data.paidPoints === 'string' 
        ? parseInt(data.paidPoints, 10) 
        : (data.paidPoints || 0);
      
      const userId = data.userId || uid;

      if (isNaN(paidPoints) || paidPoints <= 0) {
        console.log(`Skipping: Invalid points value`);
        continue;
      }

      // Ensure user document exists
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log(`Creating user document for ${userId}`);
        await userRef.set({
          uid: userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: "active"
        });
      }

      // Get current wallet balance
      const walletRef = db.collection("users").doc(userId).collection("wallet").doc("points");
      const walletDoc = await walletRef.get();
      
      const currentBalance = walletDoc.exists ? (walletDoc.data()?.paidBalance || 0) : 0;
      const newBalance = currentBalance + paidPoints;

      console.log(`Current balance: ${currentBalance}, Adding: ${paidPoints}, New balance: ${newBalance}`);

      // Update wallet in a transaction
      await db.runTransaction(async (tx) => {
        // Update wallet balance
        tx.set(walletRef, {
          paidBalance: newBalance,
          promoBalance: walletDoc.exists ? (walletDoc.data()?.promoBalance || 0) : 0,
          promoLots: walletDoc.exists ? (walletDoc.data()?.promoLots || []) : [],
          updatedAt: Timestamp.now(),
          createdAt: walletDoc.exists ? walletDoc.data()?.createdAt : Timestamp.now(),
          v: 1
        }, { merge: true });

        // Add ledger entry
        const ledgerRef = db.collection("users").doc(userId).collection("ledger").doc();
        tx.set(ledgerRef, {
          type: "credit",
          channel: "paid",
          amount: paidPoints,
          action: "credit.migration",
          actionId: `migration_userPoints_${doc.id}_${Date.now()}`,
          pre: { paid: currentBalance, promo: walletDoc.exists ? (walletDoc.data()?.promoBalance || 0) : 0 },
          post: { paid: newBalance, promo: walletDoc.exists ? (walletDoc.data()?.promoBalance || 0) : 0 },
          createdAt: Timestamp.now(),
          createdBy: "migration_script",
          note: `Migrated from userPoints collection. Original doc ID: ${doc.id}`,
          v: 1
        });

        // Mark the original document as migrated
        tx.update(doc.ref, {
          migrated: true,
          migratedAt: Timestamp.now(),
          migratedTo: userId
        });
      });

      console.log(`✅ Successfully migrated ${paidPoints} points to user ${userId}`);
    }

    console.log("\n✅ Migration complete!");

    // Optional: Delete migrated documents
    console.log("\nDo you want to delete the migrated documents from userPoints? (uncomment the code below)");
    /*
    for (const doc of userPointsSnapshot.docs) {
      if (doc.data().migrated) {
        await doc.ref.delete();
        console.log(`Deleted migrated document: ${doc.id}`);
      }
    }
    */

  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run migration
migrateUserPoints().catch(console.error);
