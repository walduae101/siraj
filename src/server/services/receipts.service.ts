export type Receipt = {
  id: string;
  total: number;
  currency: string;
  issuedAt: string; // ISO
  merchant?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
};

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
    items: [
      { name: "خدمة", qty: 1, price: 50 + i * 3.25 },
    ],
  };
}

export async function listReceipts(userId: string, page = 1, pageSize = 20): Promise<Receipt[]> {
  const db = await tryFirestore();
  if (!db) {
    return Array.from({ length: pageSize }).map((_, i) => demoReceipt(userId, (page - 1) * pageSize + i));
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
    return Array.from({ length: pageSize }).map((_, i) => demoReceipt(userId, i));
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Receipt));
}

export async function getReceipt(userId: string, receiptId: string): Promise<Receipt | null> {
  const db = await tryFirestore();
  if (!db) {
    return demoReceipt(userId, 0);
  }
  const doc = await db
    .collection("receipts")
    .doc(userId)
    .collection("userReceipts")
    .doc(receiptId)
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Receipt;
}
