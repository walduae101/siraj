import { env } from "~/env-combined";
import { PAYNOW_PRODUCTS, type PayNowSku, isSubscription } from "./paynowProducts";
import type { Firestore } from "firebase-admin/firestore";

const BASE = "https://api.paynow.gg/v1/management";

function cleanKey(raw?: string) {
  return (raw ?? "").replace(/["'\r\n]/g, "").trim();
}

function authHeader() {
  const key = cleanKey(env.PAYNOW_API_KEY);
  if (!key) throw new Error("PAYNOW_API_KEY missing");
  return { 
    Authorization: `apikey ${key}`, 
    Accept: "application/json", 
    "Content-Type": "application/json" 
  };
}

function storeId() {
  const id = cleanKey(env.NEXT_PUBLIC_PAYNOW_STORE_ID || "321641745957789696");
  if (!id) throw new Error("PAYNOW_STORE_ID missing");
  return id;
}

// ⚠️ Never log full api keys
const redact = (s: string) => (s.length > 8 ? `${s.slice(0,2)}***${s.slice(-4)}` : "***");

export type CreateCheckoutInput = {
  uid: string;           // our user id
  sku: PayNowSku;        // which product
  qty?: number;          // default 1
  name?: string;         // optional customer name
  email?: string;        // optional customer email
};

export class PayNowService {
  // You already persist userMappings; reuse it. If path differs, adjust here.
  static async getOrCreateCustomerId(db: Firestore, uid: string, name?: string, email?: string) {
    const ref = db.collection("userMappings").doc(uid);
    const snap = await ref.get();
    const existing = snap.exists ? (snap.data()?.paynowCustomerId as string | undefined) : undefined;
    if (existing) return existing;

    // Create a PayNow customer (minimal — name/metadata only)
    const sid = storeId();
    const res = await fetch(`${BASE}/stores/${sid}/customers`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: name ?? uid,
        metadata: { firebase_uid: uid, email },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[paynow] create customer failed", { status: res.status, body: body?.slice(0, 500) });
      throw new Error("Failed to create PayNow customer");
    }
    const json = await res.json() as { id: string };
    await ref.set({ paynowCustomerId: json.id }, { merge: true });
    return json.id;
  }

  static async createCheckout(db: Firestore, input: CreateCheckoutInput) {
    const sid = storeId();
    const customerId = await this.getOrCreateCustomerId(db, input.uid, input.name, input.email);
    const productId = PAYNOW_PRODUCTS[input.sku];
    if (!productId) throw new Error(`Unknown SKU: ${input.sku}`);

    const lines = [{
      product_id: productId,
      quantity: Math.max(1, input.qty ?? 1),
      ...(isSubscription(input.sku) ? { subscription: true } : {}),
    }];

    const res = await fetch(`${BASE}/stores/${sid}/checkout`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ customer_id: customerId, lines }),
    });

    if (!res.ok) {
      // Forward PayNow error detail up to client (without secrets)
      let detail: any = undefined;
      try { detail = await res.json(); } catch { detail = await res.text(); }
      console.error("[paynow] checkout failed", { status: res.status, detail: typeof detail === "string" ? detail.slice(0,500) : detail });
      // Translate 4xx to a clean error
      throw new Error(typeof detail === "object" && detail?.message ? detail.message : `PayNow error ${res.status}`);
    }

    const json = await res.json() as { id: string; url: string };
    return json; // { id, url }
  }
}
