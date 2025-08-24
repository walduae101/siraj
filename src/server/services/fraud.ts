import crypto from "node:crypto";
import { getConfig, getFraudConfig } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { botDefenseService } from "./botDefense";
import { type ListType, listsService } from "./lists";
import { velocityService } from "./velocity";

export interface FraudContext {
  uid: string;
  subjectType: "order" | "user" | "subscription";
  subjectId: string;
  ipHash: string;
  deviceHash: string;
  country?: string;
  emailDomain?: string;
  binHash?: string;
  paynowCustomerId?: string;
  recaptchaToken?: string;
  appCheckToken?: string;
  userAgent?: string;
}

export interface FraudSignal {
  signalId: string;
  uid: string;
  paynowCustomerId?: string;
  subjectType: "order" | "user" | "subscription";
  subjectId: string;
  ipHash: string;
  deviceHash: string;
  country?: string;
  emailDomain?: string;
  binHash?: string;
  velocityMinute: number;
  velocityHour: number;
  velocityDay: number;
  chargebacks90d: number;
  firstSeenAt: Date;
  createdAt: Date;
}

export interface RiskDecision {
  decisionId: string;
  mode: "shadow" | "enforce";
  score: number;
  verdict: "allow" | "review" | "deny";
  threshold: number;
  reasons: string[];
  subjectType: "order" | "user" | "subscription";
  subjectId: string;
  uid: string;
  linkedSignalIds: string[];
  processingMs: number;
  createdAt: Date;
  expiresAt: Date;
  canary?: boolean;
}

export interface FraudEvaluationResult {
  allowed: boolean;
  decision: RiskDecision;
  signals: FraudSignal[];
  processingMs: number;
}

export class FraudService {
  private config: any = null;

  private async getConfig() {
    if (!this.config) {
      this.config = await getFraudConfig();
    }
    return this.config;
  }

