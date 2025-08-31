"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthDialog } from "~/stores/useAuthDialog";
import { useCartSidebar } from "~/stores/useCartSidebar";

import { api } from "~/trpc/react";

export default function PendingCartHandler() {
  const authDialog = useAuthDialog();
  const cartSidebar = useCartSidebar();

  const utils = api.useUtils();

  const { data: auth } = api.paynow.getAuth.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { data: store } = api.paynow.getStore.useQuery(undefined, {
    staleTime: 60_000,
  });

  const updateCartMutation = api.paynow.updateCartItem.useMutation({
    onSuccess: async () => {
      await utils.paynow.getCart.invalidate();

      cartSidebar.setOpen(true);
    },
    onError: (error) => {
      toast(error.message);
    },
    onSettled: () => {
      cartSidebar.setPendingItemLoading(false);
    },
  });

  const checkoutMutation = api.paynow.checkout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  useEffect(() => {
    if (!cartSidebar.pendingItem) {
      return;
    }

    if (!auth) {
      authDialog.setOpen(true);
      return;
    }

    cartSidebar.setPendingItemLoading(true);

    const { productId, quantity, subscription, giftUsernameOrSteamId } =
      cartSidebar.pendingItem;

    const handleDirectCheckout = () => {
      const customerProfilePlatform =
        store?.platform === "minecraft" ||
        store?.platform === "minecraft_offline" ||
        store?.platform === "minecraft_geyser"
          ? "paynow_name"
          : "steam";

      const giftTo =
        customerProfilePlatform && giftUsernameOrSteamId
          ? {
              platform: customerProfilePlatform,
              id: giftUsernameOrSteamId,
            }
          : null;

      checkoutMutation
        .mutateAsync({
          subscription,
          lines: [
            {
              product_id: productId,
              quantity,
              gift_to: giftTo,
            },
          ],
        })
        .finally(() => {
          cartSidebar.setPendingItem(null);
          cartSidebar.setPendingItemLoading(false);
        });
    };

    const handleAddToCart = () => {
      updateCartMutation
        .mutateAsync({
          product_id: productId,
          quantity,
          subscription,
        })
        .then(() => {
          cartSidebar.setOpen(true);
        })
        .finally(() => {
          cartSidebar.setPendingItem(null);
          cartSidebar.setPendingItemLoading(false);
        });
    };

    if (giftUsernameOrSteamId) {
      handleDirectCheckout();
      return;
    }

    handleAddToCart();
  }, [
    auth,
    cartSidebar.pendingItem,
    authDialog,
    cartSidebar,
    store?.platform,
    checkoutMutation,
    updateCartMutation,
  ]);

  return null;
}

