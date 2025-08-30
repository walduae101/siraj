'use client';

import { api } from '~/trpc/react';
import { useState } from 'react';

export default function ReceiptsPage() {
  const { data, isLoading } = api.receipts.list.useQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detail } = api.receipts.get.useQuery(
    { id: selected ?? '' },
    { enabled: !!selected },
  );

  return (
    <main className="container max-w-5xl py-6" dir="rtl">
      <h1 className="text-2xl font-semibold">الإيصالات</h1>
      <div className="mt-4 rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-right p-3">الرقم</th>
              <th className="text-right p-3">تاريخ الإنشاء</th>
              <th className="text-right p-3">المبلغ</th>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="p-3" colSpan={5}>جارٍ التحميل...</td></tr>
            )}
            {data?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.id}</td>
                <td className="p-3">{new Date(r.createdAt).toLocaleString('ar-SA')}</td>
                <td className="p-3">{(r.amount / 100).toFixed(2)} درهم إماراتي</td>
                <td className="p-3 capitalize">{r.status === 'success' ? 'نجح' : r.status === 'refunded' ? 'مسترد' : 'فشل'}</td>
                <td className="p-3">
                  <button className="underline" onClick={() => setSelected(r.id)}>عرض</button>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.length && (
              <tr><td className="p-3" colSpan={5}>لا توجد إيصالات بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-medium">تفاصيل الإيصال</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div><span className="text-muted-foreground">الرقم:</span> {detail.id}</div>
            <div><span className="text-muted-foreground">تاريخ الإنشاء:</span> {new Date(detail.createdAt).toLocaleString('ar-SA')}</div>
            <div><span className="text-muted-foreground">المبلغ:</span> {(detail.amount / 100).toFixed(2)} درهم إماراتي</div>
            <div><span className="text-muted-foreground">الحالة:</span> {detail.status === 'success' ? 'نجح' : detail.status === 'refunded' ? 'مسترد' : 'فشل'}</div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">{detail.description ?? '—'}</div>
          <div className="mt-4">
            {/* Placeholder; Sprint 2 will add PDF export & storage-backed downloads */}
            <button className="rounded-md border px-3 py-1.5">تصدير PDF (قريباً)</button>
          </div>
        </div>
      )}
    </main>
  );
}
