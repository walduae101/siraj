"use client";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import type { Sku } from "~/server/services/skuMap";
import { useState } from "react";

interface BuyButtonProps {
  sku: Sku;
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
      qty,
      successUrl: `${window.location.origin}/checkout/success`,
      cancelUrl: `${window.location.origin}/paywall`,
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
