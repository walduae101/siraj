import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { env } from "~/env-server";
import { pointsService } from "~/server/services/points";
import { addMonths } from "./util-date";

type Cycle = "month" | "year";
type Plan = { name: string; cycle: Cycle; pointsPerCycle: number };

type SubDoc = {
  provider: "paynow";
  productId: string; // PayNow product id
  orderId: string; // PayNow order/checkout id (for audit)
  planName: string;
  cycle: "month" | "year";
  pointsPerCycle: number;
  status: "active" | "canceled" | "expired";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  currentPeriodEnd: FirebaseFirestore.Timestamp; // billing period end
  nextCreditAt: FirebaseFirestore.Timestamp; // when to credit next
  totalGranted: number; // cumulative points granted by this sub
};

function loadPlans(): Record<string, Plan> {
  try {
    const raw = env.SUB_PLAN_POINTS_JSON ?? "{}";
    const obj = JSON.parse(raw);
    return obj;
  } catch {
    return {};
  }
}

const PLANS: Record<string, Plan> = loadPlans();

const KIND = (env.SUB_POINTS_KIND === "paid" ? "paid" : "promo") as
  | "paid"
  | "promo";
const EXPIRE_DAYS = Math.max(1, Number(env.SUB_POINTS_EXPIRE_DAYS ?? 365));

export const subscriptions = {
  getPlan(productId: string): Plan | null {
    const p = PLANS[productId];
    return p
      ? {
          name: p.name,
          cycle: p.cycle,
          pointsPerCycle: Number(p.pointsPerCycle || 0),
        }
      : null;
  },

  /**
   * Called after a successful PayNow purchase of a subscription product.
   * Creates/updates the subscription doc AND credits the first cycle immediately.
   */
  async recordPurchase(uid: string, productId: string, orderId: string) {
    if (!env.FEAT_SUB_POINTS) {
      return { ok: false as const, reason: "feature-disabled" };
    }

    const plan = this.getPlan(productId);
    if (!plan) return { ok: false as const, reason: "unknown-plan" };

    const db = getFirestore();
    const now = Timestamp.now();
    const subRef = db
      .collection("users")
      .doc(uid)
      .collection("subscriptions")
      .doc(orderId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(subRef);
      const start = now;
      const next = Timestamp.fromDate(addMonths(start.toDate(), 1)); // we credit monthly even for annual
      const periodEnd =
        plan.cycle === "year"
          ? Timestamp.fromDate(addMonths(start.toDate(), 12))
          : Timestamp.fromDate(addMonths(start.toDate(), 1));

      if (!snap.exists) {
        const subDoc: SubDoc = {
          provider: "paynow",
          productId,
          orderId,
          planName: plan.name,
          cycle: plan.cycle,
          pointsPerCycle: plan.pointsPerCycle,
          status: "active",
          createdAt: now,
          updatedAt: now,
          currentPeriodEnd: periodEnd,
          nextCreditAt: next,
          totalGranted: 0,
        };
        tx.set(subRef, subDoc);
      } else {
        tx.update(subRef, {
          updatedAt: now,
          status: "active",
          planName: plan.name,
          pointsPerCycle: plan.pointsPerCycle,
          currentPeriodEnd: periodEnd,
        });
      }
    });

    // Credit first cycle immediately
    await pointsService.credit({
      uid,
      kind: KIND,
      amount: plan.pointsPerCycle,
      source: `subscription:${plan.name}:first-cycle`,
      expiresAt:
        KIND === "promo"
          ? new Date(Date.now() + EXPIRE_DAYS * 86400000)
          : undefined,
      actionId: `${orderId}_first_cycle_${productId}`,
    });

    // Bump totals & nextCreditAt by +1 month
    await subRef.update({
      totalGranted: FieldValue.increment(plan.pointsPerCycle),
      nextCreditAt: Timestamp.fromDate(addMonths(new Date(), 1)),
      updatedAt: Timestamp.now(),
    });

    return { ok: true as const, plan };
  },

  /**
   * Credit **one** user's due sub(s) if nextCreditAt <= now.
   */
  async creditDueForUser(uid: string) {
    if (!env.FEAT_SUB_POINTS) {
      return { ok: true as const, credited: 0 };
    }

    const db = getFirestore();
    const now = Timestamp.now();
    const col = db.collection("users").doc(uid).collection("subscriptions");
    const qs = await col
      .where("status", "==", "active")
      .where("nextCreditAt", "<=", now)
      .get();
    let credited = 0;

    for (const doc of qs.docs) {
      const sub = doc.data() as SubDoc;
      const plan = this.getPlan(sub.productId);
      if (!plan) continue;

      await pointsService.credit({
        uid,
        kind: KIND,
        amount: plan.pointsPerCycle,
        source: `subscription:${plan.name}:cycle-topup`,
        expiresAt:
          KIND === "promo"
            ? new Date(Date.now() + EXPIRE_DAYS * 86400000)
            : undefined,
        actionId: `${sub.orderId}_cycle_${Date.now()}_${sub.productId}`,
      });

      await doc.ref.update({
        totalGranted: FieldValue.increment(plan.pointsPerCycle),
        nextCreditAt: Timestamp.fromDate(addMonths(new Date(), 1)),
        updatedAt: Timestamp.now(),
      });

      credited += plan.pointsPerCycle;
    }
    return { ok: true as const, credited };
  },

  /**
   * Cron: credit all due across the project (batched).
   */
  async creditAllDue(limit = 300) {
    if (!env.FEAT_SUB_POINTS) {
      return { ok: true as const, processed: 0 };
    }

    const db = getFirestore();
    const now = Timestamp.now();

    // collectionGroup over all subscriptions
    const qs = await db
      .collectionGroup("subscriptions")
      .where("status", "==", "active")
      .where("nextCreditAt", "<=", now)
      .limit(limit)
      .get();

    let n = 0;
    for (const doc of qs.docs) {
      const sub = doc.data() as SubDoc;
      const uid = doc.ref.parent.parent?.id;
      if (!uid) continue;
      const plan = this.getPlan(sub.productId);
      if (!plan) continue;

      await pointsService.credit({
        uid,
        kind: KIND,
        amount: plan.pointsPerCycle,
        source: `subscription:${plan.name}:cycle-topup`,
        expiresAt:
          KIND === "promo"
            ? new Date(Date.now() + EXPIRE_DAYS * 86400000)
            : undefined,
        actionId: `${sub.orderId}_cycle_${Date.now()}_${sub.productId}`,
      });

      await doc.ref.update({
        totalGranted: FieldValue.increment(plan.pointsPerCycle),
        nextCreditAt: Timestamp.fromDate(addMonths(new Date(), 1)),
        updatedAt: Timestamp.now(),
      });

      n++;
    }
    return { ok: true as const, processed: n };
  },

  /**
   * Helper to get subscription reference
   */
  getSubRef(uid: string, orderId: string) {
    const db = getFirestore();
    return db
      .collection("users")
      .doc(uid)
      .collection("subscriptions")
      .doc(orderId);
  },
};
