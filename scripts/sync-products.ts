#!/usr/bin/env tsx

/**
 * Sync products from configuration to Firestore
 * This ensures products are available for checkout
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getConfig } from "../src/server/config";

async function main() {
  console.log("🔄 Syncing products from config to Firestore...\n");

  // Initialize Firebase Admin - Get from config directly
  const config = await getConfig();
  
  if (!config.firebase.serviceAccountJson) {
    console.error("❌ No service account found in config");
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(config.firebase.serviceAccountJson);

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = getFirestore();
  
  try {
    const now = Timestamp.now();
    
    // Product details mapping
    const productDetails = {
      points_20: {
        title: "20 Points Pack",
        type: "one_time" as const,
        points: 20,
        priceUSD: 2.00,
        description: "Starter pack - 20 points that never expire"
      },
      points_50: {
        title: "50 Points Pack", 
        type: "one_time" as const,
        points: 50,
        priceUSD: 5.00,
        description: "Value pack - 50 points that never expire"
      },
      points_150: {
        title: "150 Points Pack",
        type: "one_time" as const,
        points: 150,
        priceUSD: 12.00,
        description: "Popular pack - 150 points that never expire"
      },
      points_500: {
        title: "500 Points Pack",
        type: "one_time" as const,
        points: 500,
        priceUSD: 25.00,
        description: "Best value - 500 points that never expire"
      }
    };
    
    // Sync point products
    console.log("📦 Syncing point products...");
    for (const [sku, paynowProductId] of Object.entries(config.paynow.products)) {
      const details = productDetails[sku as keyof typeof productDetails];
      if (!details) {
        console.warn(`⚠️  No details found for SKU: ${sku}`);
        continue;
      }
      
      // Check if product already exists
      const existingQuery = await db
        .collection("products")
        .where("paynowProductId", "==", paynowProductId)
        .where("active", "==", true)
        .limit(1)
        .get();
        
      if (!existingQuery.empty) {
        console.log(`✓ Product already exists: ${sku} (${paynowProductId})`);
        continue;
      }
      
      // Create new product
      const productData = {
        title: details.title,
        type: details.type,
        points: details.points,
        priceUSD: details.priceUSD,
        paynowProductId: paynowProductId,
        active: true,
        version: 1,
        effectiveFrom: now,
        effectiveTo: null,
        createdAt: now,
        updatedAt: now,
        createdBy: "sync-script",
        updatedBy: "sync-script",
        metadata: {
          sku,
          description: details.description,
        }
      };
      
      const docRef = await db.collection("products").add(productData);
      console.log(`✅ Created product: ${sku} (${paynowProductId}) - ${docRef.id}`);
    }
    
    // Sync subscription products
    console.log("\n📅 Syncing subscription products...");
    const subscriptionDetails = {
      basic_monthly: {
        title: "Basic Monthly Subscription",
        type: "subscription" as const,
        points: 100, // Points per month
        priceUSD: 5.00,
        description: "Basic monthly subscription - 100 points per month"
      },
      professional_monthly: {
        title: "Professional Monthly Subscription",
        type: "subscription" as const,
        points: 400, // Points per month
        priceUSD: 15.00,
        description: "Professional monthly subscription - 400 points per month"
      },
      basic_yearly: {
        title: "Basic Annual Subscription",
        type: "subscription" as const,
        points: 100, // Points per month (1200 total per year)
        priceUSD: 50.00,
        description: "Basic annual subscription - 100 points per month"
      },
      professional_yearly: {
        title: "Professional Annual Subscription",
        type: "subscription" as const,
        points: 400, // Points per month (4800 total per year)
        priceUSD: 150.00,
        description: "Professional annual subscription - 400 points per month"
      }
    };
    
    for (const [planKey, planData] of Object.entries(config.subscriptions.plans)) {
      const details = subscriptionDetails[planKey as keyof typeof subscriptionDetails];
      if (!details) {
        console.warn(`⚠️  No details found for plan: ${planKey}`);
        continue;
      }
      
      const paynowProductId = planData.paynowProductId;
      
      // Check if product already exists
      const existingQuery = await db
        .collection("products")
        .where("paynowProductId", "==", paynowProductId)
        .where("active", "==", true)
        .limit(1)
        .get();
        
      if (!existingQuery.empty) {
        console.log(`✓ Subscription product already exists: ${planKey} (${paynowProductId})`);
        continue;
      }
      
      // Create new product
      const productData = {
        title: details.title,
        type: details.type,
        points: details.points,
        priceUSD: details.priceUSD,
        paynowProductId: paynowProductId,
        active: true,
        version: 1,
        effectiveFrom: now,
        effectiveTo: null,
        createdAt: now,
        updatedAt: now,
        createdBy: "sync-script",
        updatedBy: "sync-script",
        metadata: {
          planKey,
          planName: planData.name,
          cycle: planData.cycle,
          pointsPerCycle: planData.pointsPerCycle,
          description: details.description,
        }
      };
      
      const docRef = await db.collection("products").add(productData);
      console.log(`✅ Created subscription product: ${planKey} (${paynowProductId}) - ${docRef.id}`);
    }
    
    console.log("\n✨ Product sync completed!");
    
  } catch (error) {
    console.error("❌ Error syncing products:", error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);
