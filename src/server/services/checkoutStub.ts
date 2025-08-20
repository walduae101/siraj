import crypto from "node:crypto";
import { firestore } from "firebase-admin";
import {
  type SkuType,
  checkoutCompleteInput,
  checkoutPreviewInput,
} from "~/server/api/schema/checkout";
import { pointsService } from "~/server/services/points";

const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "AED";
const PRICES = {
  // Legacy stub prices
  points_1000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_1000 ?? 9),
  points_5000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_5000 ?? 35),
  points_10000: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_10000 ?? 65),
  sub_monthly: Number(process.env.NEXT_PUBLIC_PRICE_SUB_MONTHLY ?? 19),
  sub_yearly: Number(process.env.NEXT_PUBLIC_PRICE_SUB_YEARLY ?? 180),

  // PayNow prices (for stub fallback)
  points_20: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_20 ?? 5),
  points_50: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_50 ?? 10),
  points_150: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_150 ?? 25),
  points_500: Number(process.env.NEXT_PUBLIC_PRICE_POINTS_500 ?? 50),
  sub_basic_m: Number(process.env.NEXT_PUBLIC_PRICE_SUB_BASIC_M ?? 10),
  sub_pro_m: Number(process.env.NEXT_PUBLIC_PRICE_SUB_PRO_M ?? 29),
  sub_basic_y: Number(process.env.NEXT_PUBLIC_PRICE_SUB_BASIC_Y ?? 100),
  sub_pro_y: Number(process.env.NEXT_PUBLIC_PRICE_SUB_PRO_Y ?? 290),
} as const;

const POINTS_MAP: Record<SkuType, number | null> = {
  // Legacy stub SKUs
  points_1000: 1000,
  points_5000: 5000,
  points_10000: 10000,
  sub_monthly: null,
  sub_yearly: null,

  // PayNow SKUs (for stub compatibility)
  points_20: 20,
  points_50: 50,
  points_150: 150,
  points_500: 500,
  sub_basic_m: null,
  sub_pro_m: null,
  sub_basic_y: null,
  sub_pro_y: null,
};

function ttlForPlan(sku: SkuType) {
  // Legacy stub subscriptions
  if (sku === "sub_monthly") return 30;
  if (sku === "sub_yearly") return 365;

  // PayNow subscriptions
  if (sku === "sub_basic_m" || sku === "sub_pro_m") return 30;
  if (sku === "sub_basic_y" || sku === "sub_pro_y") return 365;

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
      sku,
      qty,
      currency,
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
        const days = preview.grant.days ?? 0;
        const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        tx.set(
          profileRef,
          {
            subscription: {
              plan: preview.sku === "sub_monthly" ? "monthly" : "yearly",
              status: "active",
              startedAt: firestore.Timestamp.fromDate(now),
              expiresAt: firestore.Timestamp.fromDate(expiresAt),
              provider: "stub",
              clientRef,
            },
          },
          { merge: true },
        );
        // Optionally log info to ledger (if you have logInfo)
      }
      tx.set(guardRef, {
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return { ok: true, clientRef, preview };
    });
  },
};
