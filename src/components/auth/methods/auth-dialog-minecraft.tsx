"use client";

import { SignInIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAuthDialog } from "~/stores/useAuthDialog";
import { useCartSidebar } from "~/stores/useCartSidebar";
import { type RouterInputs, api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

type MinecraftLoginInput = RouterInputs["paynow"]["minecraftLogin"];

export default function AuthDialogMinecraft({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const utils = api.useUtils();

  const authDialog = useAuthDialog();
  const cartSidebar = useCartSidebar();

  const form = useForm<MinecraftLoginInput>({
    defaultValues: {
      username: "",
      platform: "java",
    },
  });

  const minecraftLoginMutation = api.paynow.minecraftLogin.useMutation({
    onSuccess: async () => {
      form.reset();

      await utils.paynow.getAuth.invalidate();

      authDialog.setOpen(false);
    },
    onError: () => {
      form.setFocus("username");
    },
  });

  const onSubmit = (data: MinecraftLoginInput) => {
    minecraftLoginMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Please enter your username</DialogTitle>
            <DialogDescription>Case sensitive, no caps</DialogDescription>
          </DialogHeader>

          {minecraftLoginMutation.error?.message && (
            <p className="font-bold text-red-500 text-sm">
              {minecraftLoginMutation.error.message}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={
                form.watch("platform") === "java" ? "default" : "outline"
              }
              size="lg"
              onClick={() => form.setValue("platform", "java")}
            >
              Java Edition
            </Button>

            <Button
              type="button"
              variant={
                form.watch("platform") === "bedrock" ? "default" : "outline"
              }
              size="lg"
              onClick={() => form.setValue("platform", "bedrock")}
            >
              Bedrock Edition
            </Button>
          </div>

          <Input
            placeholder="Enter Username"
            {...form.register("username", { required: "Username is required" })}
            autoFocus
            required
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                cartSidebar.pendingItemLoading ||
                minecraftLoginMutation.isPending ||
                !form.watch("username").trim()
              }
            >
              <SignInIcon />
              {cartSidebar.pendingItemLoading ||
              minecraftLoginMutation.isPending
                ? "Logging In..."
                : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
