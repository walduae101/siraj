/**
 * Metrics service for structured logging and monitoring
 * Supports counters, histograms, and gauges for observability
 */

export interface MetricLabels {
  [key: string]: string;
}

export class MetricsService {
  /**
   * Record a counter metric
   */
  static recordCounter(name: string, value: number, labels: MetricLabels = {}): void {
    console.log("[metrics] counter", {
      component: "metrics",
      metric_type: "counter",
      metric_name: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a histogram metric
   */
  static recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    console.log("[metrics] histogram", {
      component: "metrics",
      metric_type: "histogram",
      metric_name: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a gauge metric
   */
  static recordGauge(name: string, value: number, labels: MetricLabels = {}): void {
    console.log("[metrics] gauge", {
      component: "metrics",
      metric_type: "gauge",
      metric_name: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  // Phase 1-3: Core metrics
  static recordWebhookReceived(eventType: string, source: string): void {
    this.recordCounter("webhook_received", 1, { event_type: eventType, source });
  }

  static recordWebhookProcessed(eventType: string, status: string): void {
    this.recordCounter("webhook_processed", 1, { event_type: eventType, status });
  }

  static recordWalletCredit(uid: string, amount: number, source: string): void {
    this.recordCounter("wallet_credit", 1, { uid, source });
    this.recordHistogram("wallet_credit_amount", amount, { uid, source });
  }

  static recordWalletDebit(uid: string, amount: number, source: string): void {
    this.recordCounter("wallet_debit", 1, { uid, source });
    this.recordHistogram("wallet_debit_amount", amount, { uid, source });
  }

  static recordSubscriptionRenewal(uid: string, productId: string): void {
    this.recordCounter("subscription_renewal", 1, { uid, product_id: productId });
  }

  // Phase 4: Revenue Assurance metrics
  static recordWalletInvariantViolation(uid: string, delta: number): void {
    this.recordCounter("wallet_invariant_violations", 1, { uid });
    this.recordHistogram("reconciliation_adjustment_amount", Math.abs(delta), { uid });
  }

  static recordBackfillProcessedEvents(count: number, type: string): void {
    this.recordCounter("backfill_processed_events", count, { type });
  }

  // Phase 5: Fraud & Abuse metrics
  static recordRateLimitBlocked(action: string, userRole: string): void {
    this.recordCounter("rate_limit_blocked", 1, { action, user_role: userRole });
  }

  static recordRiskHoldCreated(uid: string, riskScore: number, eventType: string): void {
    this.recordCounter("risk_hold_created", 1, { uid, event_type: eventType });
    this.recordHistogram("risk_hold_score", riskScore, { uid, event_type: eventType });
  }

  static recordRiskHoldReleased(uid: string, riskEventId: string): void {
    this.recordCounter("risk_hold_released", 1, { uid, risk_event_id: riskEventId });
  }

  static recordRiskHoldReversed(uid: string, riskEventId: string): void {
    this.recordCounter("risk_hold_reversed", 1, { uid, risk_event_id: riskEventId });
  }

  static recordRiskHoldOpen(count: number): void {
    this.recordGauge("risk_hold_open", count);
  }

  static recordPromoCodeRedeemed(promoId: string, uid: string, points: number): void {
    this.recordCounter("promo_code_redeemed", 1, { promo_id: promoId, uid });
    this.recordHistogram("promo_code_points", points, { promo_id: promoId, uid });
  }

  static recordPromoCodeAbuse(promoId: string, uid: string, reason: string): void {
    this.recordCounter("promo_code_abuse", 1, { promo_id: promoId, uid, reason });
  }

  /**
   * Get metrics summary for monitoring
   */
  static getMetricsSummary(): {
    totalWebhooks: number;
    totalCredits: number;
    totalDebits: number;
    totalRiskHolds: number;
    totalPromoRedeems: number;
  } {
    // In a real implementation, this would aggregate metrics from storage
    // For now, return placeholder data
    return {
      totalWebhooks: 0,
      totalCredits: 0,
      totalDebits: 0,
      totalRiskHolds: 0,
      totalPromoRedeems: 0,
    };
  }
}
