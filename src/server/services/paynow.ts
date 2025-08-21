import { TRPCError } from "@trpc/server";
import type { Firestore } from "firebase-admin/firestore";
import { env } from "~/env-server";
import {
  PAYNOW_PRODUCTS,
  type PayNowSku,
  isSubscription,
} from "./paynowProducts";

const BASE = "https://api.paynow.gg/v1";
const STORE_ID = env.PAYNOW_STORE_ID;

function authHeaders() {
  // "apikey " prefix is case-insensitive; make sure no newlines in the secret
  const key = (env.PAYNOW_API_KEY ?? "").replace(/[^\x20-\x7E]/g, "").trim();
  return {
    Authorization: `apikey ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function headers() {
  return authHeaders();
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), raw: text };
  } catch {
    return { json: null, raw: text };
  }
}

export type CreateCheckoutInput = {
  uid: string; // our user id
  sku: PayNowSku; // which product
  qty?: number; // default 1
  name?: string; // optional customer name
  email?: string; // optional customer email
};

export class PayNowService {
  static async getOrCreateCustomerId(
    db: Firestore,
    uid: string,
    name?: string,
    email?: string,
  ) {
    const ref = db.collection("userMappings").doc(uid);
    const snap = await ref.get();
    const existing = snap.exists
      ? (snap.data()?.paynowCustomerId as string | undefined)
      : undefined;
    if (existing) return existing;

    // Create customer with only allowed fields (email in metadata)
    const body = {
      name: name?.slice(0, 64) ?? uid,
      metadata: { uid, ...(email ? { email } : {}) },
    };

    const res = await fetch(`${BASE}/v1/stores/${STORE_ID}/customers`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    const { json, raw } = await readJson(res);
    if (!res.ok) {
      console.error("[paynow] create customer failed", {
        status: res.status,
        body: raw?.slice(0, 400),
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `PayNow create customer failed (${res.status})`,
        cause: raw?.slice(0, 400),
      });
    }

    const customerId = (json as { id: string })?.id;
    if (!customerId) throw new Error("No customer ID in response");

    await ref.set({ paynowCustomerId: customerId }, { merge: true });
    return customerId;
  }

  static async createCheckout(db: Firestore, input: CreateCheckoutInput) {
    const customerId = await this.getOrCreateCustomerId(
      db,
      input.uid,
      input.name,
      input.email,
    );
    const productId = PAYNOW_PRODUCTS[input.sku];
    if (!productId) throw new Error(`Unknown SKU: ${input.sku}`);

    const body = {
      lines: [
        {
          product_id: productId,
          quantity: Math.max(1, input.qty ?? 1),
          ...(isSubscription(input.sku) ? { subscription: true } : {}),
        },
      ],
      customer_id: customerId,
      auto_redirect: false, // we'll redirect client-side
      return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://siraj.life"}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://siraj.life"}/paywall`,
    };

    const res = await fetch(`${BASE}/v1/stores/${STORE_ID}/checkouts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    const { json, raw } = await readJson(res);
    if (!res.ok) {
      console.error("[paynow] checkout failed", {
        status: res.status,
        body: raw?.slice(0, 400),
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `PayNow create checkout failed (${res.status})`,
        cause: raw?.slice(0, 400),
      });
    }

    return json as { id: string; url: string; token?: string };
  }
}

/**
 * Fetch order by checkout ID for payment completion
 */
export async function getOrderByCheckoutId(
  storeId: string,
  checkoutId: string,
) {
  const url = `${BASE}/stores/${storeId}/orders?checkout_id=${encodeURIComponent(checkoutId)}&limit=1`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`PayNow orders fetch failed: ${res.status}`);
  const data = await res.json();
  // API returns {orders: Order[]}
  return Array.isArray(data?.orders) ? (data.orders[0] ?? null) : null;
}
