"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { features } from "~/config/features";
import { getAuth } from "firebase/auth";
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
  const nonce = React.useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const [uid, setUid] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const auth = getAuth();
      setUid(auth.currentUser?.uid ?? "");
    } catch {
      // ignore; stays empty if not signed in
    }
  }, []);

  if (!features.stubCheckout || !api.checkout) {
    return <p>Checkout disabled</p>;
  }

  const allowedSkus = [
    "points_1000",
    "points_5000",
    "points_10000",
    "sub_monthly",
    "sub_yearly",
  ] as const;
  type Sku = typeof allowedSkus[number];
  const validSku = allowedSkus.includes(sku as Sku) ? (sku as Sku) : undefined;
  if (!validSku) {
    return <p>Invalid SKU</p>;
  }
  const { data, isLoading, error } = api.checkout.preview.useQuery(
    { sku: validSku, qty },
    { enabled: features.stubCheckout && !!validSku }
  );

  const router = useRouter();
  const complete = api.checkout.complete.useMutation({
    onSuccess: () => router.push("/checkout/success"),
  });

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
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Confirm Purchase</h1>
      <div className="rounded-xl border p-4">
        <p className="mb-2">SKU: <b>{data.sku}</b></p>
        <p className="mb-2">Qty: <b>{data.qty}</b></p>
        <p className="mb-2">Total: <b>{data.line.total} {data.currency}</b></p>
        {data.grant.type === "points" ? (
          <p>Grant: <b>{data.grant.amount}</b> points (perpetual)</p>
        ) : (
          <p>Grant: <b>{data.grant.days}</b> days subscription</p>
        )}
      </div>
      <button
        className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-50"
        onClick={onConfirm}
        disabled={complete.isPending}
        aria-busy={complete.isPending}
      >
        {complete.isPending ? "Processing…" : "Confirm (stub)"}
      </button>
      {complete.error && <p className="text-red-600 text-sm">{complete.error.message}</p>}
    </main>
  );
}
