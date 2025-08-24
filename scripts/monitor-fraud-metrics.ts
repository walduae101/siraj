#!/usr/bin/env node

import { getDb } from "../src/server/firebase/admin-lazy";

interface FraudMetrics {
  totalDecisions: number;
  allowCount: number;
  denyCount: number;
  reviewCount: number;
  denyRate: number;
  avgScore: number;
  p95Score: number;
  rateLimitBlocks: number;
  avgProcessingMs: number;
  p95ProcessingMs: number;
}

async function getFraudMetrics(hours = 24): Promise<FraudMetrics> {
  const db = await getDb();
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get risk decisions from the last N hours
  const decisionsSnapshot = await db
    .collection("riskDecisions")
    .where("createdAt", ">=", cutoffTime)
    .get();

  const decisions = decisionsSnapshot.docs.map((doc) => doc.data());

  if (decisions.length === 0) {
    return {
      totalDecisions: 0,
      allowCount: 0,
      denyCount: 0,
      reviewCount: 0,
      denyRate: 0,
      avgScore: 0,
      p95Score: 0,
      rateLimitBlocks: 0,
      avgProcessingMs: 0,
      p95ProcessingMs: 0,
    };
  }

  // Calculate basic counts
  const allowCount = decisions.filter((d) => d.verdict === "allow").length;
  const denyCount = decisions.filter((d) => d.verdict === "deny").length;
  const reviewCount = decisions.filter((d) => d.verdict === "review").length;
  const totalDecisions = decisions.length;
  const denyRate = (denyCount / totalDecisions) * 100;

  // Calculate score statistics
  const scores = decisions.map((d) => d.score).sort((a, b) => a - b);
  const avgScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const p95Index = Math.floor(scores.length * 0.95);
  const p95Score = scores[p95Index] || 0;

  // Calculate processing time statistics
  const processingTimes = decisions
    .map((d) => d.processingMs)
    .sort((a, b) => a - b);
  const avgProcessingMs =
    processingTimes.reduce((sum, time) => sum + time, 0) /
    processingTimes.length;
  const p95ProcessingIndex = Math.floor(processingTimes.length * 0.95);
  const p95ProcessingMs = processingTimes[p95ProcessingIndex] || 0;

  // Count rate limit blocks
  const rateLimitBlocks = decisions.filter((d) =>
    d.reasons?.some((r: string) => r.includes("rate_limit")),
  ).length;

  return {
    totalDecisions,
    allowCount,
    denyCount,
    reviewCount,
    denyRate,
    avgScore,
    p95Score,
    rateLimitBlocks,
    avgProcessingMs,
    p95ProcessingMs,
  };
}

async function monitorFraudMetrics() {
  console.log("📊 Fraud Metrics Monitor");
  console.log("=".repeat(50));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("Monitoring last 24 hours...\n");

  try {
    const metrics = await getFraudMetrics(24);

    console.log("📈 Current Metrics:");
    console.log(`   Total Decisions: ${metrics.totalDecisions}`);
    console.log(
      `   Allow: ${metrics.allowCount} (${((metrics.allowCount / metrics.totalDecisions) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Deny: ${metrics.denyCount} (${metrics.denyRate.toFixed(1)}%)`,
    );
    console.log(
      `   Review: ${metrics.reviewCount} (${((metrics.reviewCount / metrics.totalDecisions) * 100).toFixed(1)}%)`,
    );
    console.log(`   Rate Limit Blocks: ${metrics.rateLimitBlocks}`);
    console.log("");

    console.log("📊 Performance:");
    console.log(`   Average Score: ${metrics.avgScore.toFixed(1)}`);
    console.log(`   P95 Score: ${metrics.p95Score.toFixed(1)}`);
    console.log(
      `   Average Processing: ${metrics.avgProcessingMs.toFixed(0)}ms`,
    );
    console.log(`   P95 Processing: ${metrics.p95ProcessingMs.toFixed(0)}ms`);
    console.log("");

    // Enforce mode readiness check
    console.log("🎯 Enforce Mode Readiness:");
    const denyRateReady = metrics.denyRate <= 1.0;
    const processingReady = metrics.p95ProcessingMs <= 150;
    const webhookReady = metrics.p95ProcessingMs <= 250;

    console.log(
      `   Deny Rate ≤ 1.0%: ${denyRateReady ? "✅" : "❌"} (${metrics.denyRate.toFixed(1)}%)`,
    );
    console.log(
      `   Fraud Eval p95 ≤ 150ms: ${processingReady ? "✅" : "❌"} (${metrics.p95ProcessingMs.toFixed(0)}ms)`,
    );
    console.log(
      `   Webhook p95 ≤ 250ms: ${webhookReady ? "✅" : "❌"} (${metrics.p95ProcessingMs.toFixed(0)}ms)`,
    );

    const allReady = denyRateReady && processingReady && webhookReady;
    console.log(`   Overall Status: ${allReady ? "🟢 READY" : "🔴 NOT READY"}`);

    if (allReady) {
      console.log("\n🎉 READY FOR ENFORCE MODE!");
      console.log("   All metrics are within acceptable ranges.");
      console.log('   Proceed with FRAUD_MODE="enforce" configuration change.');
    } else {
      console.log("\n⚠️  NOT READY FOR ENFORCE MODE");
      if (!denyRateReady) {
        console.log(
          `   - Deny rate (${metrics.denyRate.toFixed(1)}%) is above 1.0% target`,
        );
        console.log("   - Consider further tuning of fraud scoring weights");
      }
      if (!processingReady) {
        console.log(
          `   - Fraud evaluation p95 (${metrics.p95ProcessingMs.toFixed(0)}ms) is above 150ms target`,
        );
        console.log("   - Consider optimizing fraud evaluation performance");
      }
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (metrics.denyRate > 2.0) {
      console.log(
        "   - Deny rate is high (>2%). Consider increasing thresholds or reducing signal weights.",
      );
    } else if (metrics.denyRate > 1.0) {
      console.log(
        "   - Deny rate is moderate (>1%). Monitor for another 12-24 hours.",
      );
    } else {
      console.log("   - Deny rate is acceptable. Continue monitoring.");
    }

    if (metrics.rateLimitBlocks > 0) {
      console.log(
        `   - Rate limit blocks detected (${metrics.rateLimitBlocks}). Monitor for patterns.`,
      );
    }
  } catch (error) {
    console.error("❌ Error monitoring fraud metrics:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  monitorFraudMetrics()
    .then(() => {
      console.log("\n✅ Fraud metrics monitoring complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fraud metrics monitoring failed:", error);
      process.exit(1);
    });
}
