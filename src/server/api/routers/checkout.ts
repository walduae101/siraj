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
import { type Sku, skuMap } from "~/server/services/skuMap";
import PayNowService from "~/server/api/services/paynow";

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
        sku: z.custom<Sku>(),
        qty: z.number().int().min(1).max(10).default(1),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!features.liveCheckout) throw new Error("Live checkout disabled");
      const userId = ctx.user?.uid ?? ctx.userId;
      if (!userId) throw new Error("UNAUTHORIZED");

      const productId = skuMap[input.sku].productId;
      
      // Ensure user has PayNow customer account
      const db = await getDb();
      const userDoc = db.collection("userMappings").doc(userId);
      let mapping = (await userDoc.get()).data() as { paynowCustomerId?: string } | undefined;
      
      if (!mapping?.paynowCustomerId) {
        // Create PayNow customer if doesn't exist
        const resp = await fetch("https://api.paynow.gg/v1/customers", {
          method: "POST",
          headers: {
            Authorization: `APIKey ${(process.env.PAYNOW_API_KEY ?? "")
              .replace(/["']/g, "")
              .replace(/[^\x20-\x7E]/g, "")
              .trim()}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ 
            email: ctx.user?.email ?? `user-${userId}@siraj.life`
          }),
        });
        
        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`PayNow create customer failed: ${resp.status} - ${errorText}`);
        }
        
        const customerData = await resp.json();
        mapping = { paynowCustomerId: customerData.id };
        await userDoc.set(mapping, { merge: true });
        console.log(`Created PayNow customer for ${userId} -> ${customerData.id}`);
      }
      
      // Update context with customer token for Storefront API
      const enhancedCtx = {
        ...ctx,
        payNowStorefrontHeaders: {
          ...ctx.payNowStorefrontHeaders,
          Authorization: `Customer ${mapping.paynowCustomerId}`,
        },
      };
      
      const checkoutData = {
        subscription: input.sku.startsWith("sub_"),
        lines: [{
          product_id: productId,
          quantity: input.qty,
          gift_to: null,
          gift_to_customer_id: null,
          selected_gameserver_id: null,
        }],
      };
      
      try {
        const result = await PayNowService.checkout(enhancedCtx, checkoutData);
        return { url: result.url };
      } catch (error) {
        console.error("PayNow checkout failed:", error);
        throw new Error(`PayNow checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
