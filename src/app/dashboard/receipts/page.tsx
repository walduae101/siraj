"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export default function ReceiptsPage() {
  const { data } = api.receipts.list.useQuery({ page: 1, pageSize: 20 });
  const [selected, setSelected] = useState<string | null>(null);
  const receipt = api.receipts.byId.useQuery(
    { id: selected ?? "" },
    { enabled: !!selected }
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2" dir="rtl">
      <Card>
        <CardHeader><CardTitle>الإيصالات / Receipts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">#</th>
                <th className="py-2">Total</th>
                <th className="py-2">Date</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
            {data?.map((r, idx) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2">{idx+1}</td>
                <td className="py-2">AED {r.total.toFixed(2)}</td>
                <td className="py-2">{new Date(r.issuedAt).toLocaleDateString("ar-AE")}</td>
                <td className="py-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(r.id)}>Details</Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>التفاصيل / Details</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!selected && <div className="text-sm opacity-70">Select a receipt…</div>}
          {selected && receipt.data && (
            <div className="space-y-2">
              <div className="font-medium">{receipt.data.merchant ?? "Siraj"}</div>
              <div className="text-sm">ID: {receipt.data.id}</div>
              <div className="text-sm">Total: AED {receipt.data.total.toFixed(2)}</div>
              <div className="text-sm">Date: {new Date(receipt.data.issuedAt).toLocaleString("ar-AE")}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
