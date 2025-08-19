"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PendingCartItem = {
  productId: string;
  quantity: number;
  subscription: boolean;
  gameServerId?: string;
  giftUsernameOrSteamId?: string;
};

interface CartSidebarState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;

  pendingItem: PendingCartItem | null;
  pendingItemLoading: boolean;

  setPendingItem: (item: PendingCartItem | null) => void;
  setPendingItemLoading: (pendignItemLoading: boolean) => void;
}

export const useCartSidebar = create<CartSidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      setOpen: (isOpen) => set(() => ({ isOpen })),

      pendingItem: null,
      pendingItemLoading: false,

      setPendingItem: (pendingItem) => set({ pendingItem }),

      setPendingItemLoading: (pendingItemLoading) =>
        set({ pendingItemLoading }),
    }),
    {
      name: "cart-sidebar",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") {
            return null;
          }

          const item = localStorage.getItem(name);

          if (!item) {
            return null;
          }

          const data = JSON.parse(item);
          const fiveMinutes = 5 * 60 * 1000;

          if (data.__timestamp && Date.now() - data.__timestamp > fiveMinutes) {
            localStorage.removeItem(name);

            return null;
          }

          return data;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") {
            return;
          }

          const data = { ...value, __timestamp: Date.now() };

          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") {
            return;
          }

          localStorage.removeItem(name);
        },
      },
    },
  ),
);
