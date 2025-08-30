import { api } from "~/trpc/react";

export const dynamic = "force-dynamic";

export default function PaymentsPage() {
  // If you already expose feature flags via a tRPC endpoint or config hook, use it.
  // For now, read from a public endpoint or assume false to show "Coming soon".
  // TODO: wire to real feature flag endpoint (features.paynow.enabled)
  const payNowEnabled = false;

  return (
    <main className="container max-w-4xl py-6" dir="rtl">
      <h1 className="font-semibold text-2xl">المدفوعات</h1>
      {!payNowEnabled ? (
        <div className="mt-4 rounded-lg border p-4">
          <div className="font-medium">PayNow قريباً</div>
          <p className="mt-1 text-muted-foreground text-sm">
            نحن ننهي تكامل بوابة الدفع. ستتمكن من إضافة طريقة دفع والدفع بالدرهم
            الإماراتي.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border p-4">
          <div className="font-medium">إضافة طريقة دفع</div>
          <p className="mt-1 text-muted-foreground text-sm">
            ادفع بأمان مع PayNow.
          </p>
          {/* TODO: Insert real PayNow entry point when enabled */}
        </div>
      )}
    </main>
  );
}
