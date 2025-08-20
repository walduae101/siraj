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
    () => Math.random().toString(36).slice(2, 10),
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
    "points_1000",
    "points_5000",
    "points_10000",
    "sub_monthly",
    "sub_yearly",
  ] as const;
  type Sku = (typeof allowedSkus)[number];
  const validSku = allowedSkus.includes(sku as Sku) ? (sku as Sku) : undefined;

  const { data, isLoading, error } = api.checkout?.preview.useQuery(
    { sku: validSku || "points_1000", qty },
    { enabled: features.stubCheckout && !!api.checkout && !!validSku },
  ) || { data: undefined, isLoading: false, error: null };

  const router = useRouter();
  const complete = api.checkout?.complete.useMutation({
    onSuccess: () => router.push("/checkout/success"),
  }) || { mutate: () => {}, isPending: false, error: null };

  // Early returns after all hooks are called
  if (!features.stubCheckout || !api.checkout) {
    return <p>Checkout disabled</p>;
  }
  if (!validSku) {
    return <p>Invalid SKU</p>;
  }

  const onConfirm = () => {
    if (!uid) {
      alert("Please sign in first.");
      return;
    }
    complete.mutate({ sku: validSku, qty, nonce, uid }); // ✅ pass uid
  };

  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p>Failed to load.</p>;

  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Confirm Purchase</h1>
      <div className="rounded-xl border p-4">
        <p className="mb-2">
          SKU: <b>{data.sku}</b>
        </p>
        <p className="mb-2">
          Qty: <b>{data.qty}</b>
        </p>
        <p className="mb-2">
          Total:{" "}
          <b>
            {data.line.total} {data.currency}
          </b>
        </p>
        {data.grant.type === "points" ? (
          <p>
            Grant: <b>{data.grant.amount}</b> points (perpetual)
          </p>
        ) : (
          <p>
            Grant: <b>{data.grant.days}</b> days subscription
          </p>
        )}
      </div>
      <button
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={onConfirm}
        disabled={complete.isPending}
        aria-busy={complete.isPending}
      >
        {complete.isPending ? "Processing…" : "Confirm (stub)"}
      </button>
      {complete.error && (
        <p className="text-red-600 text-sm">{complete.error.message}</p>
      )}
    </main>
  );
}
