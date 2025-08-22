"use client";
import { getAuth } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";
import { features } from "~/config/features";
import { api } from "~/trpc/react";
import "~/lib/firebase/client";

export default function CheckoutStartPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutStartContent />
    </Suspense>
  );
}

function CheckoutStartContent() {
  const sp = useSearchParams();
  const sku = sp.get("sku") as string | null;
  const qty = Number(sp.get("qty") ?? 1) || 1;
  const nonce = React.useMemo(
    () => crypto.randomUUID().replace(/-/g, "").slice(0, 8),
    [],
  );
  const [uid, setUid] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const auth = getAuth();
      setUid(auth.currentUser?.uid ?? "");
    } catch {
      // ignore; stays empty if not signed in
    }
  }, []);

  const allowedSkus = [
    "points_20",
    "points_50",
    "points_150",
    "points_500",
    "sub_basic_monthly",
    "sub_pro_monthly",
    "sub_basic_annual",
    "sub_pro_annual",
  ] as const;
  type Sku = (typeof allowedSkus)[number];
  const validSku = allowedSkus.includes(sku as Sku) ? (sku as Sku) : undefined;

  // Skip preview for live checkout - go directly to PayNow
  const data = null;
  const isLoading = false;
  const error = null;

  const router = useRouter();
  const createCheckout = api.checkout?.create.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url; // Redirect to PayNow hosted checkout
      }
    },
  }) || { mutate: () => {}, isPending: false, error: null };

  // Early returns after all hooks are called
  if (!api.checkout) {
    return <p>Checkout system not available</p>;
  }
  if (!validSku) {
    return <p>Invalid SKU</p>;
  }

  const onConfirm = () => {
    if (!uid) {
      alert("Please sign in first.");
      return;
    }
    createCheckout.mutate({
      sku: validSku, // Use SKU mapping
      qty,
    });
  };

  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Processing Checkout</h1>
      <div className="rounded-xl border p-4">
        <p className="mb-2">
          Product: <b>{validSku}</b>
        </p>
        <p className="mb-2">
          Quantity: <b>{qty}</b>
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={onConfirm}
        disabled={createCheckout.isPending}
        aria-busy={createCheckout.isPending}
      >
        {createCheckout.isPending
          ? "Redirecting to PayNow…"
          : "Proceed to Payment"}
      </button>
      {createCheckout.error && (
        <p className="text-red-600 text-sm">{createCheckout.error.message}</p>
      )}
    </main>
  );
}