  /**
   * Evaluate fraud risk for a transaction
   */
  async evaluateFraud(
    context: FraudContext,
  ): Promise<FraudEvaluationResult> {
    const startTime = Date.now();
    const config = await this.getConfig();

    try {
      // 1% Shadow Canary - Route 1% of evaluations to shadow mode for comparison
      const canaryHash = this.generateCanaryHash(context.uid, context.subjectId);
      const isCanary = canaryHash % 100 < 1; // 1% canary rate
      const effectiveMode = isCanary ? "shadow" : config.fraud.FRAUD_MODE;

      // Check rate limits first
      const rateLimitResult = await this.checkRateLimits(context);
      if (!rateLimitResult.allowed) {
        const decision = await this.createRiskDecision({
          uid: context.uid,
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          score: 100,
          verdict: "deny",
          reasons: ["rate_limit_exceeded"],
          mode: effectiveMode,
          canary: isCanary,
          processingMs: Date.now() - startTime,
          threshold: 100,
          linkedSignalIds: [],
        });

        return {
          allowed: false,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      // Check allow/deny lists
      const listsResult = await this.checkLists(context);
      if (listsResult.verdict === "deny") {
        const decision = await this.createRiskDecision({
          uid: context.uid,
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          score: 100,
          verdict: "deny",
          reasons: [listsResult.reason],
          mode: effectiveMode,
          canary: isCanary,
          processingMs: Date.now() - startTime,
          threshold: 100,
          linkedSignalIds: [],
        });

        return {
          allowed: false,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      if (listsResult.verdict === "allow") {
        const decision = await this.createRiskDecision({
          uid: context.uid,
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          score: 0,
          verdict: "allow",
          reasons: [listsResult.reason],
          mode: effectiveMode,
          canary: isCanary,
          processingMs: Date.now() - startTime,
          threshold: 0,
          linkedSignalIds: [],
        });

        return {
          allowed: true,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      // Collect fraud signals
      const signals = await this.collectFraudSignals(context);

      // Calculate risk score
      const score = await this.calculateRiskScore(signals, context);

      // Determine verdict
      const threshold = await this.getThreshold(context.subjectType);
      const verdict = this.determineVerdict(score, threshold);
      const reasons = await this.generateReasons(signals, context, score);

      // Create decision
      const decision = await this.createRiskDecision({
        uid: context.uid,
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        score,
        verdict,
        reasons,
        mode: effectiveMode,
        canary: isCanary,
        processingMs: Date.now() - startTime,
        threshold,
        linkedSignalIds: signals.map(s => s.signalId),
      });

      // Determine if transaction should be allowed
      const allowed = effectiveMode === "shadow" || verdict === "allow";

      // Log fraud evaluation
      await this.logFraudEvaluation(context, decision, allowed, Date.now() - startTime);

      return {
        allowed,
        decision,
        signals,
        processingMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Fraud evaluation error:", error);
      
      // On error, create a decision with error information
      const decision = await this.createRiskDecision({
        uid: context.uid,
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        score: 0,
        verdict: "allow", // Default to allow on error
        reasons: ["evaluation_error"],
        mode: config.fraud.FRAUD_MODE,
        canary: false,
        processingMs: Date.now() - startTime,
        threshold: 0,
        linkedSignalIds: [],
      });

      return {
        allowed: true, // Default to allow on error
        decision,
        signals: [],
        processingMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check rate limits using velocity service
   */
  private async checkRateLimits(
    context: FraudContext,
  ): Promise<{ allowed: boolean }> {
    const config = await this.getConfig();
    const { rateLimits } = config;

    // Check IP rate limits
    const ipResult = await velocityService.incrementAndCheck(
      "ip",
      context.ipHash,
      rateLimits.perIpPerMin,
      "1m",
    );

    if (!ipResult.allowed) {
      return { allowed: false };
    }

    // Check UID rate limits
    const uidResult = await velocityService.incrementAndCheck(
      "uid",
      context.uid,
      rateLimits.perUidPerMin,
      "1m",
    );

    if (!uidResult.allowed) {
      return { allowed: false };
    }

    // Check hourly UID limits
    const uidHourResult = await velocityService.incrementAndCheck(
      "uid",
      context.uid,
      rateLimits.perUidPerHour,
      "1h",
    );

    return { allowed: uidHourResult.allowed };
  }

  /**
   * Check allow/deny lists
   */
  private async checkLists(context: FraudContext): Promise<{
    allowed: Array<{ type: string; value: string }>;
    denied: Array<{ type: string; value: string }>;
    verdict: "allow" | "deny";
    reason: string;
  }> {
    const checks: Array<{ type: ListType; value: string }> = [
      { type: "uid", value: context.uid },
      { type: "device", value: context.deviceHash },
      { type: "ip", value: context.ipHash },
    ];

    if (context.emailDomain) {
      checks.push({ type: "emailDomain", value: context.emailDomain });
    }

    if (context.binHash) {
      checks.push({ type: "bin", value: context.binHash });
    }

    const results = await Promise.all(
      checks.map(async (check) => {
        const [isAllowed, isDenied] = await Promise.all([
          listsService.isAllowed(check),
          listsService.isDenied(check),
        ]);
        return { check, isAllowed, isDenied };
      }),
    );

    const allowed = results
      .filter((r) => r.isAllowed)
      .map((r) => ({ type: r.check.type, value: r.check.value }));

    const denied = results
      .filter((r) => r.isDenied)
      .map((r) => ({ type: r.check.type, value: r.check.value }));

    if (denied.length > 0) {
      return {
        allowed: [],
        denied: denied,
        verdict: "deny",
        reason: `denylist_${denied[0].type}_${denied[0].value}`,
      };
    }

    if (allowed.length > 0) {
      return {
        allowed: allowed,
        denied: [],
        verdict: "allow",
        reason: `allowlist_${allowed[0].type}_${allowed[0].value}`,
      };
    }

    return {
      allowed: [],
      denied: [],
      verdict: "allow",
      reason: "",
    };
  }

  /**
   * Collect fraud signals
   */
  private async collectFraudSignals(
    context: FraudContext,
  ): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Get velocity data
    const velocityData = await velocityService.getCounts({
      uid: context.uid,
      ip: context.ipHash,
      uaHash: context.deviceHash,
    });

    // Get chargeback history (placeholder - implement based on your ledger)
    const chargebacks90d = await this.getChargebackHistory(context.uid);

    // Create main signal
    const signal: FraudSignal = {
      signalId: this.generateSignalId(),
      uid: context.uid,
      paynowCustomerId: context.paynowCustomerId,
      subjectType: context.subjectType,
      subjectId: context.subjectId,
      ipHash: context.ipHash,
      deviceHash: context.deviceHash,
      country: context.country,
      emailDomain: context.emailDomain,
      binHash: context.binHash,
      velocityMinute: velocityData.uid.minute,
      velocityHour: velocityData.uid.hour,
      velocityDay: velocityData.uid.day,
      chargebacks90d,
      firstSeenAt: new Date(), // TODO: Get from user profile
      createdAt: new Date(),
    };

    signals.push(signal);

    // Store signal in Firestore
    await this.storeFraudSignal(signal);

    return signals;
  }

  /**
   * Calculate risk score based on signals
   */
  private async calculateRiskScore(
    signals: FraudSignal[],
    context: FraudContext,
  ): Promise<number> {
    const config = await this.getConfig();
    let score = 0;

    for (const signal of signals) {
      // Velocity scoring - TUNED: Reduced weights to reduce false positives
      if (signal.velocityMinute > 15) score += 15; // Was 20, now 15
      if (signal.velocityHour > 75) score += 10;   // Was 50/15, now 75/10
      if (signal.velocityDay > 300) score += 5;    // Was 200/10, now 300/5

      // Chargeback history - TUNED: Reduced multiplier
      if (signal.chargebacks90d > 0) score += signal.chargebacks90d * 5; // Was 10, now 5

      // Country risk
      if (config.blockCountries.includes(context.country || "")) {
        score += 30;
      }

      // Email domain risk - TUNED: Reduced weight
      if (
        signal.emailDomain &&
        this.isHighRiskEmailDomain(signal.emailDomain)
      ) {
        score += 10; // Was 15, now 10
      }
    }

    // Bot defense check - TUNED: Increased positive impact
    if (context.recaptchaToken || context.appCheckToken) {
      // TODO: Integrate with botDefenseService
      // For now, reduce score if tokens are present
      score = Math.max(0, score - 15); // Was -10, now -15
    }

    return Math.min(100, score);
  }

  /**
   * Determine verdict based on score and threshold
   */
  private determineVerdict(
    score: number,
    threshold: number,
  ): "allow" | "review" | "deny" {
    if (score < threshold * 0.7) return "allow";
    if (score < threshold) return "review";
    return "deny";
  }

  /**
   * Get threshold based on subject type
   */
  private async getThreshold(
    subjectType: "order" | "user" | "subscription",
  ): Promise<number> {
    const config = await this.getConfig();
    switch (subjectType) {
      case "order":
        return config.scoreThresholdPurchase;
      case "subscription":
        return config.scoreThresholdSubscription;
      default:
        return config.scoreThresholdPurchase;
    }
  }

  /**
   * Generate reasons for the decision
   */
  private async generateReasons(
    signals: FraudSignal[],
    context: FraudContext,
    score: number,
  ): Promise<string[]> {
    const config = await this.getConfig();
    const reasons: string[] = [];

    for (const signal of signals) {
      if (signal.velocityMinute > 10) reasons.push("high_velocity_minute");
      if (signal.velocityHour > 50) reasons.push("high_velocity_hour");
      if (signal.velocityDay > 200) reasons.push("high_velocity_day");
      if (signal.chargebacks90d > 0) reasons.push("chargeback_history");
      if (config.blockCountries.includes(context.country || "")) {
        reasons.push("blocked_country");
      }
      if (
        signal.emailDomain &&
        this.isHighRiskEmailDomain(signal.emailDomain)
      ) {
        reasons.push("high_risk_email_domain");
      }
    }

    return reasons;
  }

  /**
   * Create and store risk decision
   */
  private async createRiskDecision(
    data: Omit<RiskDecision, "decisionId" | "createdAt" | "expiresAt">,
  ): Promise<RiskDecision> {
    const db = await getDb();
    const decisionId = this.generateDecisionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const decision: RiskDecision = {
      decisionId,
      ...data,
      createdAt: now,
      expiresAt,
    };

    await db.collection("riskDecisions").doc(decisionId).set(decision);

    return decision;
  }

  /**
   * Store fraud signal
   */
  private async storeFraudSignal(signal: FraudSignal): Promise<void> {
    const db = await getDb();
    await db.collection("fraudSignals").doc(signal.signalId).set(signal);
  }

  /**
   * Get chargeback history (placeholder)
   */
  private async getChargebackHistory(uid: string): Promise<number> {
    // TODO: Implement based on your ledger structure
    // This should query the ledger for chargeback entries in the last 90 days
    return 0;
  }

  /**
   * Check if email domain is high risk
   */
  private isHighRiskEmailDomain(domain: string): boolean {
    const highRiskDomains = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
    ];
    return highRiskDomains.some((risk) => domain.includes(risk));
  }

  /**
   * Generate unique signal ID
   */
  private generateSignalId(): string {
    return `signal_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `decision_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Log structured fraud evaluation data
   */
  private async logFraudEvaluation(
    context: FraudContext,
    decision: RiskDecision,
    allowed: boolean,
    processingMs: number,
  ): Promise<void> {
    const db = await getDb();
    const logRef = db.collection("fraudLogs").doc();
    await logRef.set({
      decisionId: decision.decisionId,
      mode: decision.mode,
      score: decision.score,
      verdict: decision.verdict,
      threshold: decision.threshold,
      uid: context.uid,
      subjectType: context.subjectType,
      subjectId: context.subjectId,
      reasons: decision.reasons,
      processing_ms: processingMs,
      signal_count: 0, // Placeholder, will be updated when signals are stored
      timestamp: new Date().toISOString(),
      canary: decision.canary,
      allowed: allowed,
    });
  }

  /**
   * Auto-escalate manual reviews older than 7 days
   */
  async escalateStaleReviews(): Promise<void> {
    const db = await getDb();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleReviews = await db
      .collection("manualReviews")
      .where("status", "in", ["pending", "in_review"])
      .where("createdAt", "<", sevenDaysAgo)
      .get();

    const batch = db.batch();
    let escalatedCount = 0;

    for (const doc of staleReviews.docs) {
      batch.update(doc.ref, {
        status: "escalated",
        escalatedAt: new Date(),
        escalationReason: "auto_escalation_7_days",
      });
      escalatedCount++;
    }

    if (escalatedCount > 0) {
      await batch.commit();
      console.log(`Auto-escalated ${escalatedCount} stale manual reviews`);
    }
  }

  /**
   * Get manual review statistics by age buckets
   */
  async getManualReviewStats(): Promise<{
    pending: { "0-1": number; "2-3": number; "4-7": number; ">7": number };
    inReview: { "0-1": number; "2-3": number; "4-7": number; ">7": number };
    escalated: { "0-1": number; "2-3": number; "4-7": number; ">7": number };
  }> {
    const db = await getDb();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      pending: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
      inReview: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
      escalated: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
    };

    // Get all manual reviews
    const reviews = await db.collection("manualReviews").get();

    for (const doc of reviews.docs) {
      const data = doc.data();
      const createdAt = data.createdAt.toDate();
      const ageInDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);

      let ageBucket: "0-1" | "2-3" | "4-7" | ">7";
      if (ageInDays <= 1) ageBucket = "0-1";
      else if (ageInDays <= 3) ageBucket = "2-3";
      else if (ageInDays <= 7) ageBucket = "4-7";
      else ageBucket = ">7";

      const status = data.status as keyof typeof stats;
      if (status in stats) {
        stats[status][ageBucket]++;
      }
    }

    return stats;
  }

  private generateCanaryHash(uid: string, subjectId: string): number {
    // Simple hash function for canary routing
    let hash = 0;
    const str = uid + subjectId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const fraudService = new FraudService();
