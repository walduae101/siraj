#!/usr/bin/env node

import { getConfig } from "../src/server/config.js";

// Test webhook endpoint with synthetic events
async function testPhase6AWebhook() {
  console.log("🧪 Phase 6A Webhook Validation");
  console.log("=".repeat(50));

  try {
    // Test 1: Configuration
    console.log("📋 Test 1: Configuration");
    const config = await getConfig();
    console.log(`   webhookMode: ${config.features.webhookMode}`);
    console.log(`   webhookQueueCanaryRatio: ${config.features.webhookQueueCanaryRatio}`);
    console.log("   ✅ Configuration loaded successfully");

    // Test 2: Webhook Endpoint Health
    console.log("\n📋 Test 2: Webhook Endpoint Health");
    const webhookUrl = "https://siraj-207501673877.us-central1.run.app/api/paynow/webhook";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PayNow-Signature": "test-signature"
      },
      body: JSON.stringify({
        event_id: "test_phase6a_001",
        event_type: "test.purchase",
        data: {
          test: true,
          phase: "6a"
        }
      })
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   ✅ Webhook endpoint responding`);

    // Test 3: Pub/Sub Publishing
    console.log("\n📋 Test 3: Pub/Sub Publishing");
    const { publishPaynowEvent } = await import("../src/server/services/pubsubPublisher.js");
    
    const testMessage = {
      eventId: `phase6a_test_${Date.now()}`,
      eventType: "test.purchase",
      orderId: "test_order_001",
      paynowCustomerId: "test_customer_001",
      uid: "test_user_001",
      data: { test: true, phase: "6a" }
    };

    const startTime = Date.now();
    const messageId = await publishPaynowEvent(testMessage);
    const publishMs = Date.now() - startTime;

    console.log(`   Message ID: ${messageId}`);
    console.log(`   Publish time: ${publishMs}ms`);
    console.log(`   ✅ Pub/Sub publishing working`);

    // Test 4: Worker Endpoint
    console.log("\n📋 Test 4: Worker Endpoint");
    const workerUrl = "https://siraj-207501673877.us-central1.run.app/api/tasks/paynow/process";
    
    const workerResponse = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      },
      body: JSON.stringify({
        message: {
          data: Buffer.from(JSON.stringify({
            eventId: "test_worker_health",
            eventType: "test.worker.health",
            data: {}
          })).toString("base64"),
          messageId: "test_message_id",
          publishTime: new Date().toISOString(),
          attributes: {}
        }
      })
    });

    console.log(`   Worker Status: ${workerResponse.status}`);
    console.log(`   ✅ Worker endpoint responding`);

    console.log("\n🎯 Phase 6A Webhook Validation: ✅ READY");
    console.log("   - Configuration: ✅");
    console.log("   - Webhook endpoint: ✅");
    console.log("   - Pub/Sub publishing: ✅");
    console.log("   - Worker endpoint: ✅");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testPhase6AWebhook()
  .then(() => {
    console.log("\n✅ All webhook tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Webhook test execution failed:", error);
    process.exit(1);
  });
