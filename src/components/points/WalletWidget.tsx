"use client";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { features } from "~/config/features";
import { fmtNum } from "~/lib/i18n/num";
import { t } from "~/lib/i18n/t";
import { api } from "~/trpc/react";

export function WalletWidget({ locale = "ar" }: { locale?: string }) {
  const { user } = useFirebaseUser();
  const safeLocale: "en" | "ar" = locale === "ar" ? "ar" : "en";
  const tt = t(safeLocale);
  const { data } = api.points?.getWallet.useQuery(
    { uid: user?.uid || "" },
    {
      staleTime: 10_000,
      enabled: features.pointsClient && !!api.points && !!user?.uid, // Only run when all conditions are met
    },
  ) || { data: undefined };

  // Early returns after all hooks are called
  if (!features.pointsClient || !api.points || !user?.uid) return null;
  if (!data) return null;
  const soonest = data.promoLots
    ?.filter((l: any) => l.amountRemaining > 0)
    ?.sort(
      (a: any, b: any) => a.expiresAt.toMillis() - b.expiresAt.toMillis(),
    )[0];
  const Dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div dir={Dir} className="flex flex-col gap-2 rounded-2xl border p-4">
      <div className="flex items-center gap-4">
        <span className="text-xs opacity-70">
          {tt("wallet.paid", "مدفوعة")}
        </span>
        <span className="font-bold text-lg">
          {fmtNum(data.paidBalance, safeLocale)}
        </span>
        <span className="text-xs opacity-70">
          {tt("wallet.promo", "ترويجية")}
        </span>
        <span className="font-bold text-lg">
          {fmtNum(data.promoBalance, safeLocale)}
        </span>
        {soonest && (
          <span className="text-amber-600 text-xs">
            {tt("wallet.earliestExpiry", "أقرب انتهاء")}:{" "}
            {soonest.expiresAt.toDate().toLocaleDateString(locale)}
          </span>
        )}
      </div>
    </div>
  );
}
