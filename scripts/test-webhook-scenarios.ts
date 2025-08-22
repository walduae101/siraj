#!/usr/bin/env tsx
// Test script for PayNow webhook scenarios

import crypto from "node:crypto";
import { config } from "dotenv";

config();

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/paynow/webhook`
  : "http://localhost:3000/api/paynow/webhook";

const WEBHOOK_SECRET = process.env.PAYNOW_WEBHOOK_SECRET || "";

if (!WEBHOOK_SECRET) {
  console.error("❌ PAYNOW_WEBHOOK_SECRET not found in environment");
  process.exit(1);
}

// Test event templates
const testEvents = {
  validPurchase: {
    id: `test_${Date.now()}_valid`,
    event_type: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: "test_order_123",
        pretty_id: "TEST-123",
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "test_customer_123",
          email: "test@example.com",
          metadata: { uid: "testuser123" },
        },
        lines: [
          {
            product_id: "321641745958305792", // Update with your test product ID
            quantity: 1,
            price: "5.00",
          },
        ],
      },
    },
  },

  duplicateEvent: {
    id: "test_duplicate_123", // Same ID every time
    event_type: "ON_ORDER_COMPLETED",
    data: {
      order: {
        id: "dup_order_123",
        pretty_id: "DUP-123",
        status: "completed",
        payment_state: "paid",
        customer: {
          id: "test_customer_123",
          metadata: { uid: "testuser123" },
        },
        lines: [
          {
            product_id: "321641745958305792",
            quantity: 1,
          },
        ],
      },
    },
  },
};

// Helper to create HMAC signature
function createSignature(
  payload: string,
  timestamp: string,
  secret: string,
): string {
  const message = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

// Send test webhook
async function sendWebhook(
  scenario: string,
  event: Record<string, unknown>,
  options: {
    badSignature?: boolean;
    staleTimestamp?: boolean;
    missingHeaders?: boolean;
  } = {},
) {
  console.log(`\n📤 Testing: ${scenario}`);

  const payload = JSON.stringify(event);
  const timestamp = options.staleTimestamp
    ? String(Date.now() - 400000) // 6+ minutes ago (in milliseconds)
    : String(Date.now()); // Current time in milliseconds

  const signature = options.badSignature
    ? "invalid_signature_12345"
    : createSignature(payload, timestamp, WEBHOOK_SECRET);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!options.missingHeaders) {
    headers["paynow-signature"] = signature;
    headers["paynow-timestamp"] = timestamp;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: payload,
    });

    const responseText = await response.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log("   Response:", responseData);

    if (response.ok) {
      console.log("   ✅ Success");
    } else {
      console.log("   ⚠️  Expected rejection");
    }
  } catch (error) {
    console.error("   ❌ Error:", error);
  }
}

// Run all test scenarios
async function runTests() {
  console.log("🧪 PayNow Webhook Test Scenarios");
  console.log(`📍 Testing against: ${WEBHOOK_URL}`);
  console.log(`🔑 Using secret: ${WEBHOOK_SECRET.substring(0, 5)}...`);

  // Scenario 1: Valid purchase
  await sendWebhook("Valid Purchase", testEvents.validPurchase);

  // Wait a bit between tests
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Scenario 2: Duplicate event (idempotency test)
  await sendWebhook("Duplicate Event (1st attempt)", testEvents.duplicateEvent);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await sendWebhook("Duplicate Event (2nd attempt)", testEvents.duplicateEvent);

  // Scenario 3: Bad signature
  await sendWebhook("Bad Signature", testEvents.validPurchase, {
    badSignature: true,
  });

  // Scenario 4: Stale timestamp
  await sendWebhook("Stale Timestamp", testEvents.validPurchase, {
    staleTimestamp: true,
  });

  // Scenario 5: Missing headers
  await sendWebhook("Missing Headers", testEvents.validPurchase, {
    missingHeaders: true,
  });

  console.log("\n✅ Test scenarios complete!");
  console.log("\nNext steps:");
  console.log("1. Check Cloud Logging for structured logs");
  console.log("2. Verify metrics are populating");
  console.log("3. Check dashboard for data");
  console.log("4. Verify alerts didn't fire for valid scenarios");
}

// Run if called directly
// Run tests directly
runTests().catch(console.error);
