"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function PaymentsPage() {
  const { data: methods } = api.payments.methods.useQuery();
  const { data: tokenData } = api.payments.clientToken.useQuery();
  const createIntent = api.payments.createIntent.useMutation();

  const [amount, setAmount] = useState<number>(50);

  const enabled = tokenData?.enabled === true;
  const disabledMsg = "PayNow is currently disabled. Please check back soon.";

  useEffect(() => {
    // no-op; we just want to ensure hooks mount without flicker
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>طرق الدفع / Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm opacity-80">Available: {methods?.methods?.join(", ") || "…"}</div>
          {!enabled && (
            <div className="rounded-md bg-amber-50 p-3 text-amber-900 text-sm">{disabledMsg}</div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input input-bordered w-32 rounded-md border px-2 py-1"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value || 0))}
              disabled={!enabled}
            />
            <Button
              disabled={!enabled || createIntent.isPending}
              onClick={async () => {
                const res = await createIntent.mutateAsync({ amount, currency: "AED", provider: "paynow" });
                if (res.ok && res.redirectUrl) {
                  window.location.href = res.redirectUrl;
                }
              }}
            >
              {createIntent.isPending ? "Processing…" : "Pay AED"}
            </Button>
          </div>
          {enabled && tokenData?.token && (
            <div className="text-xs text-muted-foreground">Client token ready.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
