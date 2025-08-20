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
import { createCheckout, ensureCustomerId, getOrder } from "~/server/services/paynowMgmt";
import { pointsService } from "~/server/services/points";
import type { PayNowSku } from "~/server/services/paynowProducts";
import { env } from "~/env-server";

const productPoints = JSON.parse(process.env.NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON ?? "{}") as Record<string, number>;

const ProductMap = (() => {
  try { 
    return JSON.parse(env.PAYNOW_PRODUCTS_JSON ?? "{}") as Record<string, string>; 
  } catch { 
    return {} as Record<string, string>; 
  }
})();

export const checkoutRouter = createTRPCRouter({
  preview: protectedProcedure.input(checkoutPreviewInput).query(({ input }) => {
    if (!features.stubCheckout) throw new Error("Checkout disabled");
    return checkoutStub.preview(input);
  }),

  complete: protectedProcedure
    .input(z.object({
      orderId: z.string().optional(),
      checkoutId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const uid = ctx.user?.uid ?? ctx.userId;
      if (!uid) throw new Error("No user in context");

      // Support both order_id and checkout_id for flexibility
      const orderId = input.orderId || input.checkoutId;
      if (!orderId) throw new Error("No order ID provided");

      const order = await getOrder(orderId);
      if (!order) throw new Error("Order not found");

      // Only credit once: use order.pretty_id as idempotency key
      // Credit only when paid/complete
      if (order.payment_state !== "paid" || order.status !== "completed") {
        throw new Error(`Order not paid/complete (status=${order.status}, payment=${order.payment_state})`);
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
            actionId: `${order.pretty_id || order.id}_${pid}_${qty}`,
          });
          totalCredited += delta;
        }
      }
      return { ok: true, credited: totalCredited, orderId: order.pretty_id || order.id };
    }),

  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().optional(),
        productId: z.string().optional(),
        qty: z.number().int().min(1).max(10).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const uid = ctx.user?.uid ?? ctx.userId;
      if (!uid) throw new Error("Not authenticated");

      // Resolve product ID from SKU or direct productId
      const productId = input.productId ?? ProductMap[input.sku ?? ""] ?? "";
      if (!productId) throw new Error("Unknown product");

      // Ensure we have a PayNow customer ID
      const customerId = await ensureCustomerId(db, uid, { 
        name: ctx.user?.email?.split("@")[0] || uid, 
        email: ctx.user?.email 
      });
      
      // Build URLs
      const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://siraj.life";
      const successUrl = new URL("/checkout/success", baseUrl).toString();
      const cancelUrl = new URL("/paywall", baseUrl).toString();
      
      // Create the checkout session
      const session = await createCheckout({ 
        customerId, 
        productId, 
        qty: input.qty, 
        successUrl, 
        cancelUrl 
      });

      return { url: session.url, checkoutId: session.id };
    }),
});
