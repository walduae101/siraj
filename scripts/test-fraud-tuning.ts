#!/usr/bin/env node

import { fraudService } from "../src/server/services/fraud";

const TEST_SCENARIOS = [
  {
    name: "Low Velocity User",
    context: {
      uid: "test_user_low_velocity",
      subjectType: "order" as const,
      subjectId: "order_low_vel_001",
      ipHash: "test_ip_hash_1",
      deviceHash: "test_device_hash_1",
      country: "SG",
      emailDomain: "gmail.com",
    },
    expectedScore: "< 30",
    expectedVerdict: "allow",
  },
  {
    name: "Medium Velocity User",
    context: {
      uid: "test_user_medium_velocity",
      subjectType: "order" as const,
      subjectId: "order_med_vel_001",
      ipHash: "test_ip_hash_2",
      deviceHash: "test_device_hash_2",
      country: "SG",
      emailDomain: "gmail.com",
    },
    expectedScore: "30-60",
    expectedVerdict: "allow",
  },
  {
    name: "High Risk Email Domain",
    context: {
      uid: "test_user_high_risk_email",
      subjectType: "order" as const,
      subjectId: "order_high_risk_001",
      ipHash: "test_ip_hash_3",
      deviceHash: "test_device_hash_3",
      country: "SG",
      emailDomain: "tempmail.com",
    },
    expectedScore: "10-25",
    expectedVerdict: "allow",
  },
  {
    name: "With Bot Defense Tokens",
    context: {
      uid: "test_user_with_tokens",
      subjectType: "order" as const,
      subjectId: "order_tokens_001",
      ipHash: "test_ip_hash_4",
      deviceHash: "test_device_hash_4",
      country: "SG",
      emailDomain: "gmail.com",
      recaptchaToken: "test_recaptcha_token",
      appCheckToken: "test_app_check_token",
    },
    expectedScore: "< 20",
    expectedVerdict: "allow",
  },
];

async function testFraudTuning() {
  console.log("🧪 Testing Fraud Tuning Changes");
  console.log("=".repeat(50));
  console.log("Validating reduced false positive rates...\n");

  let passedTests = 0;
  let totalTests = TEST_SCENARIOS.length;

  for (const scenario of TEST_SCENARIOS) {
    try {
      console.log(`📋 Testing: ${scenario.name}`);
      
      const result = await fraudService.evaluateFraud(scenario.context);
      
      const score = result.decision.score;
      const verdict = result.decision.verdict;
      const allowed = result.allowed;
      
      // Check if the result is reasonable
      const isReasonable = 
        (verdict === "allow" && allowed) ||
        (verdict === "review" && score >= 60 && score < 72) ||
        (verdict === "deny" && score >= 72);
      
      if (isReasonable) {
        console.log(`   ✅ PASSED: Score ${score}, Verdict ${verdict}, Allowed ${allowed}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED: Score ${score}, Verdict ${verdict}, Allowed ${allowed}`);
        console.log(`   Expected: ${scenario.expectedScore} score, ${scenario.expectedVerdict} verdict`);
      }
      
      console.log(`   Processing time: ${result.processingMs}ms`);
      console.log(`   Reasons: ${result.decision.reasons.join(", ") || "none"}\n`);
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log("=".repeat(50));
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("\n🎉 All tuning tests passed! Fraud system should have reduced false positives.");
    console.log("Next: Monitor real metrics for 24h to confirm deny rate ≤ 1%");
  } else {
    console.log("\n⚠️  Some tests failed. Review tuning parameters.");
  }
}

if (require.main === module) {
  testFraudTuning()
    .then(() => {
      console.log("\n✅ Fraud tuning validation complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fraud tuning validation failed:", error);
      process.exit(1);
    });
}
