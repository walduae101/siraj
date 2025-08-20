"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { PayNowSku } from "~/server/services/paynowProducts";
import { api } from "~/trpc/react";

interface BuyButtonProps {
  sku: PayNowSku;
  qty?: number;
  children: React.ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
}

export function BuyButton({
  sku,
  qty = 1,
  children,
  disabled = false,
  "aria-label": ariaLabel,
}: BuyButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const createCheckout = api.checkout?.create?.useMutation({
    onSuccess: (res) => {
      if (res?.url) {
        setIsRedirecting(true);
        window.location.href = res.url;
      }
    },
    onError: (error) => {
      console.error("Checkout failed:", error);
      console.error("Full error details:", {
        message: error.message,
        data: error.data,
        shape: error.shape,
      });
      setIsRedirecting(false);
    },
  });

  const handleClick = () => {
    if (!createCheckout) {
      console.error("Checkout API not available");
      return;
    }
    createCheckout.mutate({
      sku,
      qty
    });
  };

  const isLoading = (createCheckout?.isPending ?? false) || isRedirecting;

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
    >
      {isLoading ? "..." : children}
    </Button>
  );
}
