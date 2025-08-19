"use client";

import type Product from "~/server/api/types/paynow/product";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export default function ProductInfoDialog({
  product,
  open,
  setOpen,
}: { product: Product; open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        {product?.description && (
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: n/a
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
