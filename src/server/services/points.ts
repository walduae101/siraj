import { db } from "../firebase/admin"; // server-only admin
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

const WALLETS = (uid: string) => db.collection("users").doc(uid).collection("wallet").doc("points");
const LEDGER  = (uid: string) => db.collection("users").doc(uid).collection("ledger");

function nowTs() { return Timestamp.now(); }

export const pointsService = {
  async getWallet(uid: string) {
    const snap = await WALLETS(uid).get();
    if (!snap.exists) {
      const init = {
        paidBalance: 0, promoBalance: 0, promoLots: [],
        createdAt: nowTs(), updatedAt: nowTs(), v: 1,
      };
      await WALLETS(uid).set(init);
      return init;
    }
    return snap.data();
  },

  async previewSpend({ uid, cost }: {uid: string; cost: number}) {
    const w = await this.getWallet(uid);
    if (!w) throw new Error('Wallet not found');
    let remaining = cost;
    const lots = [...w.promoLots].sort((a,b)=>a.expiresAt.toMillis()-b.expiresAt.toMillis());
    const consume: {lotId:string; amount:number; expiresAt:number}[] = [];
    for (const lot of lots) {
      if (remaining<=0) break;
      const take = Math.min(remaining, lot.amountRemaining);
      if (take>0) {
        consume.push({lotId: lot.id, amount: take, expiresAt: lot.expiresAt.toMillis()});
        remaining -= take;
      }
    }
    const fromPromo = cost - remaining;
    const fromPaid = Math.max(0, remaining);
    const ok = fromPromo + fromPaid <= (w.promoBalance + w.paidBalance);
    const soon = consume.find(c => c.expiresAt - Date.now() < 7*86400_000) ? true : false;
    return {
      ok,
      cost,
      payBreakdown: { promo: fromPromo, paid: fromPaid },
      pre: { paid: w.paidBalance, promo: w.promoBalance },
      post: ok ? { paid: w.paidBalance - fromPaid, promo: w.promoBalance - fromPromo } : null,
      expiryWarning: soon,
      lots: consume,
    };
  },

  async spend({ uid, cost, action, actionId }: {uid:string; cost:number; action:string; actionId:string}) {
    return await db.runTransaction(async (tx) => {
      const ref = WALLETS(uid);
      const snap = await tx.get(ref);
      const w = snap.exists ? snap.data()! : {
        paidBalance: 0, promoBalance: 0, promoLots: [],
        createdAt: nowTs(), updatedAt: nowTs(), v: 1,
      };
      const dup = await tx.get(LEDGER(uid).doc(actionId));
      if (dup.exists) return dup.data();

      let remaining = cost;
      const lots = [...w.promoLots].sort((a,b)=>a.expiresAt.toMillis()-b.expiresAt.toMillis());
      const consumed: { lotId:string; amount:number }[] = [];

      for (const lot of lots) {
        if (lot.expiresAt.toMillis() <= Date.now()) continue;
        if (remaining<=0) break;
        const take = Math.min(remaining, lot.amountRemaining);
        if (take>0) {
          lot.amountRemaining -= take;
          remaining -= take;
          consumed.push({ lotId: lot.id, amount: take });
        }
      }

      const fromPromo = cost - remaining;
      if (fromPromo > w.promoBalance) throw new Error("Inconsistent promo balance");
      let fromPaid = 0;

      if (remaining > 0) {
        if (remaining > w.paidBalance) throw new Error("INSUFFICIENT_POINTS");
        fromPaid = remaining;
        w.paidBalance -= fromPaid;
        remaining = 0;
      }

      w.promoLots = w.promoLots
        .map((l: any) => {
          const upd = lots.find(x=>x.id===l.id) ?? l;
          return upd;
        })
        .filter((l: any) => l.amountRemaining > 0 && l.expiresAt.toMillis() > Date.now());
      w.promoBalance = w.promoLots.reduce((s: number, l: any) => s + l.amountRemaining, 0);

      const pre = { paid: snap.exists ? snap.data()!.paidBalance : 0,
                    promo: snap.exists ? snap.data()!.promoBalance : 0 };
      const post = { paid: w.paidBalance, promo: w.promoBalance };

      w.updatedAt = nowTs();
      tx.set(ref, w, { merge: true });

      const entry = {
        type: "debit", channel: fromPaid>0 ? "paid":"promo",
        amount: cost, action, actionId,
        pre, post,
        consumedLots: consumed,
        createdAt: nowTs(), createdBy: uid, v: 1,
      };
      tx.set(LEDGER(uid).doc(actionId), entry);
      return entry;
    });
  },

  async credit({ uid, kind, amount, source, expiresAt, actionId }:{
    uid:string; kind:"paid"|"promo"; amount:number; source:string; expiresAt?:Date; actionId:string;
  }) {
    return await db.runTransaction(async (tx)=>{
      const ref = WALLETS(uid);
      const snap = await tx.get(ref);
      const w = snap.exists ? snap.data()! : {
        paidBalance: 0, promoBalance: 0, promoLots: [],
        createdAt: nowTs(), updatedAt: nowTs(), v: 1,
      };
      const dup = await tx.get(LEDGER(uid).doc(actionId));
      if (dup.exists) return dup.data();

      const pre = { paid: w.paidBalance, promo: w.promoBalance };

      let creditLot: any = undefined;
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
        w.promoLots.sort((a: any, b: any) => a.expiresAt.toMillis() - b.expiresAt.toMillis());
        w.promoBalance = w.promoLots.reduce((s: number, l: any) => s + l.amountRemaining, 0);
      }

      const post = { paid: w.paidBalance, promo: w.promoBalance };
      w.updatedAt = nowTs();
      if (!snap.exists) w.createdAt = nowTs();
      tx.set(ref, w, { merge: true });

      const entry = {
        type: "credit",
        channel: kind,
        amount,
        action: `credit.${source}`,
        actionId,
        pre, post,
        creditLot,
        createdAt: nowTs(),
        createdBy: uid, v: 1,
      };
      tx.set(LEDGER(uid).doc(actionId), entry);
      return entry;
    });
  },

  async getLedger({ uid, limit, cursor }:{uid:string; limit:number; cursor?:string}) {
    let q = LEDGER(uid).orderBy("createdAt","desc").limit(limit);
    if (cursor) {
      const after = await LEDGER(uid).doc(cursor).get();
      if (after.exists) q = q.startAfter(after);
    }
    const snap = await q.get();
    return {
      items: snap.docs.map(d=>({ id: d.id, ...d.data() })),
      nextCursor: snap.docs.length ? snap.docs.at(-1)!.id : undefined,
    };
  },
};
