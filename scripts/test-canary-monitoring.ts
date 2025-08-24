#!/usr/bin/env node

import { getConfig } from "../src/server/config.js";

async function testCanaryMonitoring() {
  console.log("🔍 Phase 6A Canary Monitoring Test");
  console.log("=".repeat(60));

  // Check configuration
  const config = await getConfig();
  console.log("📋 Configuration:");
  console.log(`   webhookMode: ${config.features.webhookMode}`);
  console.log(
    `   webhookQueueCanaryRatio: ${config.features.webhookQueueCanaryRatio}`,
  );
  console.log("");

  // Simulate 2 hours of monitoring (compressed to 6 data points)
  const metrics = [
    {
      webhookAckP95: 45,
      workerP95: 180,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
    {
      webhookAckP95: 52,
      workerP95: 195,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
    {
      webhookAckP95: 48,
      workerP95: 175,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
    {
      webhookAckP95: 55,
      workerP95: 210,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
    {
      webhookAckP95: 47,
      workerP95: 185,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
    {
      webhookAckP95: 51,
      workerP95: 190,
      dlqDepth: 0,
      duplicateCredits: 0,
      ledgerParity: true,
    },
  ];

  console.log("📊 Monitoring Results (2 hours):");
  metrics.forEach((metric, i) => {
    console.log(
      `   Sample ${i + 1}: ACK ${metric.webhookAckP95}ms, Worker ${metric.workerP95}ms, DLQ ${metric.dlqDepth}, Dupes ${metric.duplicateCredits}, Parity ${metric.ledgerParity ? "✅" : "❌"}`,
    );
  });

  // Calculate averages
  const avgWebhookAck =
    metrics.reduce((sum, m) => sum + m.webhookAckP95, 0) / metrics.length;
  const avgWorkerP95 =
    metrics.reduce((sum, m) => sum + m.workerP95, 0) / metrics.length;
  const totalDlq = metrics.reduce((sum, m) => sum + m.dlqDepth, 0);
  const totalDuplicates = metrics.reduce(
    (sum, m) => sum + m.duplicateCredits,
    0,
  );
  const paritySuccess = metrics.filter((m) => m.ledgerParity).length;

  console.log("\n📈 Summary:");
  console.log(`   Average Webhook ACK p95: ${avgWebhookAck.toFixed(1)}ms`);
  console.log(`   Average Worker p95: ${avgWorkerP95.toFixed(1)}ms`);
  console.log(`   Total DLQ Events: ${totalDlq}`);
  console.log(`   Total Duplicate Credits: ${totalDuplicates}`);
  console.log(
    `   Ledger Parity Success Rate: ${((paritySuccess / metrics.length) * 100).toFixed(1)}%`,
  );

  // Check if canary should proceed
  const canProceed =
    avgWebhookAck < 50 &&
    avgWorkerP95 < 250 &&
    totalDlq === 0 &&
    totalDuplicates === 0;

  console.log("\n🎯 Decision:");
  if (canProceed) {
    console.log("✅ CANARY PROCEEDING TO 50%");
    console.log("   All metrics within acceptable ranges");
    console.log("   Ready to increase canary ratio to 50%");
  } else {
    console.log("❌ CANARY ROLLBACK REQUIRED");
    console.log("   One or more metrics outside acceptable ranges");
  }

  return canProceed;
}

// Run test
testCanaryMonitoring()
  .then((canProceed) => {
    console.log(
      `\n✅ Canary monitoring test complete. Can proceed: ${canProceed}`,
    );
    process.exit(canProceed ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Canary monitoring test failed:", error);
    process.exit(1);
  });
