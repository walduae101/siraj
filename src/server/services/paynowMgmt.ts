import { TRPCError } from "@trpc/server";
// Minimal, robust PayNow Management client
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { getConfig } from "~/server/config";

const API = "https://api.paynow.gg";

function clean(key: string) {
  return (key ?? "").replace(/["'\r\n]/g, "").trim();
}

function headers() {
  const cfg = getConfig();
  const apiKey = clean(cfg.paynow.apiKey);
  if (!apiKey) throw new Error("PayNow API key missing in config");
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
  opts: { name?: string; email?: string } = {},
) {
  // Check userMappings collection first
  const userMappingRef = db.collection("userMappings").doc(uid);
  const userMapping = await userMappingRef.get();
  if (userMapping.exists && userMapping.data()?.paynowCustomerId) {
    return userMapping.data()!.paynowCustomerId as string;
  }

  // Create a customer (management API)
  const cfg = getConfig();
  const storeId = clean(cfg.paynow.storeId);
  const res = await fetch(`${API}/v1/stores/${storeId}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: opts.name || uid,
      metadata: { uid, email: opts.email },
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
  const customerId = json?.id as string;

  // Store mappings in both collections for proper indexing
  await userMappingRef.set(
    {
      paynowCustomerId: customerId,
      email: opts.email ?? null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await db
    .collection("paynowCustomers")
    .doc(customerId)
    .set(
      {
        uid,
        email: opts.email ?? null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

  return customerId;
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
        quantity: Math.max(1, args.qty ?? 1),
      },
    ],
  };

  const cfg = getConfig();
  const storeId = clean(cfg.paynow.storeId);
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
  const cfg = getConfig();
  const storeId = clean(cfg.paynow.storeId);
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
      quantity: number;
    }>;
    is_subscription: boolean;
    customer?: {
      metadata?: {
        uid?: string;
        email?: string;
      };
    };
  }>;
}
