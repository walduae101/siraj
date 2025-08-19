import { firestore } from "firebase-admin";
import crypto from "node:crypto";
import { checkoutCompleteInput, checkoutPreviewInput, type SkuType } from "~/server/api/schema/checkout";
import { pointsService } from "~/server/services/points";

const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "AED";
const PRICES = {
  points_1000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_1000 ?? 9),
  points_5000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_5000 ?? 35),
  points_10000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_10000 ?? 65),
  sub_monthly: Number(process.env.NEXT_PUBLIC_PRICE_SUB_MONTHLY ?? 19),
  sub_yearly: Number(process.env.NEXT_PUBLIC_PRICE_SUB_YEARLY ?? 180),
};

const POINTS_MAP: Record<SkuType, number | null> = {
  points_1000: 1000,
  points_5000: 5000,
  points_10000: 10000,
  sub_monthly: null,
  sub_yearly: null,
};

function ttlForPlan(sku: SkuType) {
  if (sku === "sub_monthly") return 30;
  if (sku === "sub_yearly") return 365;
  return null;
}

export const checkoutStub = {
  preview: (input: unknown) => {
    const { sku, qty } = checkoutPreviewInput.parse(input);
    const unitPrice = PRICES[sku];
    const total = unitPrice * qty;
    const points = POINTS_MAP[sku];
    const planDays = ttlForPlan(sku);
    return {
      sku, qty, currency,
      line: { unitPrice, qty, total },
      grant: points
        ? { type: "points" as const, amount: points * qty }
        : { type: "subscription" as const, days: (planDays ?? 0) * qty },
    };
  },

  complete: async (db: firestore.Firestore, userId: string, input: unknown) => {
    const parsed = checkoutCompleteInput.parse(input);
    const preview = checkoutStub.preview(parsed);
    const clientRef = parsed.clientRef ?? crypto.randomUUID();
    const guardRef = db.collection("stubOrders").doc(`${userId}__${clientRef}`);
    return await db.runTransaction(async (tx) => {
      const guard = await tx.get(guardRef);
      if (guard.exists) {
        return { alreadyApplied: true, clientRef, preview };
      }
      if (preview.grant.type === "points") {
        await pointsService.credit({
          uid: userId,
          kind: "paid",
          amount: preview.grant.amount,
          source: "purchase",
          actionId: clientRef,
        });
      } else {
        const profileRef = db.collection("profiles").doc(userId);
        const profSnap = await tx.get(profileRef);
        const now = new Date();
        const days = (preview.grant.days ?? 0);
        const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        tx.set(profileRef, {
          subscription: {
            plan: preview.sku === "sub_monthly" ? "monthly" : "yearly",
            status: "active",
            startedAt: firestore.Timestamp.fromDate(now),
            expiresAt: firestore.Timestamp.fromDate(expiresAt),
            provider: "stub",
            clientRef,
          },
        }, { merge: true });
        // Optionally log info to ledger (if you have logInfo)
      }
      tx.set(guardRef, { userId, createdAt: firestore.FieldValue.serverTimestamp() });
      return { ok: true, clientRef, preview };
    });
  },
};
