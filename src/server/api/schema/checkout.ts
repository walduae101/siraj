import { z } from "zod";

export const Sku = z.enum([
  // Legacy stub SKUs
  "points_1000",
  "points_5000",
  "points_10000",
  "sub_monthly",
  "sub_yearly",
  
  // PayNow SKUs
  "points_20",
  "points_50",
  "points_150",
  "points_500",
  "sub_basic_m",
  "sub_pro_m",
  "sub_basic_y",
  "sub_pro_y",
]);

export const checkoutPreviewInput = z.object({
  sku: Sku,
  qty: z.number().int().min(1).max(10).default(1),
});

export const checkoutCompleteInput = checkoutPreviewInput.extend({
  clientRef: z.string().min(8).max(100).optional(),
  nonce: z.string().min(6),
  /** REQUIRED: authenticated user's Firebase UID (stub-only) */
  uid: z.string().min(1),
});

export type SkuType = z.infer<typeof Sku>;
