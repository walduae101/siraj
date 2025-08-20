"use client";
import { features } from "~/config/features";
import { fmtNum } from "~/lib/i18n/num";
import { t } from "~/lib/i18n/t";
import { pricing } from "~/lib/pricing";

import { WalletWidget } from "~/components/points/WalletWidget";
import { Button } from "~/components/ui/button";
import { BuyButton } from "~/components/paywall/BuyButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

function fmtCurrency(value: number, locale?: string, currency?: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "AED",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency ?? "AED"}`;
  }
}

export default function PaywallPage() {
  const on = features.pointsClient;
  const currency = pricing.currency;
  const rawLocale =
    typeof navigator === "undefined" ? "en" : navigator.language;
  const locale: "en" | "ar" = rawLocale.startsWith("ar") ? "ar" : "en";
  const tt = t(locale);

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl">
          النقاط والاشتراك · Points & Subscription
        </h1>
        <p className="text-sm opacity-80">
          {tt(
            "paywall.intro",
            "اختر ما يناسبك — نقاط دائمة لا تنتهي، أو اشتراك زمني منفصل.",
          )}
        </p>
      </div>
      <WalletWidget locale={locale} />
      {!on && (
        <div className="rounded-2xl border p-4 text-sm">
          {tt("points.off", "النقاط غير مفعّلة في هذه البيئة.")}
        </div>
      )}
      <section aria-labelledby="points-title" className="space-y-4">
        <h2 id="points-title" className="font-semibold text-xl">
          {tt("paywall.pointsTitle", "نقاط دائمة (مدفوعة) · Perpetual Points")}
        </h2>
        <p className="text-sm opacity-80">
          {tt(
            "paywall.pointsSubtitle",
            "النقاط المدفوعة لا تنتهي صلاحيتها. نعرض التكلفة بوضوح قبل أي خصم.",
          )}
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.p20.title", "٢٠ نقطة - حزمة المبتدئين")}</CardTitle>
              <CardDescription>
                {tt("paywall.p20.desc", "للتجربة والبداية، صالحة للأبد.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p20, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.fairness", "شفافية: سنعرض التكلفة قبل الخصم.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="points_20"
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  {tt("paywall.buy", "شراء")}
                </BuyButton>
              ) : (
                <Button
                  asChild
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  <a href={"/checkout/start?sku=points_1000&qty=1"}>
                    {tt("paywall.buy", "شراء")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.p50.title", "٥٠ نقطة - حزمة ٥٠")}</CardTitle>
              <CardDescription>
                {tt("paywall.p50.desc", "سعر أوفر، صالحة للأبد.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p50, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.neverExpires", "النقاط المدفوعة لا تنتهي.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="points_50"
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  {tt("paywall.buy", "شراء")}
                </BuyButton>
              ) : (
                <Button
                  asChild
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  <a href={"/checkout/start?sku=points_5000&qty=1"}>
                    {tt("paywall.buy", "شراء")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.p150.title", "١٥٠ نقطة - حزمة ١٥٠")}</CardTitle>
              <CardDescription>
                {tt("paywall.p150.desc", "قيمة ممتازة، صالحة للأبد.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p150, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.transparency", "نوضح الرصيد قبل/بعد أي عملية.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="points_150"
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  {tt("paywall.buy", "شراء")}
                </BuyButton>
              ) : (
                <Button
                  asChild
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  <a href={"/checkout/start?sku=points_10000&qty=1"}>
                    {tt("paywall.buy", "شراء")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.p500.title", "٥٠٠ نقطة - حزمة ٥٠٠")}</CardTitle>
              <CardDescription>
                {tt("paywall.p500.desc", "أفضل قيمة، صالحة للأبد.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p500, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.bestValue", "أفضل قيمة للنقاط.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="points_500"
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  {tt("paywall.buy", "شراء")}
                </BuyButton>
              ) : (
                <Button
                  asChild
                  aria-label={tt("paywall.buyPoints", "اشترِ النقاط")}
                >
                  <a href={"/checkout/start?sku=points_10000&qty=1"}>
                    {tt("paywall.buy", "شراء")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
      <section aria-labelledby="subs-title" className="space-y-4">
        <h2 id="subs-title" className="font-semibold text-xl">
          {tt(
            "paywall.subsTitle",
            "اشتراك زمني منفصل · Time-based Subscription",
          )}
        </h2>
        <p className="text-sm opacity-80">
          {tt(
            "paywall.subsSubtitle",
            "الاشتراك يمنحك مزايا زمنية؛ لا يخلط مع رصيد النقاط.",
          )}
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.basicMonthly", "خطة أساسية شهرية")}</CardTitle>
              <CardDescription>
                {tt("paywall.basicMonthlyDesc", "للاستخدام الأساسي والتجربة.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.basicMonthly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.cancelAnytime", "يمكن الإلغاء في أي وقت.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="sub_basic_m"
                  aria-label={tt("paywall.subscribe", "اشترك")}
                >
                  {tt("paywall.subscribe", "اشتراك")}
                </BuyButton>
              ) : (
                <Button asChild aria-label={tt("paywall.subscribe", "اشترك")}>
                  <a href={"/checkout/start?sku=sub_monthly&qty=1"}>
                    {tt("paywall.subscribe", "اشتراك")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.proMonthly", "خطة احترافية شهرية")}</CardTitle>
              <CardDescription>
                {tt("paywall.proMonthlyDesc", "للمستخدمين المتقدمين.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.proMonthly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.proFeatures", "مزايا احترافية متقدمة.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="sub_pro_m"
                  aria-label={tt("paywall.subscribe", "اشترك")}
                >
                  {tt("paywall.subscribe", "اشتراك")}
                </BuyButton>
              ) : (
                <Button asChild aria-label={tt("paywall.subscribe", "اشترك")}>
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>
                    {tt("paywall.subscribe", "اشتراك")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.basicYearly", "خطة أساسية سنوية")}</CardTitle>
              <CardDescription>
                {tt("paywall.basicYearlyDesc", "توفير أكبر للاستخدام الأساسي.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.basicYearly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.bestValue", "أفضل قيمة سنوية.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="sub_basic_y"
                  aria-label={tt("paywall.subscribe", "اشترك")}
                >
                  {tt("paywall.subscribe", "اشتراك")}
                </BuyButton>
              ) : (
                <Button asChild aria-label={tt("paywall.subscribe", "اشترك")}>
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>
                    {tt("paywall.subscribe", "اشتراك")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt("paywall.proYearly", "خطة احترافية سنوية")}</CardTitle>
              <CardDescription>
                {tt("paywall.proYearlyDesc", "أفضل قيمة للمحترفين.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.proYearly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt("paywall.ultimate", "الخطة الأقوى والأوفر.")}
              </div>
              {features.liveCheckout ? (
                <BuyButton
                  sku="sub_pro_y"
                  aria-label={tt("paywall.subscribe", "اشترك")}
                >
                  {tt("paywall.subscribe", "اشتراك")}
                </BuyButton>
              ) : (
                <Button asChild aria-label={tt("paywall.subscribe", "اشترك")}>
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>
                    {tt("paywall.subscribe", "اشتراك")}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
      <section className="rounded-2xl border p-4 text-sm leading-6 opacity-90">
        <h3 className="mb-2 font-medium">
          {tt("paywall.truth", "الوضوح والأمانة")}
        </h3>
        <ul className="list-disc space-y-1 ps-5">
          <li>
            {tt("paywall.neverExpire", "النقاط المدفوعة لا تنتهي صلاحيتها.")}
          </li>
          <li>
            {tt(
              "paywall.promoExpire",
              "النقاط الترويجية قد تنتهي — نعرض تاريخ الانتهاء بوضوح في المحفظة.",
            )}
          </li>
          <li>
            {tt(
              "paywall.preConfirm",
              "قبل أي خصم، نعرض التكلفة والرصيد قبل/بعد.",
            )}
          </li>
          <li>
            {tt("paywall.separate", "الاشتراك الزمني منفصل عن رصيد النقاط.")}
          </li>
        </ul>
      </section>
    </div>
  );
}
