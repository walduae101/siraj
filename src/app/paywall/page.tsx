"use client";
import { features } from '~/config/features';
import { pricing } from '~/lib/pricing';
import { t } from '~/lib/i18n/t';
import { fmtNum } from '~/lib/i18n/num';

import { WalletWidget } from '~/components/points/WalletWidget';
import { Button } from '~/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card';

function fmtCurrency(value: number, locale?: string, currency?: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'AED',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency ?? 'AED'}`;
  }
}

export default function PaywallPage() {
  const on = features.pointsClient;
  const currency = pricing.currency;
  const rawLocale = typeof navigator === 'undefined' ? 'en' : navigator.language;
  const locale: "en" | "ar" = rawLocale.startsWith("ar") ? "ar" : "en";
  const tt = t(locale);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">النقاط والاشتراك · Points & Subscription</h1>
        <p className="text-sm opacity-80">
          {tt('paywall.intro', 'اختر ما يناسبك — نقاط دائمة لا تنتهي، أو اشتراك زمني منفصل.')}
        </p>
      </div>
      <WalletWidget locale={locale} />
      {!on && (
        <div className="rounded-2xl border p-4 text-sm">
          {tt('points.off', 'النقاط غير مفعّلة في هذه البيئة.')}
        </div>
      )}
      <section aria-labelledby="points-title" className="space-y-4">
        <h2 id="points-title" className="text-xl font-semibold">
          {tt('paywall.pointsTitle', 'نقاط دائمة (مدفوعة) · Perpetual Points')}
        </h2>
        <p className="text-sm opacity-80">
          {tt(
            'paywall.pointsSubtitle',
            'النقاط المدفوعة لا تنتهي صلاحيتها. نعرض التكلفة بوضوح قبل أي خصم.'
          )}
        </p>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.p1k.title', '١٬٠٠٠ نقطة')}</CardTitle>
              <CardDescription>
                {tt('paywall.p1k.desc', 'للإنجازات الخفيفة، صالحة للأبد.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(pricing.points.p1k, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt('paywall.fairness', 'شفافية: سنعرض التكلفة قبل الخصم.')}
              </div>
              <Button asChild aria-label={tt('paywall.buyPoints', 'اشترِ النقاط')}>
                <a href={`/checkout/start?sku=points_1000&qty=1`}>{tt('paywall.buy', 'شراء')}</a>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.p5k.title', '٥٬٠٠٠ نقطة')}</CardTitle>
              <CardDescription>
                {tt('paywall.p5k.desc', 'سعر أوفر، صالحة للأبد.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(pricing.points.p5k, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt('paywall.neverExpires', 'النقاط المدفوعة لا تنتهي.')}
              </div>
              <Button asChild aria-label={tt('paywall.buyPoints', 'اشترِ النقاط')}>
                <a href={`/checkout/start?sku=points_5000&qty=1`}>{tt('paywall.buy', 'شراء')}</a>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.p10k.title', '١٠٬٠٠٠ نقطة')}</CardTitle>
              <CardDescription>
                {tt('paywall.p10k.desc', 'أفضل قيمة، صالحة للأبد.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(pricing.points.p10k, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">
                {tt('paywall.transparency', 'نوضح الرصيد قبل/بعد أي عملية.')}
              </div>
              <Button asChild aria-label={tt('paywall.buyPoints', 'اشترِ النقاط')}>
                <a href={`/checkout/start?sku=points_10000&qty=1`}>{tt('paywall.buy', 'شراء')}</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      <section aria-labelledby="subs-title" className="space-y-4">
        <h2 id="subs-title" className="text-xl font-semibold">
          {tt('paywall.subsTitle', 'اشتراك زمني منفصل · Time-based Subscription')}
        </h2>
        <p className="text-sm opacity-80">
          {tt(
            'paywall.subsSubtitle',
            'الاشتراك يمنحك مزايا زمنية؛ لا يخلط مع رصيد النقاط.'
          )}
        </p>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.monthly', 'شهري · Monthly')}</CardTitle>
              <CardDescription>
                {tt('paywall.monthlyDesc', 'للتجربة أو الاستخدام المرن.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(pricing.subs.monthly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">{tt('paywall.cancelAnytime', 'يمكن الإلغاء في أي وقت.')}</div>
              <Button asChild aria-label={tt('paywall.subscribe', 'اشترك')}>
                <a href={`/checkout/start?sku=sub_monthly&qty=1`}>{tt('paywall.subscribe', 'اشتراك')}</a>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.yearly', 'سنوي · Yearly')}</CardTitle>
              <CardDescription>
                {tt('paywall.yearlyDesc', 'أفضل توفير على المدى الطويل.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fmtCurrency(pricing.subs.yearly, locale, currency)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">{tt('paywall.bestValue', 'أفضل قيمة سنوية.')}</div>
              <Button asChild aria-label={tt('paywall.subscribe', 'اشترك')}>
                <a href={`/checkout/start?sku=sub_yearly&qty=1`}>{tt('paywall.subscribe', 'اشتراك')}</a>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>{tt('paywall.org', 'مؤسسات · Institutional')}</CardTitle>
              <CardDescription>
                {tt('paywall.orgDesc', 'حزم فرق ومدارس وجهات خيرية.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {tt('paywall.contact', 'تواصل معنا')}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs opacity-70">{tt('paywall.tailored', 'عقود عادلة ومخصّصة.')}</div>
              <Button asChild aria-label={tt('paywall.contactUs', 'تواصل')}>
                <a href="/contact">{tt('paywall.contactUs', 'تواصل')}</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      <section className="rounded-2xl border p-4 text-sm leading-6 opacity-90">
        <h3 className="font-medium mb-2">{tt('paywall.truth', 'الوضوح والأمانة')}</h3>
        <ul className="list-disc ps-5 space-y-1">
          <li>{tt('paywall.neverExpire', 'النقاط المدفوعة لا تنتهي صلاحيتها.')}</li>
          <li>{tt('paywall.promoExpire', 'النقاط الترويجية قد تنتهي — نعرض تاريخ الانتهاء بوضوح في المحفظة.')}</li>
          <li>{tt('paywall.preConfirm', 'قبل أي خصم، نعرض التكلفة والرصيد قبل/بعد.')}</li>
          <li>{tt('paywall.separate', 'الاشتراك الزمني منفصل عن رصيد النقاط.')}</li>
        </ul>
      </section>
    </div>
  );
}
