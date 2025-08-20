import { randomUUID } from "node:crypto";

const API = "https://api.paynow.gg/v1";
const STORE_ID = process.env.PAYNOW_STORE_ID ?? "321641745957789696";

function apiKey() {
  const k = (process.env.PAYNOW_API_KEY ?? "")
    .replace(/["']/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
  if (!k) throw new Error("PAYNOW_API_KEY missing");
  if (/[\r\n]/.test(k)) throw new Error("Invalid PAYNOW_API_KEY");
  return k;
}

function headers(idem?: string) {
  return {
    Authorization: `APIKey ${apiKey()}`,
    "content-type": "application/json",
    ...(idem ? { "idempotency-key": idem } : {}),
  };
}

/** Create a hosted checkout for a single product. Returns { url, checkoutId } */
export async function createCheckoutSession(opts: {
  productId: string;
  qty?: number;
  uid: string; // for metadata
  successUrl: string;
  cancelUrl: string;
}) {
  const idem = `chk_${opts.uid}_${opts.productId}_${Date.now()}`;
  const body = {
    storeId: STORE_ID,
    lineItems: [{ productId: opts.productId, quantity: opts.qty ?? 1 }],
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
    metadata: { uid: opts.uid }, // comes back in webhook
  };

  const res = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: headers(idem),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PayNow checkout failed: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return {
    url: data?.url ?? data?.hostedUrl ?? "",
    checkoutId: data?.id ?? "",
  };
}
