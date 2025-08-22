import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";
// import { env } from "~/env-server";
import { db } from "../firebase/admin"; // server-only admin

// Type definitions for points system
interface PromoLot {
  id: string;
  amountRemaining: number;
  expiresAt: Timestamp;
  source: string;
}

interface WalletData {
  paidBalance: number;
  promoBalance: number;
  promoLots: PromoLot[];
  updatedAt: Timestamp;
  createdAt?: Timestamp;
  v: number;
}

const USERS = db.collection("users");
const WALLETS = (uid: string) =>
  db.collection("users").doc(uid).collection("wallet").doc("points");
const LEDGER = (uid: string) =>
  db.collection("users").doc(uid).collection("ledger");

// Ensure user document exists before wallet operations
async function ensureUserDocument(uid: string): Promise<void> {
  const userRef = USERS.doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set(
      {
        uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: "active",
      },
      { merge: true },
    );
  }
}

function nowTs() {
  return Timestamp.now();
}

export const pointsService = {
  async getWallet(uid: string) {
    // Ensure user document exists first
    await ensureUserDocument(uid);

    // Optional lazy top-up safety net for subscriptions
    const cfg = await import("~/server/config").then((m) => m.getConfig());
    if (cfg.subscriptions.topupLazy) {
      try {
        // Dynamically import to avoid circular dependency
        const { subscriptions } = await import("./subscriptions");
        await subscriptions.creditDueForUser(uid);
      } catch (error) {
        // Silently continue if subscription top-up fails
        console.warn(
          "[points.getWallet] Lazy top-up failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    const snap = await WALLETS(uid).get();
    if (!snap.exists) {
      const init = {
        paidBalance: 0,
        promoBalance: 0,
        promoLots: [],
        createdAt: nowTs(),
        updatedAt: nowTs(),
        v: 1,
      };
      await WALLETS(uid).set(init);
      return init;
    }
    return snap.data();
  },

  // Credit points within an existing transaction (for worker use)
  async creditPointsInTransaction(
    transaction: Transaction,
    uid: string,
    points: number,
    metadata: {
      source: string;
      eventId: string;
      orderId: string;
      productId: string;
      quantity: number;
      unitPrice?: string;
    },
  ) {
    const walletRef = WALLETS(uid);
    const walletSnap = await transaction.get(walletRef);

    if (!walletSnap.exists) {
      throw new Error(`Wallet not found for user ${uid}`);
    }

    const wallet = walletSnap.data();
    if (!wallet) {
      throw new Error("Wallet data not found");
    }
    const ledgerRef = LEDGER(uid).doc(metadata.eventId);

    // Check for duplicate (idempotency)
    const existingEntry = await transaction.get(ledgerRef);
    if (existingEntry.exists) {
      return existingEntry.data();
    }

    // Update wallet balance
    wallet.paidBalance += points;
    wallet.updatedAt = nowTs();

    // Create ledger entry
    const ledgerEntry = {
      id: metadata.eventId,
      action: "credit",
      kind: "paid" as const,
      amount: points,
      source: metadata.source,
      pre: { paid: wallet.paidBalance - points, promo: wallet.promoBalance },
      post: { paid: wallet.paidBalance, promo: wallet.promoBalance },
      metadata: {
        orderId: metadata.orderId,
        productId: metadata.productId,
        quantity: metadata.quantity,
        unitPrice: metadata.unitPrice,
      },
      createdAt: nowTs(),
      v: 1,
    };

    // Apply updates
    transaction.update(walletRef, wallet);
    transaction.set(ledgerRef, ledgerEntry);

    return ledgerEntry;
  },

  async previewSpend({ uid, cost }: { uid: string; cost: number }) {
    const w = await this.getWallet(uid);
    if (!w) throw new Error("Wallet not found");
    let remaining = cost;
    const lots = [...w.promoLots].sort(
      (a, b) => a.expiresAt.toMillis() - b.expiresAt.toMillis(),
    );
    const consume: { lotId: string; amount: number; expiresAt: number }[] = [];
    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.amountRemaining);
      if (take > 0) {
        consume.push({
          lotId: lot.id,
          amount: take,
          expiresAt: lot.expiresAt.toMillis(),
        });
        remaining -= take;
      }
    }
    const fromPromo = cost - remaining;
    const fromPaid = Math.max(0, remaining);
    const ok = fromPromo + fromPaid <= w.promoBalance + w.paidBalance;
    const soon = !!consume.find(
      (c) => c.expiresAt - Date.now() < 7 * 86400_000,
    );
    return {
      ok,
      cost,
      payBreakdown: { promo: fromPromo, paid: fromPaid },
      pre: { paid: w.paidBalance, promo: w.promoBalance },
      post: ok
        ? { paid: w.paidBalance - fromPaid, promo: w.promoBalance - fromPromo }
        : null,
      expiryWarning: soon,
      lots: consume,
    };
  },

  async spend({
    uid,
    cost,
    action,
    actionId,
  }: { uid: string; cost: number; action: string; actionId: string }) {
    // Ensure user document exists first
    await ensureUserDocument(uid);

    return await db.runTransaction(async (tx) => {
      const ref = WALLETS(uid);
      const snap = await tx.get(ref);
      const w =
        snap.exists && snap.data()
          ? (snap.data() as WalletData)
          : {
              paidBalance: 0,
              promoBalance: 0,
              promoLots: [] as PromoLot[],
              createdAt: nowTs(),
              updatedAt: nowTs(),
              v: 1,
            };
      const dup = await tx.get(LEDGER(uid).doc(actionId));
      if (dup.exists) return dup.data();

      let remaining = cost;
      const lots = [...w.promoLots].sort(
        (a, b) => a.expiresAt.toMillis() - b.expiresAt.toMillis(),
      );
      const consumed: { lotId: string; amount: number }[] = [];

      for (const lot of lots) {
        if (lot.expiresAt.toMillis() <= Date.now()) continue;
        if (remaining <= 0) break;
        const take = Math.min(remaining, lot.amountRemaining);
        if (take > 0) {
          lot.amountRemaining -= take;
          remaining -= take;
          consumed.push({ lotId: lot.id, amount: take });
        }
      }

      const fromPromo = cost - remaining;
      if (fromPromo > w.promoBalance)
        throw new Error("Inconsistent promo balance");
      let fromPaid = 0;

      if (remaining > 0) {
        if (remaining > w.paidBalance) throw new Error("INSUFFICIENT_POINTS");
        fromPaid = remaining;
        w.paidBalance -= fromPaid;
        remaining = 0;
      }

      w.promoLots = w.promoLots
        .map((l: PromoLot) => {
          const upd = lots.find((x) => x.id === l.id) ?? l;
          return upd;
        })
        .filter(
          (l: PromoLot) =>
            l.amountRemaining > 0 && l.expiresAt.toMillis() > Date.now(),
        );
      w.promoBalance = w.promoLots.reduce(
        (s: number, l: PromoLot) => s + l.amountRemaining,
        0,
      );

      const pre = {
        paid: snap.exists ? snap.data()?.paidBalance : 0,
        promo: snap.exists ? snap.data()?.promoBalance : 0,
      };
      const post = { paid: w.paidBalance, promo: w.promoBalance };

      w.updatedAt = nowTs();
      tx.set(ref, w, { merge: true });

      const entry = {
        type: "debit",
        channel: fromPaid > 0 ? "paid" : "promo",
        amount: cost,
        action,
        actionId,
        pre,
        post,
        consumedLots: consumed,
        createdAt: nowTs(),
        createdBy: uid,
        v: 1,
      };
      tx.set(LEDGER(uid).doc(actionId), entry);
      return entry;
    });
  },

  async credit({
    uid,
    kind,
    amount,
    source,
    expiresAt,
    actionId,
  }: {
    uid: string;
    kind: "paid" | "promo";
    amount: number;
    source: string;
    expiresAt?: Date;
    actionId: string;
  }) {
    // Ensure user document exists first
    await ensureUserDocument(uid);

    return await db.runTransaction(async (tx) => {
      const ref = WALLETS(uid);
      const snap = await tx.get(ref);
      const w =
        snap.exists && snap.data()
          ? (snap.data() as WalletData)
          : {
              paidBalance: 0,
              promoBalance: 0,
              promoLots: [] as PromoLot[],
              createdAt: nowTs(),
              updatedAt: nowTs(),
              v: 1,
            };
      const dup = await tx.get(LEDGER(uid).doc(actionId));
      if (dup.exists) return dup.data();

      const pre = { paid: w.paidBalance, promo: w.promoBalance };

      let creditLot: PromoLot | undefined = undefined;
      if (kind === "paid") {
        w.paidBalance += amount;
      } else {
        if (!expiresAt) throw new Error("PROMO_REQUIRES_EXPIRY");
        creditLot = {
          id: randomUUID(),
          amountRemaining: amount,
          expiresAt: Timestamp.fromDate(expiresAt),
          source,
        };
        w.promoLots.push(creditLot);
        w.promoLots.sort(
          (a: PromoLot, b: PromoLot) =>
            a.expiresAt.toMillis() - b.expiresAt.toMillis(),
        );
        w.promoBalance = w.promoLots.reduce(
          (s: number, l: PromoLot) => s + l.amountRemaining,
          0,
        );
      }

      const post = { paid: w.paidBalance, promo: w.promoBalance };
      w.updatedAt = nowTs();
      if (!snap.exists) w.createdAt = nowTs();
      tx.set(ref, w, { merge: true });

      const entry: Record<string, unknown> = {
        type: "credit",
        channel: kind,
        amount,
        action: `credit.${source}`,
        actionId,
        pre,
        post,
        createdAt: nowTs(),
        createdBy: uid,
        v: 1,
      };

      // Only include creditLot if it's defined (for promo points)
      if (creditLot) {
        (entry as any).creditLot = creditLot;
      }
      tx.set(LEDGER(uid).doc(actionId), entry);
      return entry;
    });
  },

  async getLedger({
    uid,
    limit,
    cursor,
  }: { uid: string; limit: number; cursor?: string }) {
    let q = LEDGER(uid).orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
      const after = await LEDGER(uid).doc(cursor).get();
      if (after.exists) q = q.startAfter(after);
    }
    const snap = await q.get();
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      nextCursor: snap.docs.length ? snap.docs.at(-1)?.id : undefined,
    };
  },
};
