import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { getConfig } from "~/server/config";

export interface RiskEvent {
  id: string;
  uid: string;
  eventType: "credit" | "promo_redeem" | "admin_adjust";
  riskScore: number;
  riskReasons: string[];
  decision: "posted" | "hold" | "reversed";
  metadata: {
    amount?: number;
    source?: string;
    customerId?: string;
    ip?: string;
    accountAge?: number;
  };
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  resolutionReason?: string;
}

export interface VelocityCheck {
  uid: string;
  customerId?: string;
  ip?: string;
  amount: number;
  eventType: "credit" | "promo_redeem" | "admin_adjust";
  source: string;
}

export interface VelocityResult {
  allowed: boolean;
  riskScore: number;
  riskReasons: string[];
  decision: "posted" | "hold";
}

export class RiskManagementService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Check velocity rules for a credit event
   */
  static async checkVelocity(check: VelocityCheck): Promise<VelocityResult> {
    const config = getConfig();
    
    // Skip risk checks if disabled
    if (!config.features.RISK_HOLDS_ENABLED) {
      return {
        allowed: true,
        riskScore: 0,
        riskReasons: [],
        decision: "posted",
      };
    }

    const db = await this.getDb();
    const now = Timestamp.now();
    const oneHourAgo = Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
    const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);

    let riskScore = 0;
    const riskReasons: string[] = [];

    // Check 1: Max credited points per hour (200/h)
    const hourlyCredits = await this.getCreditsInTimeframe(
      check.uid,
      oneHourAgo,
      now
    );
    if (hourlyCredits + check.amount > 200) {
      riskScore += 50;
      riskReasons.push(`Hourly credit limit exceeded: ${hourlyCredits + check.amount}/200`);
    }

    // Check 2: Max credited points per day (800/day)
    const dailyCredits = await this.getCreditsInTimeframe(
      check.uid,
      oneDayAgo,
      now
    );
    if (dailyCredits + check.amount > 800) {
      riskScore += 30;
      riskReasons.push(`Daily credit limit exceeded: ${dailyCredits + check.amount}/800`);
    }

    // Check 3: Promo redeems per day (3/day)
    if (check.eventType === "promo_redeem") {
      const dailyPromos = await this.getPromoRedeemsInTimeframe(
        check.uid,
        oneDayAgo,
        now
      );
      if (dailyPromos >= 3) {
        riskScore += 40;
        riskReasons.push(`Daily promo limit exceeded: ${dailyPromos}/3`);
      }
    }

    // Check 4: Multiple accounts with same PayNow customerId
    if (check.customerId) {
      const accountsWithCustomerId = await this.getAccountsWithCustomerId(
        check.customerId,
        oneDayAgo,
        now
      );
      if (accountsWithCustomerId > 3) {
        riskScore += 60;
        riskReasons.push(`Multiple accounts with same customer ID: ${accountsWithCustomerId}`);
      }
    }

    // Check 5: Account age + high velocity
    const accountAge = await this.getAccountAge(check.uid);
    if (accountAge < 60 && (hourlyCredits + check.amount) > 100) {
      riskScore += 40;
      riskReasons.push(`New account with high velocity: ${accountAge}min old, ${hourlyCredits + check.amount} credits/h`);
    }

    // Check 6: IP-based velocity
    if (check.ip) {
      const ipCredits = await this.getCreditsByIpInTimeframe(
        check.ip,
        oneHourAgo,
        now
      );
      if (ipCredits + check.amount > 500) {
        riskScore += 35;
        riskReasons.push(`IP-based velocity exceeded: ${ipCredits + check.amount}/500`);
      }
    }

    // Decision logic
    const decision = riskScore >= 50 ? "hold" : "posted";

    return {
      allowed: decision === "posted",
      riskScore,
      riskReasons,
      decision,
    };
  }

  /**
   * Create a risk event record
   */
  static async createRiskEvent(
    uid: string,
    eventType: RiskEvent["eventType"],
    velocityResult: VelocityResult,
    metadata: RiskEvent["metadata"]
  ): Promise<string> {
    const db = await this.getDb();
    const riskEventRef = db.collection("riskEvents").doc();

    const riskEvent: Omit<RiskEvent, "id"> = {
      uid,
      eventType,
      riskScore: velocityResult.riskScore,
      riskReasons: velocityResult.riskReasons,
      decision: velocityResult.decision,
      metadata,
      createdAt: Timestamp.now(),
    };

    await riskEventRef.set(riskEvent);

    // Log structured event
    console.log("[risk-management] Risk event created", {
      component: "risk_management",
      risk_event_id: riskEventRef.id,
      uid,
      event_type: eventType,
      risk_score: velocityResult.riskScore,
      decision: velocityResult.decision,
      reasons: velocityResult.riskReasons,
    });

    return riskEventRef.id;
  }

  /**
   * Get credits for a user in a time frame
   */
  private static async getCreditsInTimeframe(
    uid: string,
    start: Timestamp,
    end: Timestamp
  ): Promise<number> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .where("kind", "in", ["purchase", "subscription_credit", "promo_credit"])
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    return snapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.amount || 0);
    }, 0);
  }

  /**
   * Get promo redeems for a user in a time frame
   */
  private static async getPromoRedeemsInTimeframe(
    uid: string,
    start: Timestamp,
    end: Timestamp
  ): Promise<number> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .where("kind", "==", "promo_credit")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    return snapshot.docs.length;
  }

  /**
   * Get number of accounts using the same PayNow customerId
   */
  private static async getAccountsWithCustomerId(
    customerId: string,
    start: Timestamp,
    end: Timestamp
  ): Promise<number> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("paynowCustomers")
      .where("customerId", "==", customerId)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    return snapshot.docs.length;
  }

  /**
   * Get account age in minutes
   */
  private static async getAccountAge(uid: string): Promise<number> {
    const db = await this.getDb();
    
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return 0;
    }

    const data = userDoc.data();
    const createdAt = data?.createdAt;
    if (!createdAt) {
      return 0;
    }

    const now = Timestamp.now();
    const ageMs = now.toMillis() - createdAt.toMillis();
    return Math.floor(ageMs / (60 * 1000)); // Convert to minutes
  }

  /**
   * Get credits by IP in a time frame
   */
  private static async getCreditsByIpInTimeframe(
    ip: string,
    start: Timestamp,
    end: Timestamp
  ): Promise<number> {
    const db = await this.getDb();
    
    // This would require storing IP addresses in ledger entries
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Get open risk holds
   */
  static async getOpenRiskHolds(): Promise<RiskEvent[]> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("riskEvents")
      .where("decision", "==", "hold")
      .where("resolvedAt", "==", null)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as RiskEvent));
  }

  /**
   * Resolve a risk hold
   */
  static async resolveRiskHold(
    riskEventId: string,
    decision: "posted" | "reversed",
    resolvedBy: string,
    reason: string
  ): Promise<void> {
    const db = await this.getDb();
    
    await db.collection("riskEvents").doc(riskEventId).update({
      decision,
      resolvedAt: Timestamp.now(),
      resolvedBy,
      resolutionReason: reason,
    });

    // Log resolution
    console.log("[risk-management] Risk hold resolved", {
      component: "risk_management",
      risk_event_id: riskEventId,
      decision,
      resolved_by: resolvedBy,
      reason,
    });
  }

  /**
   * Get risk statistics for monitoring
   */
  static async getRiskStatistics(): Promise<{
    openHolds: number;
    totalHolds: number;
    avgRiskScore: number;
    topReasons: string[];
  }> {
    const db = await this.getDb();
    const now = Timestamp.now();
    const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);

    // Get open holds
    const openHoldsSnapshot = await db
      .collection("riskEvents")
      .where("decision", "==", "hold")
      .where("resolvedAt", "==", null)
      .get();

    // Get total holds in last 24h
    const totalHoldsSnapshot = await db
      .collection("riskEvents")
      .where("decision", "==", "hold")
      .where("createdAt", ">=", oneDayAgo)
      .get();

    // Calculate average risk score
    const riskScores = totalHoldsSnapshot.docs.map(doc => doc.data().riskScore || 0);
    const avgRiskScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length 
      : 0;

    // Get top risk reasons
    const reasons: string[] = [];
    totalHoldsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.riskReasons) {
        reasons.push(...data.riskReasons);
      }
    });

    const reasonCounts = reasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);

    return {
      openHolds: openHoldsSnapshot.docs.length,
      totalHolds: totalHoldsSnapshot.docs.length,
      avgRiskScore: Math.round(avgRiskScore),
      topReasons,
    };
  }
}
