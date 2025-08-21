#!/usr/bin/env tsx
/**
 * Comprehensive webhook integration verification
 * Tests all critical paths with proper PayNow signature
 */

import crypto from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook";
const WEBHOOK_SECRET = process.env.PAYNOW_WEBHOOK_SECRET || "pn-7cade0c6397c40da9b16f79ab5df132c";
const FIREBASE_UID = "OPvJByA50jQmxGrgsqmrn794Axd2"; // Your actual UID

// Initialize Firebase Admin for verification
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || "walduae-project-20250809071906",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

/**
 * Generate HMAC signature exactly as PayNow does
 * @param payload - Raw JSON body
 * @param secret - Webhook signing secret
 * @param timestamp - Timestamp in milliseconds
 * @returns Base64 encoded HMAC-SHA256 signature
 */
function generateSignature(payload: string, secret: string, timestamp: string): string {
  const data = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

/**
 * Send a test webhook event
 */
async function sendWebhookEvent(event: any, description: string) {
  console.log(`\n🧪 Testing: ${description}`);
  
  const payload = JSON.stringify(event);
  const timestamp = Date.now().toString(); // PayNow sends milliseconds
  const signature = generateSignature(payload, WEBHOOK_SECRET, timestamp);
  
  console.log(`  📝 Event ID: ${event.id}`);
  console.log(`  ⏰ Timestamp: ${timestamp}`);
  console.log(`  🔐 Signature: ${signature.substring(0, 20)}...`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "paynow-signature": signature,
        "paynow-timestamp": timestamp,
      },
      body: payload,
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`  ✅ Webhook accepted (${response.status})`);
      try {
        const json = JSON.parse(responseText);
        console.log(`  📊 Response:`, json);
      } catch {
        console.log(`  📄 Response: ${responseText}`);
      }
      return true;
    } else {
      console.log(`  ❌ Webhook rejected (${response.status})`);
      console.log(`  📄 Error: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.log(`  💥 Request failed:`, error);
    return false;
  }
}

/**
 * Verify Firestore state after webhook
 */
async function verifyFirestoreState(eventId: string, expectedPoints: number) {
  console.log(`\n🔍 Verifying Firestore state...`);
  
  // Check webhook event was recorded
  const webhookDoc = await db.collection("webhookEvents").doc(eventId).get();
  if (webhookDoc.exists) {
    const data = webhookDoc.data();
    console.log(`  ✅ Webhook event recorded: status=${data?.status}`);
  } else {
    console.log(`  ❌ Webhook event NOT found`);
    return false;
  }
  
  // Check user wallet
  const walletDoc = await db
    .collection("users")
    .doc(FIREBASE_UID)
    .collection("wallet")
    .doc("points")
    .get();
    
  if (walletDoc.exists) {
    const balance = walletDoc.data()?.paidBalance || 0;
    console.log(`  💰 Current wallet balance: ${balance} points`);
    return balance;
  } else {
    console.log(`  ❌ Wallet NOT found`);
    return 0;
  }
}

/**
 * Test order completion event
 */
async function testOrderCompleted() {
  const eventId = `test_order_${Date.now()}`;
  const event = {
    id: eventId,
    event_type: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: `order_${Date.now()}`,
        pretty_id: `TEST-${Date.now()}`,
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "cust_test_456",
          email: "walduae101@gmail.com",
          metadata: {
            uid: FIREBASE_UID
          }
        },
        lines: [
          {
            product_id: "321641745958305792", // The actual product ID from purchase
            quantity: 1,
            price: 500,
          }
        ]
      }
    }
  };
  
  const balanceBefore = await verifyFirestoreState("dummy", 0);
  
  const success = await sendWebhookEvent(event, "Order Completed (50 points)");
  if (!success) return false;
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const balanceAfter = await verifyFirestoreState(eventId, 50);
  
  if (balanceAfter > balanceBefore) {
    console.log(`  🎉 Points credited: +${balanceAfter - balanceBefore}`);
    return true;
  } else {
    console.log(`  ⚠️ No points credited`);
    return false;
  }
}

/**
 * Test idempotency
 */
async function testIdempotency() {
  console.log("\n🔄 Testing idempotency...");
  
  const eventId = `test_idempotent_${Date.now()}`;
  const event = {
    id: eventId,
    event_type: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: `order_idem_${Date.now()}`,
        pretty_id: `IDEM-${Date.now()}`,
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "cust_test_456",
          email: "walduae101@gmail.com",
          metadata: {
            uid: FIREBASE_UID
          }
        },
        lines: [
          {
            product_id: "458255405240287232", // points_50 from mapping
            quantity: 1,
            price: 500,
          }
        ]
      }
    }
  };
  
  // Send first time
  await sendWebhookEvent(event, "First event (should process)");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const balance1 = await verifyFirestoreState(eventId, 50);
  
  // Send duplicate
  await sendWebhookEvent(event, "Duplicate event (should skip)");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const balance2 = await verifyFirestoreState(eventId, 50);
  
  if (balance1 === balance2) {
    console.log("  ✅ Idempotency working - no duplicate credits");
    return true;
  } else {
    console.log("  ❌ Idempotency failed - duplicate credits detected!");
    return false;
  }
}

/**
 * Test replay protection
 */
async function testReplayProtection() {
  console.log("\n🕐 Testing replay protection...");
  
  const event = {
    id: `test_replay_${Date.now()}`,
    event_type: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: `order_replay_${Date.now()}`,
        pretty_id: `REPLAY-${Date.now()}`,
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "cust_test_456",
          email: "walduae101@gmail.com",
          metadata: {
            uid: FIREBASE_UID
          }
        },
        lines: [
          {
            product_id: "458255405240287232",
            quantity: 1,
            price: 500,
          }
        ]
      }
    }
  };
  
  const payload = JSON.stringify(event);
  const oldTimestamp = (Date.now() - 6 * 60 * 1000).toString(); // 6 minutes ago
  const signature = generateSignature(payload, WEBHOOK_SECRET, oldTimestamp);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "paynow-signature": signature,
        "paynow-timestamp": oldTimestamp,
      },
      body: payload,
    });
    
    if (response.status === 401) {
      console.log("  ✅ Replay protection working - old timestamp rejected");
      return true;
    } else {
      console.log(`  ❌ Replay protection failed - status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log("  💥 Request failed:", error);
    return false;
  }
}

/**
 * Main test suite
 */
async function main() {
  console.log("🚀 PayNow Webhook Integration Test Suite");
  console.log("━".repeat(50));
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`👤 Firebase UID: ${FIREBASE_UID}`);
  console.log("━".repeat(50));
  
  const results = {
    orderCompleted: false,
    idempotency: false,
    replayProtection: false,
  };
  
  // Run tests
  results.orderCompleted = await testOrderCompleted();
  results.idempotency = await testIdempotency();
  results.replayProtection = await testReplayProtection();
  
  // Summary
  console.log("\n" + "━".repeat(50));
  console.log("📊 Test Results Summary");
  console.log("━".repeat(50));
  
  const allPassed = Object.values(results).every(r => r);
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  if (allPassed) {
    console.log("\n🎉 All tests passed! Webhook integration is working correctly.");
  } else {
    console.log("\n⚠️ Some tests failed. Please review the issues above.");
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
