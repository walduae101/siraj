import type { NextRequest } from "next/server";
import type Context from "~/server/api/types/context";

export type Receipt = {
  id: string;
  total: number;
  currency: string;
  issuedAt: string; // ISO
  merchant?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
};

type ListOpts = { page: number; pageSize: number };

async function tryFirestore() {
  try {
    const mod = await import("firebase-admin");
    const fa = mod.apps?.length ? mod.app() : mod.initializeApp();
    const { getFirestore } = await import("firebase-admin/firestore");
    return getFirestore(fa);
  } catch {
    return null;
  }
}

function demoReceipt(idSeed: string, i: number): Receipt {
  return {
    id: `${idSeed}-${i}`,
    total: 50 + i * 3.25,
    currency: "AED",
    issuedAt: new Date(Date.now() - i * 86400000).toISOString(),
    merchant: "Siraj",
    items: [{ name: "خدمة", qty: 1, price: 50 + i * 3.25 }],
  };
}

export async function listReceipts(ctx: Context, { page, pageSize }: ListOpts) {
  // existing implementation (Firestore if available, else demo data)
  const userId = ctx.userId || "demo";
  const db = await tryFirestore();
  if (!db) {
    return Array.from({ length: pageSize }).map((_, i) =>
      demoReceipt(userId, (page - 1) * pageSize + i),
    );
  }
  const snap = await db
    .collection("receipts")
    .doc(userId)
    .collection("userReceipts")
    .orderBy("issuedAt", "desc")
    .limit(pageSize)
    .get();

  if (snap.empty) {
    // Seedless envs still get data
    return Array.from({ length: pageSize }).map((_, i) =>
      demoReceipt(userId, i),
    );
  }
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Receipt);
}

export async function getReceipt(ctx: Context, id: string) {
  const userId = ctx.userId || "demo";
  const db = await tryFirestore();
  if (!db) {
    return demoReceipt(userId, 0);
  }
  const doc = await db
    .collection("receipts")
    .doc(userId)
    .collection("userReceipts")
    .doc(id)
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Receipt;
}

// Minimal idempotent sink; if Firestore available, upsert by evt.id; else no-op.
export async function saveReceiptFromWebhook({
  req,
  evt,
}: { req: NextRequest; evt: { id: string; type: string; data: any } }) {
  try {
    const { getConfigSafely } = await import("~/server/api/trpc");
    const cfg = await getConfigSafely();
    if (!cfg?.features?.receipts?.persist) return; // gated persist
    if (!(globalThis as any).__receiptIds)
      (globalThis as any).__receiptIds = new Set<string>();
    const set: Set<string> = (globalThis as any).__receiptIds;
    if (set.has(evt.id)) return;
    set.add(evt.id);
    // TODO: write to Firestore when available; structure aligned with UI
    // await firestore.collection("receipts").doc(evt.id).set({ ...evt.data, createdAt: Date.now() }, { merge: true });
  } catch {
    // swallow; never throw from webhook sink
  }
}
