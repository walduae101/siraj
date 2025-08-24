#!/usr/bin/env node

import { PubSub } from "@google-cloud/pubsub";
import { getDb } from "../src/server/firebase/admin-lazy.js";

interface DLQMessage {
  messageId: string;
  data: string;
  attributes: Record<string, string>;
  publishTime: string;
  errorClass: string;
  errorReason: string;
}

interface ErrorSummary {
  errorClass: string;
  count: number;
  examples: string[];
  isTransient: boolean;
  autoReplay: boolean;
}

class DLQTriageJob {
  private pubsub: PubSub;
  private db: any;

  constructor() {
    this.pubsub = new PubSub();
    this.db = null;
  }

  async run() {
    console.log("🔍 Starting DLQ Triage Job");
    console.log("=".repeat(60));
    console.log(`Start Time: ${new Date().toISOString()}`);

    try {
      this.db = await getDb();
      await this.initializeDb();

      const dlqMessages = await this.getDLQMessages();
      const errorSummary = await this.analyzeErrors(dlqMessages);

      await this.createTriageReport(errorSummary);
      await this.autoReplayTransientErrors(dlqMessages, errorSummary);

      console.log("✅ DLQ Triage Job completed successfully");
    } catch (error) {
      console.error("❌ DLQ Triage Job failed:", error);
      throw error;
    }
  }

  private async initializeDb() {
    // Ensure the triage collection exists
    const triageRef = this.db.collection("dlqTriage");
    await triageRef.doc("config").set(
      {
        lastRun: new Date().toISOString(),
        version: "1.0",
      },
      { merge: true },
    );
  }

  private async getDLQMessages(): Promise<DLQMessage[]> {
    console.log("📥 Fetching DLQ messages...");

    // For now, return empty array since DLQ subscription may not exist
    // TODO: Implement proper DLQ message retrieval when subscription is created
    console.log("⚠️  DLQ message retrieval not implemented - subscription may not exist");
    return [];
  }

  private classifyError(attributes: Record<string, string>): string {
    const errorReason = attributes.error_reason || "";
    const deliveryAttempt = Number.parseInt(
      attributes.delivery_attempt || "1",
      10,
    );

    // Classify based on error patterns
    if (errorReason.includes("timeout") || errorReason.includes("deadline")) {
      return "TIMEOUT";
    }
    if (errorReason.includes("unauthorized") || errorReason.includes("401")) {
      return "AUTH_ERROR";
    }
    if (errorReason.includes("not found") || errorReason.includes("404")) {
      return "NOT_FOUND";
    }
    if (errorReason.includes("invalid") || errorReason.includes("400")) {
      return "INVALID_DATA";
    }
    if (deliveryAttempt >= 5) {
      return "MAX_RETRIES";
    }
    if (errorReason.includes("internal") || errorReason.includes("500")) {
      return "INTERNAL_ERROR";
    }

    return "UNKNOWN";
  }

  private async analyzeErrors(messages: DLQMessage[]): Promise<ErrorSummary[]> {
    console.log("🔍 Analyzing error patterns...");

    const errorMap = new Map<string, ErrorSummary>();

    for (const message of messages) {
      const existing = errorMap.get(message.errorClass);

      if (existing) {
        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(message.errorReason);
        }
      } else {
        const isTransient = this.isTransientError(message.errorClass);
        errorMap.set(message.errorClass, {
          errorClass: message.errorClass,
          count: 1,
          examples: [message.errorReason],
          isTransient,
          autoReplay: isTransient && message.errorClass !== "MAX_RETRIES",
        });
      }
    }

