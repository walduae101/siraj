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
  async evaluateFraud(context: FraudContext): Promise<FraudEvaluationResult> {
    const startTime = Date.now();

    try {
      const config = await this.getConfig();

      // 1. Check rate limits first (fastest)
      const rateLimitResult = await this.checkRateLimits(context);
      if (!rateLimitResult.allowed) {
        const decision = await this.createRiskDecision({
          mode: config.mode,
          score: 100,
          verdict: "deny",
          threshold: 0,
          reasons: ["rate_limit_exceeded"],
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          uid: context.uid,
          linkedSignalIds: [],
          processingMs: Date.now() - startTime,
        });

        return {
          allowed: false,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      // 2. Check allow/deny lists
      const listChecks = await this.checkLists(context);
      if (listChecks.denied.length > 0) {
        const decision = await this.createRiskDecision({
          mode: config.mode,
          score: 100,
          verdict: "deny",
          threshold: 0,
          reasons: listChecks.denied.map(
            (d) => `denylist_${d.type}_${d.value}`,
          ),
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          uid: context.uid,
          linkedSignalIds: [],
          processingMs: Date.now() - startTime,
        });

        return {
          allowed: false,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      if (listChecks.allowed.length > 0) {
        const decision = await this.createRiskDecision({
          mode: config.mode,
          score: 0,
          verdict: "allow",
          threshold: 0,
          reasons: listChecks.allowed.map(
            (d) => `allowlist_${d.type}_${d.value}`,
          ),
          subjectType: context.subjectType,
          subjectId: context.subjectId,
          uid: context.uid,
          linkedSignalIds: [],
          processingMs: Date.now() - startTime,
        });

        return {
          allowed: true,
          decision,
          signals: [],
          processingMs: Date.now() - startTime,
        };
      }

      // 3. Collect fraud signals
      const signals = await this.collectFraudSignals(context);

      // 4. Calculate risk score
      const score = await this.calculateRiskScore(signals, context);

      // 5. Determine verdict based on mode and score
      const threshold = await this.getThreshold(context.subjectType);
      const verdict = this.determineVerdict(score, threshold);

      // 6. Create risk decision
      const decision = await this.createRiskDecision({
        mode: config.mode,
        score,
        verdict,
        threshold,
        reasons: await this.generateReasons(signals, context),
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        uid: context.uid,
        linkedSignalIds: signals.map((s) => s.signalId),
        processingMs: Date.now() - startTime,
      });

      // 7. Log structured data
      this.logFraudEvaluation(
        context,
        decision,
        signals,
        Date.now() - startTime,
      );

      return {
        allowed: config.mode === "shadow" || verdict === "allow",
        decision,
        signals,
        processingMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Fraud evaluation error:", error);
      // On error, allow in shadow mode, deny in enforce mode
      const config = await this.getConfig();
      const decision = await this.createRiskDecision({
        mode: config.mode,
        score: 50,
        verdict: config.mode === "shadow" ? "allow" : "deny",
        threshold: 0,
        reasons: ["evaluation_error"],
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        uid: context.uid,
        linkedSignalIds: [],
        processingMs: Date.now() - startTime,
      });

      return {
        allowed: config.mode === "shadow",
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

    return { allowed, denied };
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
  private logFraudEvaluation(
    context: FraudContext,
    decision: RiskDecision,
    signals: FraudSignal[],
    processingMs: number,
  ): void {
    console.log(
      JSON.stringify({
        component: "fraud",
        level: "info",
        message: "Fraud evaluation completed",
        mode: decision.mode,
        score: decision.score,
        verdict: decision.verdict,
        threshold: decision.threshold,
        uid: context.uid,
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        reasons: decision.reasons,
        processing_ms: processingMs,
        signal_count: signals.length,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

export const fraudService = new FraudService();
