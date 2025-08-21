#!/usr/bin/env tsx
/**
 * Test PayNow webhook handler locally
 * Usage: npx tsx tools/test-paynow-webhook.ts
 */

import crypto from "node:crypto";

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://localhost:3000/api/paynow/webhook";
const WEBHOOK_SECRET = process.env.PAYNOW_WEBHOOK_SECRET || "test-secret";

// Generate HMAC signature like PayNow does
function generateSignature(
  payload: string,
  secret: string,
  timestamp: string,
): string {
  const data = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// Test event payloads
const testEvents = {
  orderCompleted: {
    id: "evt_test_order_completed",
    event: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: "order_test_123",
        pretty_id: "TEST-123",
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "cust_test_456",
          email: "test@example.com",
          metadata: {
            uid: "test-user-uid-123",
          },
        },
        lines: [
          {
            product_id: "prod_points_100",
            quantity: 2,
            price: 1000,
          },
        ],
      },
    },
  },

  subscriptionActivated: {
    id: "evt_test_sub_activated",
    event: "ON_SUBSCRIPTION_ACTIVATED",
    data: {
      subscription: {
        id: "sub_test_789",
        product_id: "prod_sub_basic_monthly",
        status: "active",
        customer: {
          id: "cust_test_456",
          email: "test@example.com",
          metadata: {
            uid: "test-user-uid-123",
          },
        },
      },
    },
  },

  subscriptionRenewed: {
    id: "evt_test_sub_renewed",
    event: "ON_SUBSCRIPTION_RENEWED",
    data: {
      subscription: {
        id: "sub_test_789",
        product_id: "prod_sub_basic_monthly",
        status: "active",
        customer: {
          id: "cust_test_456",
          email: "test@example.com",
          metadata: {
            uid: "test-user-uid-123",
          },
        },
      },
    },
  },
};

async function sendTestEvent(eventName: keyof typeof testEvents) {
  const event = testEvents[eventName];
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateSignature(payload, WEBHOOK_SECRET, timestamp);

  console.log(`\n🧪 Testing event: ${eventName}`);
  console.log(`📝 Event ID: ${event.id}`);
  console.log(`🔗 URL: ${WEBHOOK_URL}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PayNow-Signature": signature,
        "PayNow-Timestamp": timestamp,
        "User-Agent": "PayNow-Webhook-Test/1.0",
      },
      body: payload,
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log(`✅ Success (${response.status})`);
      try {
        const json = JSON.parse(responseText);
        console.log(`📊 Response:`, JSON.stringify(json, null, 2));
      } catch {
        console.log(`📄 Response: ${responseText}`);
      }
    } else {
      console.log(`❌ Failed (${response.status})`);
      console.log(`📄 Error: ${responseText}`);
    }
  } catch (error) {
    console.log(
      `💥 Request failed:`,
      error instanceof Error ? error.message : error,
    );
  }
}

async function testReplayProtection() {
  console.log(`\n🔒 Testing replay protection`);

  const event = testEvents.orderCompleted;
  const payload = JSON.stringify(event);
  const oldTimestamp = Math.floor(
    (Date.now() - 10 * 60 * 1000) / 1000,
  ).toString(); // 10 minutes ago
  const signature = generateSignature(payload, WEBHOOK_SECRET, oldTimestamp);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PayNow-Signature": signature,
        "PayNow-Timestamp": oldTimestamp,
      },
      body: payload,
    });

    if (response.status === 401) {
      console.log(`✅ Replay protection working (rejected old timestamp)`);
    } else {
      console.log(`❌ Replay protection failed (should reject old timestamp)`);
      console.log(`📄 Response: ${await response.text()}`);
    }
  } catch (error) {
    console.log(
      `💥 Request failed:`,
      error instanceof Error ? error.message : error,
    );
  }
}

async function testInvalidSignature() {
  console.log(`\n🔐 Testing invalid signature rejection`);

  const event = testEvents.orderCompleted;
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const badSignature = "invalid-signature";

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PayNow-Signature": badSignature,
        "PayNow-Timestamp": timestamp,
      },
      body: payload,
    });

    if (response.status === 401) {
      console.log(`✅ Signature validation working (rejected bad signature)`);
    } else {
      console.log(
        `❌ Signature validation failed (should reject bad signature)`,
      );
      console.log(`📄 Response: ${await response.text()}`);
    }
  } catch (error) {
    console.log(
      `💥 Request failed:`,
      error instanceof Error ? error.message : error,
    );
  }
}

async function main() {
  console.log(`🚀 PayNow Webhook Test Suite`);
  console.log(`🎯 Target: ${WEBHOOK_URL}`);
  console.log(`🔑 Secret: ${WEBHOOK_SECRET.slice(0, 8)}...`);

  // Test security features first
  await testInvalidSignature();
  await testReplayProtection();

  // Test event processing
  await sendTestEvent("orderCompleted");
  await sendTestEvent("subscriptionActivated");
  await sendTestEvent("subscriptionRenewed");

  // Test idempotency by sending the same event twice
  console.log(`\n🔄 Testing idempotency (sending same event twice)`);
  await sendTestEvent("orderCompleted");

  console.log(`\n✨ Test complete!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
