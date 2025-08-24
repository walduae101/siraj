import crypto from "node:crypto";
import { getConfig } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { botDefenseService } from "./botDefense";
import { listsService } from "./lists";
import { velocityService } from "./velocity";

export interface RiskInput {
  uid: string;
  email: string;
  ip: string;
  userAgent: string;
  accountAgeMinutes: number;
  orderIntent: {
    productId: string;
    quantity: number;
    price: number;
  };
  country?: string;
  paynowCustomerId?: string;
  recaptchaToken?: string;
  appCheckToken?: string;
}

export interface RiskDecision {
  id: string;
  action: "allow" | "challenge" | "deny" | "queue_review";
  score: number;
  reasons: string[];
  confidence: number;
  metadata: {
    uid: string;
    ip: string;
    orderId?: string;
    velocity: any;
    botDefense: any;
    lists: any;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export interface RiskSignal {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

export class RiskEngine {
  private config: any = null;

  /**
   * Evaluate risk for a checkout attempt
   */
  async evaluateCheckout(input: RiskInput): Promise<RiskDecision> {
    const startTime = Date.now();
    const decisionId = this.generateDecisionId();

    try {
      // 1. Check allow/deny lists first (fastest)
      const listChecks = await this.checkLists(input);
      if (listChecks.denied.length > 0) {
        return await this.createDecision({
          id: decisionId,
          action: "deny",
          score: 100,
          reasons: listChecks.denied.map(
            (d) => `denylist_${d.type}_${d.value}`,
          ),
          confidence: 100,
          metadata: {
            uid: input.uid,
            ip: input.ip,
            velocity: null,
            botDefense: null,
            lists: listChecks,
          },
          createdAt: new Date(),
        });
      }

      if (listChecks.allowed.length > 0) {
        return await this.createDecision({
          id: decisionId,
          action: "allow",
          score: 0,
          reasons: listChecks.allowed.map(
            (d) => `allowlist_${d.type}_${d.value}`,
          ),
          confidence: 100,
          metadata: {
            uid: input.uid,
            ip: input.ip,
            velocity: null,
            botDefense: null,
            lists: listChecks,
          },
          createdAt: new Date(),
        });
      }

      // 2. Run velocity checks
      const velocityInput = {
        uid: input.uid,
        ip: input.ip,
        uaHash: this.hashUserAgent(input.userAgent),
      };
      const velocityCounts =
        await velocityService.incrementAndGetCounts(velocityInput);
      const velocityLimits =
        await velocityService.checkVelocityLimits(velocityInput);

      // 3. Run bot defense checks
      const botDefenseResult = await botDefenseService.verify({
        uid: input.uid,
        ip: input.ip,
        userAgent: input.userAgent,
        recaptchaToken: input.recaptchaToken,
        appCheckToken: input.appCheckToken,
      });

      // 4. Calculate risk score
      const signals = await this.calculateRiskSignals(
        input,
        velocityCounts,
        velocityLimits,
        botDefenseResult,
      );
      const score = this.calculateWeightedScore(signals);
      const action = await this.determineAction(score);

      // 5. Create and persist decision
      const decision = await this.createDecision({
        id: decisionId,
        action,
        score,
        reasons: signals.map((s) => s.reason),
        confidence: this.calculateConfidence(signals),
        metadata: {
          uid: input.uid,
          ip: input.ip,
          velocity: { counts: velocityCounts, limits: velocityLimits },
          botDefense: botDefenseResult,
          lists: listChecks,
        },
        createdAt: new Date(),
      });

      // 6. Log structured log
      this.logRiskDecision(decision, input, Date.now() - startTime);

      return decision;
    } catch (error) {
      console.error("Risk evaluation error:", error);

      // On error, create a safe decision
      return await this.createDecision({
        id: decisionId,
        action: "queue_review",
        score: 50,
        reasons: ["risk_evaluation_error"],
        confidence: 0,
        metadata: {
          uid: input.uid,
          ip: input.ip,
          velocity: null,
          botDefense: null,
          lists: null,
        },
        createdAt: new Date(),
      });
    }
  }

  /**
   * Calculate individual risk signals
   */
  private async calculateRiskSignals(
    input: RiskInput,
    velocityCounts: any,
    velocityLimits: any,
    botDefenseResult: any,
  ): Promise<RiskSignal[]> {
    const signals: RiskSignal[] = [];

    // Load config if not loaded
    if (!this.config) {
      this.config = await getConfig();
    }
    const config = this.config.fraud;

    // 1. Velocity signals
    if (velocityLimits.uidExceeded) {
      signals.push({
        name: "velocity_uid_exceeded",
        weight: 30,
        score: 100,
        reason: "uid_velocity_limit_exceeded",
      });
    }

    if (velocityLimits.ipExceeded) {
      signals.push({
        name: "velocity_ip_exceeded",
        weight: 25,
        score: 100,
        reason: "ip_velocity_limit_exceeded",
      });
    }

    // High velocity but not exceeded
    const uidVelocityRatio =
      velocityCounts.uid.minute / config.checkoutCaps.uid.perMinute;
    if (uidVelocityRatio > 0.8) {
      signals.push({
        name: "velocity_uid_high",
        weight: 15,
        score: Math.min(80, uidVelocityRatio * 100),
        reason: "uid_velocity_high",
      });
    }

    // 2. Account age signals
    if (input.accountAgeMinutes < config.minAccountAgeMinutes) {
      signals.push({
        name: "new_account",
        weight: 20,
        score: Math.max(50, 100 - input.accountAgeMinutes * 2),
        reason: "new_account",
      });
    }

    // 3. Bot defense signals
    if (!botDefenseResult.isHuman) {
      signals.push({
        name: "bot_detected",
        weight: 40,
        score: 100 - botDefenseResult.confidence,
        reason: "bot_detected",
      });
    }

    if (botDefenseResult.confidence < 30) {
      signals.push({
        name: "low_bot_confidence",
        weight: 25,
        score: 80,
        reason: "low_bot_confidence",
      });
    }

    // 4. Order value signals
    const orderValue = input.orderIntent.price * input.orderIntent.quantity;
    if (orderValue > 100) {
      signals.push({
        name: "high_value_order",
        weight: 10,
        score: Math.min(60, orderValue / 10),
        reason: "high_value_order",
      });
    }

    // 5. Geographic signals (if available)
    if (input.country && input.country !== "SG") {
      signals.push({
        name: "non_local_country",
        weight: 15,
        score: 40,
        reason: "non_local_country",
      });
    }

    // 6. User agent signals
    const ua = input.userAgent.toLowerCase();
    if (ua.includes("headless") || ua.includes("phantom")) {
      signals.push({
        name: "suspicious_user_agent",
        weight: 30,
        score: 90,
        reason: "suspicious_user_agent",
      });
    }

    return signals;
  }

  /**
   * Calculate weighted risk score
   */
  private calculateWeightedScore(signals: RiskSignal[]): number {
    if (signals.length === 0) return 0;

    const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
    const weightedSum = signals.reduce(
      (sum, signal) => sum + signal.score * signal.weight,
      0,
    );

    return Math.min(100, weightedSum / totalWeight);
  }

  /**
   * Determine action based on score and thresholds
   */
  private async determineAction(
    score: number,
  ): Promise<"allow" | "challenge" | "deny" | "queue_review"> {
    // Load config if not loaded
    if (!this.config) {
      this.config = await getConfig();
    }
    const thresholds = this.config.fraud.riskThresholds;

    if (score <= thresholds.allow) return "allow";
    if (score <= thresholds.challenge) return "challenge";
    if (score <= thresholds.deny) return "deny";
    return "queue_review";
  }

  /**
   * Calculate confidence based on signal quality
   */
  private calculateConfidence(signals: RiskSignal[]): number {
    if (signals.length === 0) return 100;

    // Higher confidence with more signals and higher weights
    const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
    const avgWeight = totalWeight / signals.length;

    return Math.min(100, Math.max(0, avgWeight));
  }

  /**
   * Check allow/deny lists
   */
  private async checkLists(
    input: RiskInput,
  ): Promise<{ denied: any[]; allowed: any[] }> {
    const emailDomain = input.email.split("@")[1];
    const queries = [
      { type: "uid" as const, value: input.uid },
      { type: "ip" as const, value: input.ip },
      ...(emailDomain
        ? [{ type: "emailDomain" as const, value: emailDomain }]
        : []),
    ];

    return await listsService.bulkCheck(queries);
  }

  /**
   * Create and persist risk decision
   */
  private async createDecision(decision: RiskDecision): Promise<RiskDecision> {
    const db = await getDb();
    const data: any = {
      action: decision.action,
      score: decision.score,
      reasons: decision.reasons,
      confidence: decision.confidence,
      metadata: decision.metadata,
      createdAt: decision.createdAt,
    };

    // Only include expiresAt if it's defined
    if (decision.expiresAt) {
      data.expiresAt = decision.expiresAt;
    }

    await db.collection("riskDecisions").doc(decision.id).set(data);

    return decision;
  }

  /**
   * Log structured risk decision
   */
  private logRiskDecision(
    decision: RiskDecision,
    input: RiskInput,
    durationMs: number,
  ): void {
    console.log(
      JSON.stringify({
        component: "fraud",
        level: "info",
        message: "Risk decision made",
        decisionId: decision.id,
        uid: input.uid,
        ip: input.ip,
        action: decision.action,
        score: decision.score,
        reasons: decision.reasons,
        confidence: decision.confidence,
        durationMs,
        orderValue: input.orderIntent.price * input.orderIntent.quantity,
        accountAgeMinutes: input.accountAgeMinutes,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `risk_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Hash user agent for privacy
   */
  private hashUserAgent(userAgent: string): string {
    return crypto
      .createHash("sha256")
      .update(userAgent)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Get recent decisions for a user
   */
  async getRecentDecisions(uid: string, limit = 10): Promise<RiskDecision[]> {
    const db = await getDb();
    const snapshot = await db
      .collection("riskDecisions")
      .where("metadata.uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      action: doc.data().action,
      score: doc.data().score,
      reasons: doc.data().reasons,
      confidence: doc.data().confidence,
      metadata: doc.data().metadata,
      createdAt: doc.data().createdAt.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
    }));
  }

  /**
   * Get decision statistics
   */
  async getDecisionStats(days = 1): Promise<{
    total: number;
    byAction: Record<string, number>;
    avgScore: number;
  }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const db = await getDb();
    const snapshot = await db
      .collection("riskDecisions")
      .where("createdAt", ">=", cutoff)
      .get();

    const decisions = snapshot.docs.map((doc: any) => doc.data());
    const byAction: Record<string, number> = {};
    let totalScore = 0;

    decisions.forEach((decision: any) => {
      byAction[decision.action] = (byAction[decision.action] || 0) + 1;
      totalScore += decision.score;
    });

    return {
      total: decisions.length,
      byAction,
      avgScore: decisions.length > 0 ? totalScore / decisions.length : 0,
    };
  }
}

export const riskEngine = new RiskEngine();
