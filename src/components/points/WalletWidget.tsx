"use client";
import { t } from '~/lib/i18n/t';
import { features } from '~/config/features';
import { fmtNum } from '~/lib/i18n/num';
import { api } from '~/trpc/react';

export function WalletWidget({ uid = 'me', locale = 'ar' }: { uid?: string; locale?: string }) {
  if (!features.pointsClient || !api.points) return null;
  const safeLocale: "en" | "ar" = locale === "ar" ? "ar" : "en";
  const tt = t(safeLocale);
  const { data } = api.points.getWallet.useQuery({ uid }, { staleTime: 10_000 });
  if (!data) return null;
  const soonest = data.promoLots?.filter((l: any) => l.amountRemaining > 0)?.sort((a: any, b: any) => a.expiresAt.toMillis() - b.expiresAt.toMillis())[0];
  const Dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div dir={Dir} className="rounded-2xl border p-4 flex flex-col gap-2">
      <div className="flex gap-4 items-center">
        <span className="text-xs opacity-70">{tt('wallet.paid', 'مدفوعة')}</span>
        <span className="font-bold text-lg">{fmtNum(data.paidBalance, safeLocale)}</span>
        <span className="text-xs opacity-70">{tt('wallet.promo', 'ترويجية')}</span>
        <span className="font-bold text-lg">{fmtNum(data.promoBalance, safeLocale)}</span>
        {soonest && (
          <span className="text-xs text-amber-600">
            {tt('wallet.earliestExpiry', 'أقرب انتهاء')}: {soonest.expiresAt.toDate().toLocaleDateString(locale)}
          </span>
        )}
      </div>
    </div>
  );
}
