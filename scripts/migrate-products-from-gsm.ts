#!/usr/bin/env tsx

import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
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

// Mock GSM product mapping (from your actual config)
const gsmProducts: Record<string, string> = {
  "459935272365195264": "20",
  "458255405240287232": "50",
  "458255787102310400": "150",
  "458256188073574400": "500",
  "458253675014389760": "50",
  "458254106331451392": "150",
  "458254569336479744": "600",
  "458255036057649152": "1800",
  "321641745958305792": "50",
};

async function migrateProductsFromGSM() {
  console.log("🔄 Starting product migration from GSM to Firestore...");

  try {
    console.log(
      `📦 Found ${Object.keys(gsmProducts).length} products in GSM mapping`,
    );

    // Define product metadata (you may need to adjust these based on your actual products)
    const productMetadata = {
      "459935272365195264": {
        title: "Top-up 20 pts",
        type: "one_time" as const,
        points: 20,
        priceUSD: 2.0,
      },
      "458255405240287232": {
        title: "Top-up 50 pts",
        type: "one_time" as const,
        points: 50,
        priceUSD: 5.0,
      },
      "458255787102310400": {
        title: "Top-up 150 pts",
        type: "one_time" as const,
        points: 150,
        priceUSD: 15.0,
      },
      "458256188073574400": {
        title: "Top-up 500 pts",
        type: "one_time" as const,
        points: 500,
        priceUSD: 50.0,
      },
      "458253675014389760": {
        title: "Basic Monthly Subscription",
        type: "subscription" as const,
        points: 50,
        priceUSD: 5.0,
      },
      "458254106331451392": {
        title: "Pro Monthly Subscription",
        type: "subscription" as const,
        points: 150,
        priceUSD: 15.0,
      },
      "458254569336479744": {
        title: "Basic Annual Subscription",
        type: "subscription" as const,
        points: 600,
        priceUSD: 50.0,
      },
      "458255036057649152": {
        title: "Pro Annual Subscription",
        type: "subscription" as const,
        points: 1800,
        priceUSD: 150.0,
      },
      "321641745958305792": {
        title: "Top-up 50 pts (Legacy)",
        type: "one_time" as const,
        points: 50,
        priceUSD: 5.0,
      },
    };

    const now = Timestamp.now();
    const migrationUserId = "system:migration";

    let createdCount = 0;
    let skippedCount = 0;

    // Create products in Firestore
    for (const [paynowProductId, points] of Object.entries(gsmProducts)) {
      const metadata =
        productMetadata[paynowProductId as keyof typeof productMetadata];

      if (!metadata) {
        console.warn(
          `⚠️  No metadata found for product ${paynowProductId}, skipping`,
        );
        skippedCount++;
        continue;
      }

      // Check if product already exists
      const existingSnapshot = await db
        .collection("products")
        .where("paynowProductId", "==", paynowProductId)
        .where("active", "==", true)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        console.log(`⏭️  Product ${paynowProductId} already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Create new product document
      const productDoc = {
        title: metadata.title,
        type: metadata.type,
        points: Number(points),
        priceUSD: metadata.priceUSD,
        paynowProductId,
        active: true,
        version: 1,
        effectiveFrom: now,
        effectiveTo: null,
        createdAt: now,
        updatedAt: now,
        createdBy: migrationUserId,
        updatedBy: migrationUserId,
        metadata: {
          migratedFrom: "gsm",
          originalPoints: points,
        },
      };

      await db.collection("products").add(productDoc);
      console.log(`✅ Created product: ${metadata.title} (${paynowProductId})`);
      createdCount++;
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   Created: ${createdCount} products`);
    console.log(`   Skipped: ${skippedCount} products`);
    console.log(
      `   Total: ${Object.keys(gsmProducts).length} products processed`,
    );

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    const firestoreProducts = await db
      .collection("products")
      .where("active", "==", true)
      .get();

    console.log(`   Active products in Firestore: ${firestoreProducts.size}`);

    // Check for any missing products
    const firestoreProductIds = new Set(
      firestoreProducts.docs.map((doc) => doc.data().paynowProductId),
    );

    const missingProducts = Object.keys(gsmProducts).filter(
      (id) => !firestoreProductIds.has(id),
    );

    if (missingProducts.length > 0) {
      console.warn(`⚠️  Missing products: ${missingProducts.join(", ")}`);
    } else {
      console.log("✅ All GSM products successfully migrated to Firestore");
    }

    console.log("\n🎉 Product migration completed!");
    console.log("\nNext steps:");
    console.log("1. Set PRODUCT_SOT=firestore in your environment");
    console.log("2. Test webhook processing with new product catalog");
    console.log("3. Monitor logs for 'product_source' field");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateProductsFromGSM()
  .then(() => {
    console.log("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
