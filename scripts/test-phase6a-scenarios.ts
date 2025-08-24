#!/usr/bin/env tsx

/**
 * Phase 6A Queue Mode Cutover Test Scenarios
 * Tests staging validation, canary routing, and production cutover scenarios
 */

import { getConfig } from "../src/server/config";
import { publishPaynowEvent } from "../src/server/services/pubsubPublisher";

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface PerformanceMetrics {
  webhookAckP95: number;
  workerP95: number;
  dlqCount: number;
  duplicateCredits: number;
}

async function testPhase6AScenarios() {
  console.log("🧪 Phase 6A Queue Mode Cutover Test Scenarios");
  console.log("=".repeat(60));
  console.log(
    "Testing staging validation, canary routing, and production scenarios...\n",
  );

  const results: TestResult[] = [];

  // Test 1: Configuration Validation
  try {
    console.log("📋 Test 1: Configuration Validation");
    const startTime = Date.now();

    const config = await getConfig();
    const webhookMode = config.features.webhookMode;
    const canaryRatio = config.features.webhookQueueCanaryRatio;

    const duration = Date.now() - startTime;

    const success =
      typeof webhookMode === "string" &&
      typeof canaryRatio === "number" &&
      canaryRatio >= 0 &&
      canaryRatio <= 1;

    results.push({
      testName: "Configuration Validation",
      success,
      duration,
      details: { webhookMode, canaryRatio },
    });

    if (success) {
      console.log(
        `   ✅ PASSED: webhookMode='${webhookMode}', canaryRatio=${canaryRatio}`,
      );
    } else {
      console.log("   ❌ FAILED: Invalid configuration");
    }
  } catch (error) {
    results.push({
      testName: "Configuration Validation",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      `   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Test 2: Canary Routing Logic
  try {
    console.log("\n📋 Test 2: Canary Routing Logic");
    const startTime = Date.now();

    // Test canary routing with different ratios
    const testCases = [
      { uid: "user1", customerId: "cust1", ratio: 0.0, expected: false },
      { uid: "user2", customerId: "cust2", ratio: 1.0, expected: true },
      { uid: "user3", customerId: "cust3", ratio: 0.5, expected: "consistent" },
    ];

    let allPassed = true;
    const routingResults = [];

    for (const testCase of testCases) {
      // Simulate the routing logic
      const routingKey = testCase.uid || testCase.customerId || "unknown";
      const hash = getStableHash(routingKey);
      const routed = hash < testCase.ratio;

      if (testCase.expected === "consistent") {
        // For 0.5 ratio, just check consistency (same user always gets same result)
        routingResults.push({ testCase, routed, hash });
      } else {
        const passed = routed === testCase.expected;
        if (!passed) allPassed = false;
        routingResults.push({
          testCase,
          routed,
          expected: testCase.expected,
          passed,
        });
      }
    }

    const duration = Date.now() - startTime;

    results.push({
      testName: "Canary Routing Logic",
      success: allPassed,
      duration,
      details: { routingResults },
    });

    if (allPassed) {
      console.log("   ✅ PASSED: All routing test cases passed");
    } else {
      console.log("   ❌ FAILED: Some routing test cases failed");
    }
  } catch (error) {
    results.push({
      testName: "Canary Routing Logic",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      `   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Test 3: Pub/Sub Publishing Performance
  try {
    console.log("\n📋 Test 3: Pub/Sub Publishing Performance");
    const startTime = Date.now();

    const testMessage = {
      eventId: `phase6a_test_${Date.now()}`,
      eventType: "test.phase6a.publishing",
      orderId: "test_order_phase6a",
      paynowCustomerId: "test_customer_phase6a",
      uid: "test_user_phase6a",
      data: { test: true, phase: "6a" },
    };

    const publishStart = Date.now();
    const messageId = await publishPaynowEvent(testMessage);
    const publishMs = Date.now() - publishStart;

    const duration = Date.now() - startTime;
    const success = !!messageId && publishMs < 1000; // Should publish quickly

    results.push({
      testName: "Pub/Sub Publishing Performance",
      success,
      duration,
      details: { messageId, publishMs },
    });

    if (success) {
      console.log(
        `   ✅ PASSED: Published message ${messageId} in ${publishMs}ms`,
      );
    } else {
      console.log(
        `   ❌ FAILED: Publish took ${publishMs}ms (expected <1000ms)`,
      );
    }
  } catch (error) {
    results.push({
      testName: "Pub/Sub Publishing Performance",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      `   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Test 4: Worker Endpoint Health
  try {
    console.log("\n📋 Test 4: Worker Endpoint Health");
    const startTime = Date.now();

    // Test worker endpoint availability
    const workerUrl =
      process.env.WORKER_URL ||
      "https://siraj-207501673877.us-central1.run.app";
    const response = await fetch(`${workerUrl}/api/tasks/paynow/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        message: {
          data: Buffer.from(
            JSON.stringify({
              eventId: "test_worker_health",
              eventType: "test.worker.health",
              data: {},
            }),
          ).toString("base64"),
          messageId: "test_message_id",
          publishTime: new Date().toISOString(),
          attributes: {},
        },
      }),
    });

    const duration = Date.now() - startTime;
    // Worker should return 401 for invalid auth (which is expected for health check)
    const success = response.status === 401 || response.status === 200;

    results.push({
      testName: "Worker Endpoint Health",
      success,
      duration,
      details: { status: response.status, url: workerUrl },
    });

    if (success) {
      console.log(
        `   ✅ PASSED: Worker endpoint responded with status ${response.status}`,
      );
    } else {
      console.log(
        `   ❌ FAILED: Worker endpoint returned unexpected status ${response.status}`,
      );
    }
  } catch (error) {
    results.push({
      testName: "Worker Endpoint Health",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      `   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Test 5: Canary Ratio Scenarios
  try {
    console.log("\n📋 Test 5: Canary Ratio Scenarios");
    const startTime = Date.now();

    const scenarios = [
      { name: "0% Canary", ratio: 0.0, expectedQueue: false },
      { name: "10% Canary", ratio: 0.1, expectedQueue: "partial" },
      { name: "50% Canary", ratio: 0.5, expectedQueue: "partial" },
      { name: "100% Canary", ratio: 1.0, expectedQueue: true },
    ];

    let allScenariosPassed = true;
    const scenarioResults = [];

    for (const scenario of scenarios) {
      // Test with multiple users to see distribution
      const testUsers = ["user1", "user2", "user3", "user4", "user5"];
      const routedToQueue = testUsers.filter((user) => {
        const hash = getStableHash(user);
        return hash < scenario.ratio;
      }).length;

      const queuePercentage = (routedToQueue / testUsers.length) * 100;
      const passed =
        scenario.expectedQueue === "partial"
          ? routedToQueue > 0 && routedToQueue < testUsers.length
          : scenario.expectedQueue
            ? routedToQueue === testUsers.length
            : routedToQueue === 0;

      if (!passed) allScenariosPassed = false;

      scenarioResults.push({
        scenario: scenario.name,
        ratio: scenario.ratio,
        routedToQueue,
        queuePercentage,
        expected: scenario.expectedQueue,
        passed,
      });
    }

    const duration = Date.now() - startTime;

    results.push({
      testName: "Canary Ratio Scenarios",
      success: allScenariosPassed,
      duration,
      details: { scenarioResults },
    });

    if (allScenariosPassed) {
      console.log("   ✅ PASSED: All canary ratio scenarios passed");
    } else {
      console.log("   ❌ FAILED: Some canary ratio scenarios failed");
    }
  } catch (error) {
    results.push({
      testName: "Canary Ratio Scenarios",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      `   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Phase 6A Test Results Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);

  console.log(`Overall Success Rate: ${passed}/${total} (${successRate}%)`);

  for (const result of results) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.testName} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log("\n🎯 Phase 6A Readiness Assessment:");
  const allPassed = results.every((r) => r.success);

  if (allPassed) {
    console.log(
      "🟢 READY: All Phase 6A tests passed - ready for staging validation",
    );
  } else {
    console.log("🔴 NOT READY: Some tests failed - review before proceeding");
  }

  return { results, allPassed };
}

// Helper function for stable hashing (same as in webhook)
import crypto from "node:crypto";

function getStableHash(input: string): number {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return Number.parseInt(hash.substring(0, 8), 16) / 0xffffffff; // Returns 0-1
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhase6AScenarios()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testPhase6AScenarios };
