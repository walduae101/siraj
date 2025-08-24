#!/usr/bin/env tsx

import { getConfig } from "../src/server/config";

async function configurePayNowWebhook() {
  console.log("🔧 Configuring PayNow webhook...");

  try {
    const config = await getConfig();
    
    const webhookUrl = "https://siraj.life/api/paynow/webhook";
    const events = [
      "ON_ORDER_COMPLETED",
      "ON_DELIVERY_ITEM_ADDED", 
      "ON_SUBSCRIPTION_ACTIVATED",
      "ON_SUBSCRIPTION_RENEWED",
      "ON_SUBSCRIPTION_CANCELED",
      "ON_SUBSCRIPTION_EXPIRED",
      "ON_REFUND",
      "ON_CHARGEBACK"
    ];

    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`📋 Events: ${events.join(", ")}`);

    // Create webhook configuration
    const webhookConfig = {
      url: webhookUrl,
      events: events,
      secret: config.paynow.webhookSecret,
      active: true
    };

    console.log("\n📝 Webhook Configuration:");
    console.log(JSON.stringify(webhookConfig, null, 2));

    // Instructions for manual setup
    console.log("\n📋 Manual Setup Instructions:");
    console.log("1. Go to PayNow Dashboard: https://dashboard.paynow.gg");
    console.log("2. Navigate to Settings > Webhooks");
    console.log("3. Create a new webhook with the following details:");
    console.log(`   - URL: ${webhookUrl}`);
    console.log(`   - Secret: ${config.paynow.webhookSecret}`);
    console.log("   - Events: Select all the events listed above");
    console.log("4. Save the webhook and note the webhook ID");
    console.log("5. Update the webhookId in config.json with the new ID");

    // Test webhook endpoint
    console.log("\n🧪 Testing webhook endpoint...");
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PayNow-Signature": "test-signature",
          "PayNow-Timestamp": new Date().toISOString(),
        },
        body: JSON.stringify({
          id: "test-webhook",
          event_type: "test",
          data: { test: true }
        })
      });

      if (response.ok) {
        console.log("✅ Webhook endpoint is accessible");
      } else {
        console.log(`⚠️  Webhook endpoint returned ${response.status}`);
      }
    } catch (error) {
      console.log("❌ Webhook endpoint test failed:", error);
    }

  } catch (error) {
    console.error("❌ Error configuring webhook:", error);
    process.exit(1);
  }
}

// Run if called directly
configurePayNowWebhook().catch(console.error);
