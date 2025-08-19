import { z } from "zod";

export const zActionId = z.string().min(8).max(80);

export const zCredit = z.object({
  uid: z.string().min(1),
  kind: z.enum(["paid", "promo"]),
  amount: z.number().int().positive(),
  source: z.string(),
  expiresAt: z.date().optional(), // required when kind=promo
  actionId: zActionId,
});

export const zSpendPreview = z.object({
  uid: z.string().min(1),
  cost: z.number().int().positive(),
});

export const zSpend = zSpendPreview.extend({
  action: z.string(),
  actionId: zActionId,
});

export const zGetLedger = z.object({
  uid: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});
