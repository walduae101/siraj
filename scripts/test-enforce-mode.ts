#!/usr/bin/env node

import { fraudService } from "../src/server/services/fraud";
import { listsService } from "../src/server/services/lists";

const TEST_SCENARIOS = [
  {
    name: "Benign Purchase (Should Allow)",
    context: {
      uid: "test_user_benign_enforce",
      subjectType: "order" as const,
      subjectId: "order_benign_enforce_001",
      ipHash: "test_ip_hash_benign",
      deviceHash: "test_device_hash_benign",
      country: "SG",
      emailDomain: "gmail.com",
    },
    expectedVerdict: "allow",
    expectedAllowed: true,
    description: "Normal user should be allowed in enforce mode",
  },
  {
    name: "Denylist Hit (Should Deny)",
    context: {
      uid: "test_user_denylist_enforce",
      subjectType: "order" as const,
      subjectId: "order_denylist_enforce_001",
      ipHash: "test_ip_hash_denylist",
      deviceHash: "test_device_hash_denylist",
      country: "SG",
      emailDomain: "gmail.com",
    },
    expectedVerdict: "deny",
    expectedAllowed: false,
    description: "User on denylist should be denied in enforce mode",
    setupDenylist: true,
  },
];

async function testEnforceMode() {
  console.log("🧪 Testing Enforce Mode Functionality");
  console.log("=".repeat(50));
  console.log("Verifying fraud detection now blocks transactions...\n");

  let passedTests = 0;
  let totalTests = TEST_SCENARIOS.length;

  for (const scenario of TEST_SCENARIOS) {
    try {
      console.log(`📋 Testing: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      
      // Setup denylist if needed
      if (scenario.setupDenylist) {
        await listsService.addToDenylist({
          type: "uid",
          value: scenario.context.uid,
          reason: "Test denylist for enforce mode verification",
          notes: "Temporary test entry",
          addedBy: "test-enforce-mode-script",
        });
        console.log(`   ✅ Added ${scenario.context.uid} to denylist`);
      }
      
      const result = await fraudService.evaluateFraud(scenario.context);
      
      const score = result.decision.score;
      const verdict = result.decision.verdict;
      const allowed = result.allowed;
      const mode = result.decision.mode;
      
      // Verify the result matches expectations
      const verdictCorrect = verdict === scenario.expectedVerdict;
      const allowedCorrect = allowed === scenario.expectedAllowed;
      const modeCorrect = mode === "enforce";
      
      if (verdictCorrect && allowedCorrect && modeCorrect) {
        console.log(`   ✅ PASSED: Score ${score}, Verdict ${verdict}, Allowed ${allowed}, Mode ${mode}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED: Score ${score}, Verdict ${verdict}, Allowed ${allowed}, Mode ${mode}`);
        console.log(`   Expected: Verdict ${scenario.expectedVerdict}, Allowed ${scenario.expectedAllowed}, Mode enforce`);
      }
      
      console.log(`   Processing time: ${result.processingMs}ms`);
      console.log(`   Reasons: ${result.decision.reasons.join(", ") || "none"}\n`);
      
      // Cleanup denylist if we added it
      if (scenario.setupDenylist) {
        await listsService.removeFromDenylist("uid", scenario.context.uid);
        console.log(`   ✅ Removed ${scenario.context.uid} from denylist`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log("=".repeat(50));
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("\n🎉 Enforce mode verification successful!");
    console.log("   - Benign users are allowed");
    console.log("   - Denylist users are blocked");
    console.log("   - Mode is correctly set to 'enforce'");
    console.log("   - Fraud detection is actively protecting transactions");
  } else {
    console.log("\n⚠️  Some enforce mode tests failed. Review configuration.");
  }
}

if (require.main === module) {
  testEnforceMode()
    .then(() => {
      console.log("\n✅ Enforce mode verification complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Enforce mode verification failed:", error);
      process.exit(1);
    });
}