    return Array.from(errorMap.values());
  }

  private isTransientError(errorClass: string): boolean {
    const transientErrors = ["TIMEOUT", "INTERNAL_ERROR"];
    return transientErrors.includes(errorClass);
  }

  private async createTriageReport(errorSummary: ErrorSummary[]) {
    console.log("📋 Creating triage report...");

    const report = {
      timestamp: new Date().toISOString(),
      totalMessages: errorSummary.reduce((sum, e) => sum + e.count, 0),
      errorClasses: errorSummary,
      newErrorClasses: await this.identifyNewErrorClasses(errorSummary),
      recommendations: this.generateRecommendations(errorSummary),
    };

    // Save to Firestore
    await this.db
      .collection("dlqTriage")
      .doc("reports")
      .collection("daily")
      .add(report);

    // Log summary
    console.log("📊 Error Summary:");
    errorSummary.forEach((error) => {
      console.log(
        `   ${error.errorClass}: ${error.count} messages (${error.isTransient ? "transient" : "permanent"})`,
      );
    });

    // Create tickets for new error classes
    const newErrors = await this.identifyNewErrorClasses(errorSummary);
    if (newErrors.length > 0) {
      console.log("🚨 New error classes detected - tickets should be created:");
      newErrors.forEach((errorClass) => {
        console.log(`   - ${errorClass}`);
      });
    }
  }

  private async identifyNewErrorClasses(
    errorSummary: ErrorSummary[],
  ): Promise<string[]> {
    const knownErrors = await this.getKnownErrorClasses();
    return errorSummary
      .map((e) => e.errorClass)
      .filter((errorClass) => !knownErrors.includes(errorClass));
  }

  private async getKnownErrorClasses(): Promise<string[]> {
    const configDoc = await this.db.collection("dlqTriage").doc("config").get();
    return configDoc.data()?.knownErrorClasses || [];
  }

  private generateRecommendations(errorSummary: ErrorSummary[]): string[] {
    const recommendations: string[] = [];

    const timeoutErrors = errorSummary.find((e) => e.errorClass === "TIMEOUT");
    if (timeoutErrors && timeoutErrors.count > 10) {
      recommendations.push(
        "Consider increasing worker timeout or scaling worker instances",
      );
    }

    const authErrors = errorSummary.find((e) => e.errorClass === "AUTH_ERROR");
    if (authErrors && authErrors.count > 5) {
      recommendations.push(
        "Investigate authentication issues - check OIDC configuration",
      );
    }

    const invalidDataErrors = errorSummary.find(
      (e) => e.errorClass === "INVALID_DATA",
    );
    if (invalidDataErrors && invalidDataErrors.count > 5) {
      recommendations.push("Review data validation - may need schema updates");
    }

    return recommendations;
  }

  private async autoReplayTransientErrors(
    messages: DLQMessage[],
    errorSummary: ErrorSummary[],
  ) {
    console.log("🔄 Auto-replaying transient errors...");

    const replayableErrors = errorSummary.filter((e) => e.autoReplay);
    if (replayableErrors.length === 0) {
      console.log("   No transient errors to replay");
      return;
    }

    const replayableClasses = new Set(
      replayableErrors.map((e) => e.errorClass),
    );
    const messagesToReplay = messages.filter((m) =>
      replayableClasses.has(m.errorClass),
    );

    console.log(
      `   Replaying ${messagesToReplay.length} transient error messages`,
    );

    const topic = this.pubsub.topic("paynow-events");
    let replayCount = 0;

    for (const message of messagesToReplay) {
      try {
        await topic.publishMessage({
          data: Buffer.from(message.data, "base64"),
          attributes: {
            ...message.attributes,
            dlq_replay: "true",
            original_message_id: message.messageId,
            replay_timestamp: new Date().toISOString(),
          },
        });
        replayCount++;
      } catch (error) {
        console.error(`Failed to replay message ${message.messageId}:`, error);
      }
    }

    console.log(`   ✅ Successfully replayed ${replayCount} messages`);
  }
}

// Run the job
async function main() {
  const job = new DLQTriageJob();
  await job.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log("\n✅ DLQ Triage Job completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ DLQ Triage Job failed:", error);
      process.exit(1);
    });
}
