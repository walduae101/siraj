#!/usr/bin/env node

/**
 * Basic fraud service test
 * Tests the fraud service without requiring full environment setup
 */

import { fraudService } from "../src/server/services/fraud";

async function testFraudService() {
  console.log("🧪 Testing Fraud Service Basic Functionality");
  console.log("=".repeat(50));

  try {
    // Test basic fraud evaluation
    const context = {
      uid: "test_user_123",
      subjectType: "order" as const,
      subjectId: "order_test_001",
      ipHash: "test_ip_hash",
      deviceHash: "test_device_hash",
      country: "SG",
      emailDomain: "gmail.com",
    };

    console.log("Testing fraud evaluation...");
    const result = await fraudService.evaluateFraud(context);

    console.log("✅ Fraud evaluation completed");
    console.log(`   Allowed: ${result.allowed}`);
    console.log(`   Verdict: ${result.decision.verdict}`);
    console.log(`   Score: ${result.decision.score}`);
    console.log(`   Processing time: ${result.processingMs}ms`);
    console.log(`   Reasons: ${result.decision.reasons.join(", ")}`);

    return true;
  } catch (error) {
    console.error("❌ Fraud service test failed:", error);
    return false;
  }
}

// Run test
if (require.main === module) {
  testFraudService()
    .then((success) => {
      if (success) {
        console.log("\n🎉 Basic fraud service test passed!");
        process.exit(0);
      } else {
        console.log("\n❌ Basic fraud service test failed!");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Test execution error:", error);
      process.exit(1);
    });
}
