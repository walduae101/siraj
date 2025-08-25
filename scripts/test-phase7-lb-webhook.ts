#!/usr/bin/env tsx

import crypto from 'crypto';

interface PayNowWebhookEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  data: {
    transaction_id: string;
    amount: number;
    currency: string;
    status: string;
  };
}

async function testWebhook(url: string, event: PayNowWebhookEvent, secret: string) {
  const payload = JSON.stringify(event);
  const timestamp = Date.now().toString();
  
  // PayNow signature format: timestamp.rawBody
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('base64');

  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paynow-signature': signature,
        'paynow-timestamp': timestamp,
        'User-Agent': 'PayNow-Webhook/1.0',
      },
      body: payload,
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`🌐 Webhook Test Results for ${url}:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   Event ID: ${event.event_id}`);
    console.log(`   Event Type: ${event.event_type}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`   Response: ${responseText}`);
    }
    
    return { success: response.ok, processingTime, status: response.status };
  } catch (error) {
    console.error(`❌ Error testing webhook at ${url}:`, error);
    return { success: false, processingTime: Date.now() - startTime, error: error.message };
  }
}

async function main() {
  console.log('🧪 Phase 7 Load Balancer Webhook Test');
  console.log('=====================================');

  // Get config from environment or use defaults
  const webhookSecret = process.env.PAYNOW_WEBHOOK_SECRET || 'pn-7cade0c6397c40da9b16f79ab5df132c';
  
  // Test load balancer URLs
  const testUrls = [
    'https://hooks.siraj.life/api/paynow/webhook',
    'https://worker.siraj.life/health',
  ];

  // Test event
  const testEvent: PayNowWebhookEvent = {
    event_id: `test-${Date.now()}`,
    event_type: 'payment_success',
    timestamp: new Date().toISOString(),
    data: {
      transaction_id: `txn-${Date.now()}`,
      amount: 1000,
      currency: 'SGD',
      status: 'success',
    },
  };

  console.log(`📋 Test Event: ${JSON.stringify(testEvent, null, 2)}`);
  console.log('');

  // Test load balancer endpoints
  for (const url of testUrls) {
    console.log(`🔍 Testing: ${url}`);
    const result = await testWebhook(url, testEvent, webhookSecret);
    
    if (result.success) {
      console.log(`✅ Success - Processing time: ${result.processingTime}ms`);
    } else {
      console.log(`❌ Failed - Status: ${result.status}, Error: ${result.error}`);
    }
    console.log('');
  }

  console.log('🎯 Test Complete');
}

main().catch(console.error);
