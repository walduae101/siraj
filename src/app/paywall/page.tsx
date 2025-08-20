"use client";
import { features } from "~/config/features";
import { fmtNum } from "~/lib/i18n/num";
import { t } from "~/lib/i18n/t";
import { pricing } from "~/lib/pricing";

import { BuyButton } from "~/components/paywall/BuyButton";
import { WalletWidget } from "~/components/points/WalletWidget";
import { Button } from "~/components/ui/button";
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
    // Use ar-AE locale with English digits for proper formatting
    return new Intl.NumberFormat("ar-AE-u-nu-latn", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback with manual formatting for USD with comma thousands separator
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formatted}`;
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
          اختر ما يناسبك — نقاط دائمة لا تنتهي، أو اشتراك زمني منفصل.
        </p>
      </div>
      <WalletWidget locale={locale} />
      {!on && (
        <div className="rounded-2xl border p-4 text-sm">
          النقاط غير مفعّلة في هذه البيئة.
        </div>
      )}
      <section aria-labelledby="points-title" className="space-y-4">
        <h2 id="points-title" className="font-semibold text-xl">
          نقاط دائمة (مدفوعة) · Perpetual Points
        </h2>
        <p className="text-sm opacity-80">
          النقاط المدفوعة لا تنتهي صلاحيتها. نعرض التكلفة بوضوح قبل أي خصم.
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>٢٠ نقطة - حزمة المبتدئين</CardTitle>
              <CardDescription>للتجربة والبداية، صالحة للأبد.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p20, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                شفافية: سنعرض التكلفة قبل الخصم.
              </div>
              {features.liveCheckout ? (
                <BuyButton sku="points_20" aria-label="اشترِ النقاط">
                  شراء
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترِ النقاط">
                  <a href={"/checkout/start?sku=points_1000&qty=1"}>شراء</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>٥٠ نقطة - حزمة ٥٠</CardTitle>
              <CardDescription>سعر أوفر، صالحة للأبد.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p50, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                النقاط المدفوعة لا تنتهي.
              </div>
              {features.liveCheckout ? (
                <BuyButton sku="points_50" aria-label="اشترِ النقاط">
                  شراء
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترِ النقاط">
                  <a href={"/checkout/start?sku=points_5000&qty=1"}>شراء</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>١٥٠ نقطة - حزمة ١٥٠</CardTitle>
              <CardDescription>قيمة ممتازة، صالحة للأبد.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p150, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                نوضح الرصيد قبل/بعد أي عملية.
              </div>
              {features.liveCheckout ? (
                <BuyButton sku="points_150" aria-label="اشترِ النقاط">
                  شراء
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترِ النقاط">
                  <a href={"/checkout/start?sku=points_10000&qty=1"}>شراء</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>٥٠٠ نقطة - حزمة ٥٠٠</CardTitle>
              <CardDescription>أفضل قيمة، صالحة للأبد.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.points.p500, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">أفضل قيمة للنقاط.</div>
              {features.liveCheckout ? (
                <BuyButton sku="points_500" aria-label="اشترِ النقاط">
                  شراء
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترِ النقاط">
                  <a href={"/checkout/start?sku=points_10000&qty=1"}>شراء</a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
      <section aria-labelledby="subs-title" className="space-y-4">
        <h2 id="subs-title" className="font-semibold text-xl">
          اشتراك زمني منفصل · Time-based Subscription
        </h2>
        <p className="text-sm opacity-80">
          الاشتراك يمنحك مزايا زمنية؛ لا يخلط مع رصيد النقاط.
        </p>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>خطة أساسية شهرية</CardTitle>
              <CardDescription>للاستخدام الأساسي والتجربة.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.basicMonthly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">يمكن الإلغاء في أي وقت.</div>
              {features.liveCheckout ? (
                <BuyButton sku="sub_basic_monthly" aria-label="اشترك">
                  اشتراك
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترك">
                  <a href={"/checkout/start?sku=sub_monthly&qty=1"}>اشتراك</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>خطة احترافية شهرية</CardTitle>
              <CardDescription>للمستخدمين المتقدمين.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.proMonthly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">مزايا احترافية متقدمة.</div>
              {features.liveCheckout ? (
                <BuyButton sku="sub_pro_monthly" aria-label="اشترك">
                  اشتراك
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترك">
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>اشتراك</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>خطة أساسية سنوية</CardTitle>
              <CardDescription>توفير أكبر للاستخدام الأساسي.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.basicYearly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">أفضل قيمة سنوية.</div>
              {features.liveCheckout ? (
                <BuyButton sku="sub_basic_annual" aria-label="اشترك">
                  اشتراك
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترك">
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>اشتراك</a>
                </Button>
              )}
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>خطة احترافية سنوية</CardTitle>
              <CardDescription>أفضل قيمة للمحترفين.</CardDescription>
            </CardHeader>
            <CardContent className="font-semibold text-2xl">
              {fmtCurrency(pricing.subs.proYearly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">الخطة الأقوى والأوفر.</div>
              {features.liveCheckout ? (
                <BuyButton sku="sub_pro_annual" aria-label="اشترك">
                  اشتراك
                </BuyButton>
              ) : (
                <Button asChild aria-label="اشترك">
                  <a href={"/checkout/start?sku=sub_yearly&qty=1"}>اشتراك</a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
      <section className="rounded-2xl border p-4 text-sm leading-6 opacity-90">
        <h3 className="mb-2 font-medium">الوضوح والأمانة</h3>
        <ul className="list-disc space-y-1 ps-5">
          <li>النقاط المدفوعة لا تنتهي صلاحيتها.</li>
          <li>
            النقاط الترويجية قد تنتهي — نعرض تاريخ الانتهاء بوضوح في المحفظة.
          </li>
          <li>قبل أي خصم، نعرض التكلفة والرصيد قبل/بعد.</li>
          <li>الاشتراك الزمني منفصل عن رصيد النقاط.</li>
        </ul>
      </section>
    </div>
  );
}
