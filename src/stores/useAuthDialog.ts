import { create } from "zustand";

interface AuthDialogState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  isOpen: false,
  setOpen: (isOpen: boolean) => set({ isOpen }),
}));
