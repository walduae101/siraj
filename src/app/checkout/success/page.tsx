"use client";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { WalletWidget } from "~/components/points/WalletWidget";
import { api } from "~/trpc/react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") || "";
  const checkoutId = params.get("checkout_id") || "";
  const complete = api.checkout?.complete.useMutation();

  React.useEffect(() => {
    const id = orderId || checkoutId;
    if (id && complete && !complete.isSuccess && !complete.isPending) {
      complete.mutate({ orderId, checkoutId });
    }
  }, [orderId, checkoutId, complete]);

  if (!complete) {
    return (
      <main className="container mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="font-semibold text-2xl">Purchase complete</h1>
        <p>Loading checkout system...</p>
      </main>
    );
  }

  if (complete.isPending) {
    return (
      <main className="container mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="font-semibold text-2xl">Purchase complete</h1>
        <p>Syncing your purchase...</p>
        <div className="h-4 animate-pulse rounded bg-gray-200" />
      </main>
    );
  }

  if (complete.isError) {
    return (
      <main className="container mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="font-semibold text-2xl">Purchase complete</h1>
        <p className="text-red-600">
          There was an issue processing your purchase. Please contact support if
          points don't appear in your wallet.
        </p>
        <p className="text-gray-500 text-sm">
          Error: {complete.error?.message}
        </p>
        <WalletWidget />
        <a href="/account/points" className="mt-4 inline-block underline">
          View full history
        </a>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Purchase complete</h1>
      {complete.isSuccess && complete.data && (
        <p className="text-green-600">
          Your wallet has been updated with {complete.data.credited} points.
          Thank you!
        </p>
      )}
      <WalletWidget />
      <a href="/account/points" className="mt-4 inline-block underline">
        View full history
      </a>
    </main>
  );
}

export default function Success() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-2xl space-y-6 p-6">
          <h1 className="font-semibold text-2xl">Purchase complete</h1>
          <p>Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
