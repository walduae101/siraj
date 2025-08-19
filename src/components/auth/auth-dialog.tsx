"use client";

import { api } from "~/trpc/react";

import { useAuthDialog } from "~/stores/useAuthDialog";

import AuthDialogGoogle from "./methods/auth-dialog-google";

export default function AuthDialog() {
  const authDialog = useAuthDialog();

  const { data: store } = api.paynow.getStore.useQuery();

  return (
    <AuthDialogGoogle open={authDialog.isOpen} setOpen={authDialog.setOpen} />
  );
}
