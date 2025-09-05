"use client";
import { WalletWidget } from "./WalletWidget";

export default function ClientWallet({
  locale = "en",
}: { locale?: "en" | "ar" }) {
  return <WalletWidget locale={locale} />;
}

