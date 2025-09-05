"use client";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { features } from "~/config/features";
import { t } from "~/lib/i18n/t";
import { api } from "~/trpc/react";
import { ConfirmSpendDialog } from "./ConfirmSpendDialog";

type PointsActionButtonProps = {
  uid?: string;
  cost: number;
  actionId: string;
  reason?: string;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  disabled?: boolean;
};
export function PointsActionButton({
  uid,
  cost,
  actionId,
  reason,
  children,
  className,
  onSuccess,
  disabled,
}: PointsActionButtonProps) {
  const [open, setOpen] = React.useState(false);
  const utils = api.useUtils();
  React.useEffect(() => {
    if (features.pointsClient && open && uid) {
      utils.points?.previewSpend?.prefetch?.({ uid, cost }).catch(() => {});
    }
  }, [open, uid, cost, utils]);
  const canUsePoints = Boolean(features.pointsClient && uid);
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={!canUsePoints || disabled}
        aria-disabled={!canUsePoints || disabled}
        onClick={() => setOpen(true)}
        title={!uid ? "Sign in required" : undefined}
      >
        {children}
      </button>
      {uid && (
        <ConfirmSpendDialog
          open={open}
          onOpenChange={setOpen}
          uid={uid}
          cost={cost}
          actionId={actionId}
          reason={reason}
        />
      )}
    </>
  );
}

