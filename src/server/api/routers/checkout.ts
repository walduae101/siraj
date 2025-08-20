import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { features } from "~/config/features";
import { protectedProcedure } from "~/server/api/protectedCompat";
import {
  checkoutCompleteInput,
  checkoutPreviewInput,
} from "~/server/api/schema/checkout";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getDb } from "~/server/firebase/admin-lazy";
import { checkoutStub } from "~/server/services/checkoutStub";
import { PayNowService } from "~/server/services/paynow";
import type { PayNowSku } from "~/server/services/paynowProducts";

export const checkoutRouter = createTRPCRouter({
  preview: protectedProcedure.input(checkoutPreviewInput).query(({ input }) => {
    if (!features.stubCheckout) throw new Error("Checkout disabled");
    return checkoutStub.preview(input);
  }),

  complete: protectedProcedure
    .input(checkoutCompleteInput)
    .mutation(async ({ input }) => {
      if (!features.stubCheckout) {
        throw new Error("Stub checkout disabled");
      }
      const db = await getDb();
      // ✅ take the UID from input (stub-only)
      return checkoutStub.complete(db, input.uid, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        sku: z.custom<PayNowSku>(),
        qty: z.number().int().min(1).max(10).optional(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!features.liveCheckout) throw new Error("Live checkout disabled");
      const userId = ctx.user?.uid ?? ctx.userId;
      if (!userId) throw new Error("UNAUTHORIZED");

      const db = await getDb();
      const { id, url } = await PayNowService.createCheckout(db, {
        uid: userId,
        sku: input.sku,
        qty: input.qty,
        name: ctx.user?.email?.split("@")[0],
        email: ctx.user?.email,
      });

      return { url };
    }),
});
