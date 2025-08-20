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
import { PayNowService, getOrderByCheckoutId } from "~/server/services/paynow";
import { pointsService } from "~/server/services/points";
import type { PayNowSku } from "~/server/services/paynowProducts";
import { env } from "~/env-server";

const productPoints = JSON.parse(process.env.NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON ?? "{}") as Record<string, number>;

export const checkoutRouter = createTRPCRouter({
  preview: protectedProcedure.input(checkoutPreviewInput).query(({ input }) => {
    if (!features.stubCheckout) throw new Error("Checkout disabled");
    return checkoutStub.preview(input);
  }),

  complete: protectedProcedure
    .input(z.object({
      checkoutId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const uid = ctx.user?.uid ?? ctx.userId;
      if (!uid) throw new Error("No user in context");

      const order = await getOrderByCheckoutId(env.PAYNOW_STORE_ID, input.checkoutId);
      if (!order) throw new Error("Order not found for checkout_id");

      // Only credit once: use order.pretty_id as idempotency key
      // PayNow docs: `pretty_id` looks like pn-xxxxx (visible in success URL)
      // Credit only when paid/complete
      if (order.payment_state !== "paid" || order.state !== "completed") {
        throw new Error(`Order not paid/complete (state=${order.state}, payment=${order.payment_state})`);
      }

      let totalCredited = 0;
      for (const line of order.lines ?? []) {
        const pid = String(line.product_id);
        const qty = Number(line.quantity ?? 1);
        const pts = productPoints[pid];
        if (pts && qty > 0) {
          const delta = pts * qty;
          await pointsService.credit({
            uid,
            kind: "paid",                           // never expires
            amount: delta,
            source: "paynow:order",
            actionId: `${order.pretty_id}_${pid}_${qty}`,
          });
          totalCredited += delta;
        }
      }
      return { ok: true, credited: totalCredited, orderId: order.pretty_id };
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
