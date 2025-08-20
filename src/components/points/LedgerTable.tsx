'use client';
import * as React from 'react';
import { features } from '~/config/features';
import { t } from '~/lib/i18n/t';
import { fmtNum } from '~/lib/i18n/num';
import { api } from '~/trpc/react';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';

type Kind = 'all' | 'credit' | 'spend' | 'expire' | 'adjust';

type LedgerTableProps = {
  pageSize?: number;
  uid: string;
  locale?: string;
  useArabicDigits?: boolean;
  className?: string;
};

export function LedgerTable({
  pageSize = 20,
  uid,
  locale,
  useArabicDigits,
  className,
}: LedgerTableProps) {
  const on = features.pointsClient;
  const safeLocale: "en" | "ar" = locale === "ar" ? "ar" : "en";
  const tt = t(safeLocale);
  if (!on || !api.points) {
    return (
      <div className="rounded-2xl border p-4 text-sm opacity-70">
        {tt('points.off', 'النقاط غير مفعّلة في هذه البيئة.')}
      </div>
    );
  }

  const q = api.points.ledger.useInfiniteQuery(
    { uid, limit: pageSize },
    {
      getNextPageParam: (last) => last?.nextCursor,
      staleTime: 10_000,
      enabled: !!uid && on, // Only run when uid is available and feature is enabled
    }
  );

  const rows = React.useMemo(
    () => (q.data?.pages ?? []).flatMap((p) => p.items ?? []),
    [q.data?.pages],
  );

  const n = (v: number) => fmtNum(v, safeLocale);

  return (
    <div className={className}>
      {q.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {q.error && (
        <Alert className="mb-3">
          <AlertTitle>{tt('errors.ledgerFailed', 'فشل تحميل السجل')}</AlertTitle>
          <AlertDescription>{String(q.error.message ?? q.error)}</AlertDescription>
        </Alert>
      )}
      {!q.isLoading && rows.length === 0 && !q.error && (
        <div className="rounded-2xl border p-6 text-sm opacity-70">
          {tt('ledger.empty', 'السجل فارغ.')}
        </div>
      )}
      {rows.length > 0 && (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{tt('ledger.date', 'التاريخ')}</TableHead>
                <TableHead className="whitespace-nowrap">{tt('ledger.event', 'الحدث')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{tt('ledger.deltaPaid', 'الفرق في الدفع')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{tt('ledger.deltaPromo', 'الفرق في الترويج')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{tt('ledger.balanceAfter', 'الرصيد بعد التغيير')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => {
                const ts = new Date(r.ts ?? r.createdAt ?? r.time ?? Date.now());
                const kind: Kind = (r.type ?? r.kind ?? 'adjust') as Kind;
                const dPaid = Number(r.delta?.paid ?? 0);
                const dPromo = Number(r.delta?.promo ?? 0);
                const aPaid = Number(r.balanceAfter?.paid ?? r.after?.paid ?? 0);
                const aPromo = Number(r.balanceAfter?.promo ?? r.after?.promo ?? 0);
                const posPaid = dPaid > 0;
                const posPromo = dPromo > 0;
                const eventLabel =
                  r.note ??
                  r.reason ??
                  r.actionId ??
                  ({
                    credit: tt('ledger.eventCredit', 'الفوائد'),
                    spend: tt('ledger.eventSpend', 'المصروفات'),
                    expire: tt('ledger.eventExpire', 'التاريخ الإنتهاء'),
                    adjust: tt('ledger.eventAdjust', 'التعديل'),
                    all: tt('ledger.eventAdjust', 'التعديل'),
                  }[kind]);
                const badgeVariant =
                  kind === 'credit' ? 'default' :
                  kind === 'spend'  ? 'destructive' :
                  kind === 'expire' ? 'secondary' : 'outline';
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {ts.toLocaleString(locale)}
                    </TableCell>
                    <TableCell className="max-w-[28ch]">
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant}>{kind}</Badge>
                        <span className="truncate" title={eventLabel}>
                          {eventLabel}
                        </span>
                      </div>
                      {!!r.expiry && (
                        <div className="text-xs opacity-70 mt-0.5">
                          {tt('ledger.expiry', 'التاريخ الإنتهاء')}: {new Date(r.expiry).toLocaleDateString(locale)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      <span className={posPaid ? 'text-emerald-600' : dPaid < 0 ? 'text-rose-600' : ''}>
                        {(dPaid > 0 ? '+' : '') + n(dPaid)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      <span className={posPromo ? 'text-emerald-600' : dPromo < 0 ? 'text-rose-600' : ''}>
                        {(dPromo > 0 ? '+' : '') + n(dPromo)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {n(aPaid)}/{n(aPromo)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-center p-3">
            <Button
              variant="outline"
              onClick={() => q.fetchNextPage()}
              disabled={!q.hasNextPage || q.isFetchingNextPage}
            >
              {q.isFetchingNextPage ? tt('common.loading', 'جاري التحميل…') + '…' :
               q.hasNextPage ? tt('ledger.loadMore', 'تحميل المزيد') : tt('ledger.end', 'النهاية')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
