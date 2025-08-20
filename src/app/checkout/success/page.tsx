"use client";
import { WalletWidget } from "~/components/points/WalletWidget";

export default function Success() {
  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Purchase complete</h1>
      <p>Your wallet has been updated. Thank you!</p>
      <WalletWidget />
      <a href="/account/points" className="mt-4 inline-block underline">
        View full history
      </a>
    </main>
  );
}
