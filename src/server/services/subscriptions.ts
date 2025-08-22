import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getConfig, getSubscriptionPlan } from "~/server/config";
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

export const subscriptions = {
  getPlan(productId: string) {
    return getSubscriptionPlan(productId);
  },

  /**
   * Called after a successful PayNow purchase of a subscription product.
   * Creates/updates the subscription doc AND credits the first cycle immediately.
   */
  async recordPurchase(uid: string, productId: string, orderId: string) {
    const cfg = getConfig();
    if (!cfg.features.FEAT_SUB_POINTS) {
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
    const kind = cfg.subscriptions.pointsKind;
    const expireDays = cfg.subscriptions.pointsExpireDays;

    await pointsService.credit({
      uid,
      kind: kind,
      amount: plan.pointsPerCycle,
      source: `subscription:${plan.name}:first-cycle`,
      expiresAt:
        kind === "promo"
          ? new Date(Date.now() + expireDays * 86400000)
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
    const cfg = getConfig();
    if (!cfg.features.FEAT_SUB_POINTS) {
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

      const cfg = getConfig();
      const kind = cfg.subscriptions.pointsKind;
      const expireDays = cfg.subscriptions.pointsExpireDays;

      await pointsService.credit({
        uid,
        kind: kind,
        amount: plan.pointsPerCycle,
        source: `subscription:${plan.name}:cycle-topup`,
        expiresAt:
          kind === "promo"
            ? new Date(Date.now() + expireDays * 86400000)
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
    const cfg = getConfig();
    if (!cfg.features.FEAT_SUB_POINTS) {
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

      const cfg = getConfig();
      const kind = cfg.subscriptions.pointsKind;
      const expireDays = cfg.subscriptions.pointsExpireDays;

      await pointsService.credit({
        uid,
        kind: kind,
        amount: plan.pointsPerCycle,
        source: `subscription:${plan.name}:cycle-topup`,
        expiresAt:
          kind === "promo"
            ? new Date(Date.now() + expireDays * 86400000)
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

  /**
   * Handle subscription webhook events within a transaction (for worker use)
   */
  async handleWebhookInTransaction(
    transaction: any,
    eventType: string,
    subscriptionData: any,
    uid: string,
  ) {
    const cfg = getConfig();
    if (!cfg.features.FEAT_SUB_POINTS) {
      return { ok: false, reason: "feature-disabled" };
    }

    const productId =
      subscriptionData.product_id || subscriptionData.plan?.product_id;
    const orderId = subscriptionData.id || subscriptionData.order_id;

    if (!productId || !orderId) {
      throw new Error("Missing product ID or order ID in subscription data");
    }

    const plan = this.getPlan(productId);
    if (!plan) {
      throw new Error(`Unknown subscription plan: ${productId}`);
    }

    if (
      eventType === "subscription.created" ||
      eventType === "subscription.renewed"
    ) {
      // Record the subscription purchase and credit initial points
      const subRef = this.getSubRef(uid, orderId);
      const existingSub = await transaction.get(subRef);

      if (existingSub.exists && eventType === "subscription.created") {
        // Already processed
        return { ok: true, alreadyProcessed: true };
      }

      const now = Timestamp.now();
      const subDoc = {
        uid,
        orderId,
        productId,
        planName: plan.name,
        pointsPerCycle: plan.pointsPerCycle,
        cycle: plan.cycle,
        status: "active",
        totalGranted: plan.pointsPerCycle,
        nextCreditAt: Timestamp.fromDate(
          plan.cycle === "month"
            ? addMonths(new Date(), 1)
            : addMonths(new Date(), 12),
        ),
        createdAt: existingSub.exists ? existingSub.data()?.createdAt : now,
        updatedAt: now,
      };

      transaction.set(subRef, subDoc, { merge: true });

      // Credit points using the transaction
      await pointsService.creditPointsInTransaction(
        transaction,
        uid,
        plan.pointsPerCycle,
        {
          source: "subscription",
          eventId: `${orderId}_${eventType}_${Date.now()}`,
          orderId,
          productId,
          quantity: 1,
          unitPrice: subscriptionData.price,
        },
      );

      return {
        ok: true,
        credited: plan.pointsPerCycle,
        subscription: subDoc,
      };
    }

    return { ok: true, skipped: true, eventType };
  },
};
