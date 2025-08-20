// Minimal, robust PayNow Management client
import { env } from "~/env-server";
import type { Firestore } from "firebase-admin/firestore";
import { TRPCError } from "@trpc/server";

const API = "https://api.paynow.gg";

function clean(key: string) {
  return (key ?? "").replace(/["'\r\n]/g, "").trim();
}

const apiKey = clean(env.PAYNOW_API_KEY);
const storeId = clean(env.PAYNOW_STORE_ID);

function headers() {
  if (!apiKey) throw new Error("PAYNOW_API_KEY missing");
  return {
    "content-type": "application/json",
    // 'apikey' is case-insensitive per docs
    Authorization: `apikey ${apiKey}`,
  };
}

// Create (or reuse) a PayNow customer and cache id by uid in Firestore
export async function ensureCustomerId(
  db: Firestore, 
  uid: string, 
  opts: { name?: string; email?: string } = {}
) {
  const ref = db.collection("paynowCustomers").doc(uid);
  const cached = await ref.get();
  if (cached.exists && cached.data()?.id) {
    return cached.data()!.id as string;
  }

  // Create a customer (management API)
  const res = await fetch(`${API}/v1/stores/${storeId}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ 
      name: opts.name || uid, 
      metadata: { uid, email: opts.email } 
    }),
  });
  
  if (!res.ok) {
    const bodyText = await res.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `PayNow create customer failed: ${res.status}`,
      cause: bodyText,
    });
  }
  
  const json = await res.json();
  const id = json?.id as string;
  await ref.set(
    { id, uid, email: opts.email ?? null, createdAt: Date.now() }, 
    { merge: true }
  );
  return id;
}

// Create checkout (management API) — returns hosted checkout URL
export async function createCheckout(args: {
  customerId: string;
  productId: string;
  qty?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const body = {
    customer_id: args.customerId,
    return_url: args.successUrl,
    cancel_url: args.cancelUrl,
    auto_redirect: false,
    lines: [
      { 
        product_id: args.productId, 
        quantity: Math.max(1, args.qty ?? 1) 
      }
    ],
  };
  
  const res = await fetch(`${API}/v1/stores/${storeId}/checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const bodyText = await res.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `PayNow create checkout failed: ${res.status}`,
      cause: bodyText,
    });
  }
  
  return res.json() as Promise<{ id: string; url: string }>;
}

// Get order (to verify on success page if needed)
export async function getOrder(orderId: string) {
  const res = await fetch(`${API}/v1/stores/${storeId}/orders/${orderId}`, {
    headers: headers(),
  });
  
  if (!res.ok) {
    const bodyText = await res.text();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `PayNow get order failed: ${res.status}`,
      cause: bodyText,
    });
  }
  
  return res.json() as Promise<{ 
    id: string; 
    status: string; 
    payment_state?: string;
    pretty_id?: string;
    lines: Array<{ 
      product_id: string; 
      quantity: number 
    }>; 
    is_subscription: boolean;
    customer?: {
      metadata?: {
        uid?: string;
        email?: string;
      }
    }
  }>;
}
