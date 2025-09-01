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
  createdAt: string; // ISO string instead of Timestamp for client compatibility
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
}
