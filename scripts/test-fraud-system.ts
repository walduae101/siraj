#!/usr/bin/env tsx

/**
 * Fraud System Test Suite
 *
 * Tests all fraud detection functionality including:
 * - Risk evaluation
 * - Velocity tracking
 * - List management
 * - Bot defense
 * - Manual reviews
 */

import { getConfig } from "../src/server/config";
import { getDb } from "../src/server/firebase/admin-lazy";
import { botDefenseService } from "../src/server/services/botDefense";
import { listsService } from "../src/server/services/lists";
import { riskEngine } from "../src/server/services/riskEngine";
import { velocityService } from "../src/server/services/velocity";

const config = getConfig();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class FraudSystemTester {
  private results: TestResult[] = [];
  private testUid = `test_${Date.now()}`;
  private testIp = "192.168.1.100";

  async runAllTests(): Promise<void> {
    console.log("🧪 Starting Fraud System Test Suite\n");

    await this.testVelocityTracking();
    await this.testListManagement();
    await this.testBotDefense();
    await this.testRiskEngine();
    await this.testManualReviews();
    await this.testIntegration();

    this.printResults();
  }

  private async testVelocityTracking(): Promise<void> {
    console.log("📊 Testing Velocity Tracking...");

    try {
      // Test 1: Basic velocity increment
      const input = {
        uid: this.testUid,
        ip: this.testIp,
        uaHash: "test_ua_hash",
      };

      const counts1 = await velocityService.incrementAndGetCounts(input);
      this.addResult("Velocity Basic Increment", true, {
        uid: counts1.uid,
        ip: counts1.ip,
      });

      // Test 2: Velocity limits
      const limits = await velocityService.checkVelocityLimits(input);
      this.addResult("Velocity Limits Check", true, limits);

      // Test 3: Multiple increments
      for (let i = 0; i < 3; i++) {
        await velocityService.incrementAndGetCounts(input);
      }
      const counts2 = await velocityService.getCounts(input);
      this.addResult("Velocity Multiple Increments", counts2.uid.minute === 4, {
        expected: 4,
        actual: counts2.uid.minute,
      });
    } catch (error) {
      this.addResult(
        "Velocity Tracking",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async testListManagement(): Promise<void> {
    console.log("📋 Testing List Management...");

    try {
      // Test 1: Add to denylist
      await listsService.addToDenylist({
        type: "ip",
        value: "192.168.1.200",
        reason: "Test IP",
        addedBy: "test_admin",
      });
      this.addResult("Add to Denylist", true);

      // Test 2: Check denylist
      const isDenied = await listsService.isDenied({
        type: "ip",
        value: "192.168.1.200",
      });
      this.addResult("Check Denylist", isDenied === true);

      // Test 3: Add to allowlist
      await listsService.addToAllowlist({
        type: "uid",
        value: "trusted_user_123",
        reason: "Trusted user",
        addedBy: "test_admin",
      });
      this.addResult("Add to Allowlist", true);

      // Test 4: Check allowlist
      const isAllowed = await listsService.isAllowed({
        type: "uid",
        value: "trusted_user_123",
      });
      this.addResult("Check Allowlist", isAllowed === true);

      // Test 5: Bulk check
      const bulkResult = await listsService.bulkCheck([
        { type: "ip", value: "192.168.1.200" },
        { type: "uid", value: "trusted_user_123" },
        { type: "ip", value: "192.168.1.300" },
      ]);
      this.addResult(
        "Bulk List Check",
        bulkResult.denied.length === 1 && bulkResult.allowed.length === 1,
        bulkResult,
      );

      // Cleanup
      await listsService.removeFromDenylist("ip", "192.168.1.200");
      await listsService.removeFromAllowlist("uid", "trusted_user_123");
    } catch (error) {
      this.addResult(
        "List Management",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async testBotDefense(): Promise<void> {
    console.log("🤖 Testing Bot Defense...");

    try {
      // Test 1: Basic bot defense
      const result1 = await botDefenseService.verify({
        uid: this.testUid,
        ip: this.testIp,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        recaptchaToken: "test_token_123",
        appCheckToken: "test_app_check_123",
      });
      this.addResult(
        "Bot Defense Basic",
        result1.isHuman !== undefined,
        result1,
      );

      // Test 2: Bot detection
      const result2 = await botDefenseService.verify({
        uid: this.testUid,
        ip: this.testIp,
        userAgent: "python-requests/2.28.1",
      });
      this.addResult("Bot Detection", result2.confidence < 50, {
        confidence: result2.confidence,
        reasons: result2.reasons,
      });

      // Test 3: Cache functionality
      const result3 = await botDefenseService.verify({
        uid: this.testUid,
        ip: this.testIp,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });
      this.addResult("Bot Defense Cache", result3.cached === true, result3);
    } catch (error) {
      this.addResult(
        "Bot Defense",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async testRiskEngine(): Promise<void> {
    console.log("🎯 Testing Risk Engine...");

    try {
      // Test 1: Basic risk evaluation
      const decision1 = await riskEngine.evaluateCheckout({
        uid: this.testUid,
        email: "test@example.com",
        ip: this.testIp,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        accountAgeMinutes: 60,
        orderIntent: {
          productId: "test_product",
          quantity: 1,
          price: 10,
        },
      });
      this.addResult(
        "Risk Engine Basic",
        decision1.action && decision1.score !== undefined,
        decision1,
      );

      // Test 2: High-risk scenario
      const decision2 = await riskEngine.evaluateCheckout({
        uid: this.testUid,
        email: "test@example.com",
        ip: this.testIp,
        userAgent: "python-requests/2.28.1",
        accountAgeMinutes: 5, // New account
        orderIntent: {
          productId: "test_product",
          quantity: 10,
          price: 1000, // High value
        },
      });
      this.addResult("Risk Engine High Risk", decision2.score > 50, {
        score: decision2.score,
        action: decision2.action,
        reasons: decision2.reasons,
      });

      // Test 3: Statistics
      const stats = await riskEngine.getDecisionStats(1);
      this.addResult(
        "Risk Engine Stats",
        stats.total > 0 && stats.avgScore !== undefined,
        stats,
      );
    } catch (error) {
      this.addResult(
        "Risk Engine",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async testManualReviews(): Promise<void> {
    console.log("📝 Testing Manual Reviews...");

    try {
      const db = await getDb();

      // Test 1: Create manual review
      const reviewId = `test_review_${Date.now()}`;
      await db
        .collection("manualReviews")
        .doc(reviewId)
        .set({
          decisionId: "test_decision_123",
          uid: this.testUid,
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
          decision: {
            action: "queue_review",
            score: 85,
            reasons: ["high_velocity", "new_account"],
          },
          checkout: {
            productId: "test_product",
            quantity: 1,
            price: 50,
          },
          requiresReversal: false,
        });
      this.addResult("Create Manual Review", true);

      // Test 2: Get recent decisions
      const recentDecisions = await riskEngine.getRecentDecisions(
        this.testUid,
        5,
      );
      this.addResult("Get Recent Decisions", Array.isArray(recentDecisions), {
        count: recentDecisions.length,
      });

      // Cleanup
      await db.collection("manualReviews").doc(reviewId).delete();
    } catch (error) {
      this.addResult(
        "Manual Reviews",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async testIntegration(): Promise<void> {
    console.log("🔗 Testing Integration...");

    try {
      // Test 1: Full checkout flow simulation
      const decision = await riskEngine.evaluateCheckout({
        uid: this.testUid,
        email: "test@example.com",
        ip: this.testIp,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        accountAgeMinutes: 30,
        orderIntent: {
          productId: "test_product",
          quantity: 2,
          price: 25,
        },
        recaptchaToken: "test_recaptcha",
        appCheckToken: "test_app_check",
      });

      this.addResult(
        "Integration Full Flow",
        decision.action &&
          decision.score !== undefined &&
          decision.reasons.length > 0,
        {
          action: decision.action,
          score: decision.score,
          reasons: decision.reasons,
          confidence: decision.confidence,
        },
      );

      // Test 2: Configuration validation
      const fraudConfig = (await config).fraud;
      this.addResult(
        "Configuration Validation",
        fraudConfig.checkoutCaps.uid.perMinute > 0 &&
          fraudConfig.riskThresholds.allow < fraudConfig.riskThresholds.deny,
        {
          caps: fraudConfig.checkoutCaps,
          thresholds: fraudConfig.riskThresholds,
        },
      );
    } catch (error) {
      this.addResult(
        "Integration",
        false,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private addResult(
    name: string,
    passed: boolean,
    details?: any,
    error?: string,
  ): void {
    this.results.push({
      name,
      passed,
      error,
      details,
    });
  }

  private printResults(): void {
    console.log("\n📋 Test Results Summary");
    console.log("=".repeat(50));

    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;

    this.results.forEach((result, index) => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${index + 1}. ${result.name}`);

      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });

    console.log(`\n${"=".repeat(50)}`);
    console.log(
      `🎯 Overall: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`,
    );

    if (passed === total) {
      console.log("🎉 All tests passed! Fraud system is working correctly.");
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.");
      process.exit(1);
    }
  }

  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    try {
      const db = await getDb();

      // Clean up test velocity data
      const dateKey =
        new Date().toISOString().split("T")[0]?.replace(/-/g, "") || "";
      await db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(this.testUid)
        .doc("counters")
        .delete();
      await db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(this.testIp)
        .doc("counters")
        .delete();

      // Clean up test risk decisions
      const decisions = await db
        .collection("riskDecisions")
        .where("metadata.uid", "==", this.testUid)
        .get();

      const batch = db.batch();
      for (const doc of decisions.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();

      console.log("✅ Test data cleaned up successfully");
    } catch (error) {
      console.log("⚠️  Cleanup failed:", error);
    }
  }
}

// Main execution
async function main() {
  const tester = new FraudSystemTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
