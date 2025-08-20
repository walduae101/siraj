"use client";
import { WalletWidget } from "~/components/points/WalletWidget";

export default function Success() {
  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Purchase complete</h1>
      <p>Your wallet has been updated. Thank you!</p>
      <WalletWidget />
      <a href="/account/points" className="inline-block mt-4 underline">View full history</a>
    </main>
  );
}
