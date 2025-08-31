"use client";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { features } from "~/config/features";
import { formatDate } from "~/lib/i18n/date";
import { fmtNum } from "~/lib/i18n/num";
import { t } from "~/lib/i18n/t";
import { api } from "~/trpc/react";

type ConfirmSpendDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  uid: string;
  cost: number;
  actionId?: string;
  reason?: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirmed?: (result: { ledgerEntryId: string }) => void;
  onError?: (err: unknown) => void;
  locale?: string;
  useArabicDigits?: boolean;
};

export function ConfirmSpendDialog(props: ConfirmSpendDialogProps) {
  const { open, onOpenChange, uid, cost, actionId, reason } = props;
  const safeLocale: "en" | "ar" = props.locale === "ar" ? "ar" : "en";
  const tt = t(safeLocale);

  const _title =
    props.title ?? tt("confirmSpend.title", "تأكيد استخدام النقاط");
  const _confirmLabel =
    props.confirmLabel ?? tt("confirmSpend.confirm", "تأكيد واستخدام النقاط");
  const _cancelLabel = props.cancelLabel ?? tt("common.cancel", "إلغاء");

  const {
    data: preview,
    isLoading: previewLoading,
    error: previewError,
  } = api.points?.previewSpend.useQuery(
    { uid: uid || "", cost },
    { enabled: features.pointsClient && !!api.points && open && !!uid },
  ) || { data: undefined, isLoading: false, error: null };

  const utils = api.useUtils();
  const spendMutation = api.points?.spend.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.points?.getWallet?.invalidate?.(),
        utils.points?.ledger?.invalidate?.(),
      ]);
      onOpenChange(false);
    },
    onError: (err: any) => {
      props.onError?.(err);
    },
  }) || { mutate: () => {}, isPending: false };

  const n = (v: number) => fmtNum(v, safeLocale);
  const soonestExpiry = React.useMemo(() => {
    if (!preview?.lots?.length) return null;
    const soonest = preview.lots
      .map((lot: any) => lot.expiresAt)
      .filter(Boolean)
      .sort((a: any, b: any) => a - b)[0];
    return soonest ? new Date(soonest) : null;
  }, [preview?.lots]);

  const nearExpiry = soonestExpiry
    ? (soonestExpiry.getTime() - Date.now()) / 86400000 <= 7
    : false;

  const busy = previewLoading || spendMutation.isPending;
  const canConfirm = !!preview && preview.ok && !busy;

  const onConfirm = () => {
    spendMutation.mutate({
      uid,
      cost,
      actionId: actionId ?? "",
      action: reason ?? "",
    });
  };

  // Early return after all hooks are called
  if (!features.pointsClient || !uid || !api.points) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={React.useId()}>
        <DialogHeader>
          <DialogTitle>{_title}</DialogTitle>
          <DialogDescription id={React.useId()}>
            {tt("confirmSpend.subtitle", "تفاصيل شفافة قبل أي خصم.")}
          </DialogDescription>
        </DialogHeader>

        {previewError && (
          <Alert className="mb-3">
            <AlertTitle>
              {tt("errors.previewFailed", "تعذر تجهيز التأكيد")}
            </AlertTitle>
            <AlertDescription>
              {String(previewError.message ?? previewError)}
            </AlertDescription>
          </Alert>
        )}

        {previewLoading && (
          <div className="text-sm opacity-70">
            {tt("common.loading", "جارٍ التحميل")}…
          </div>
        )}

        {!!preview && !previewLoading && (
          <div className="space-y-4">
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-3">
                <div className="text-xs opacity-70">
                  {tt("wallet.paid", "مدفوعة")}
                </div>
                <div className="font-semibold text-2xl">
                  {n(preview.pre.paid)}
                </div>
              </div>
              <div className="rounded-2xl border p-3">
                <div className="text-xs opacity-70">
                  {tt("wallet.promo", "ترويجية")}
                </div>
                <div className="font-semibold text-2xl">
                  {n(preview.pre.promo)}
                </div>
                {soonestExpiry && (
                  <div
                    className={`mt-1 text-xs ${nearExpiry ? "text-amber-600" : "opacity-70"}`}
                  >
                    {tt("wallet.earliestExpiry", "أقرب انتهاء")}:{" "}
                    {formatDate(soonestExpiry, safeLocale)}
                  </div>
                )}
              </div>
            </section>
            <section className="rounded-2xl border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {tt("confirmSpend.cost", "التكلفة الإجمالية")}
                </div>
                <Badge variant="secondary" className="py-1 text-base">
                  {n(preview.cost)} {tt("points.unit", "نقطة")}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <div className="text-xs opacity-70">
                    {tt("confirmSpend.fromPromo", "من الترويجية")}
                  </div>
                  <div className="font-medium text-lg">
                    {n(preview.payBreakdown.promo)}
                  </div>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <div className="text-xs opacity-70">
                    {tt("confirmSpend.fromPaid", "من المدفوعة")}
                  </div>
                  <div className="font-medium text-lg">
                    {n(preview.payBreakdown.paid)}
                  </div>
                </div>
              </div>
            </section>
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-3">
                <div className="text-xs opacity-70">
                  {tt("wallet.paidAfter", "مدفوعة (بعد)")}
                </div>
                <div className="font-semibold text-2xl">
                  {n(preview.post?.paid ?? 0)}
                </div>
              </div>
              <div className="rounded-2xl border p-3">
                <div className="text-xs opacity-70">
                  {tt("wallet.promoAfter", "ترويجية (بعد)")}
                </div>
                <div className="font-semibold text-2xl">
                  {n(preview.post?.promo ?? 0)}
                </div>
              </div>
            </section>
            {!preview.ok && (
              <Alert>
                <AlertTitle>
                  {tt("confirmSpend.insufficientTitle", "رصيد غير كافٍ")}
                </AlertTitle>
                <AlertDescription>
                  {tt(
                    "confirmSpend.insufficientBody",
                    "أرصدتك غير كافية لإتمام هذا الإجراء.",
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {_cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>
            {_confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

