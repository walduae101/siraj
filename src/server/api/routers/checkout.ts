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
        // Use existing PayNow service method for customer creation
        const email = ctx.user?.email ?? `user-${userId}@siraj.life`;
        const name = ctx.user?.email?.split('@')[0] ?? `User-${userId}`;
        
        const customerId = await PayNowService.findOrCreateCustomerByEmail(email, name);
        mapping = { paynowCustomerId: customerId };
        await userDoc.set(mapping, { merge: true });
        console.log(`Created/found PayNow customer for ${userId} -> ${customerId}`);
      }
      
      // Generate proper auth token for Storefront API
      if (!mapping.paynowCustomerId) {
        throw new Error("PayNow customer ID not found after creation");
      }
      const authToken = await PayNowService.generateAuthToken(mapping.paynowCustomerId);
      
      // PayNow requires customer IP or country code for server-side requests
      const forwardedFor = ctx.headers.get('x-forwarded-for') as string | null;
      const realIp = ctx.headers.get('x-real-ip') as string | null;
      const cfIp = ctx.headers.get('cf-connecting-ip') as string | null;
      
      // Get the first available IP or use localhost as fallback
      const rawIp = forwardedFor || realIp || cfIp || '127.0.0.1';
      
      // Handle multiple IPs (x-forwarded-for can contain comma-separated list)
      // @ts-ignore - rawIp is guaranteed to be a string due to fallback
      const customerIp = rawIp.split(',')[0].trim();
      
      const enhancedCtx = {
        ...ctx,
        payNowStorefrontHeaders: {
          ...ctx.payNowStorefrontHeaders,
          Authorization: `Customer ${authToken}`,
          'x-paynow-customer-ip': customerIp,
          'x-paynow-customer-countrycode': 'AE', // Default to UAE
        },
      };
      
      const isSubscription = input.sku.startsWith("sub_");
      
      // PayNow checkout payload - match the exact structure from their docs
      const checkoutData = {
        subscription: isSubscription,
        lines: [{
          product_id: productId,
          quantity: input.qty,
          // Don't duplicate subscription flag in line items
          // Only include gameserver_id if it's a gameserver product
          ...(input.sku.includes("gameserver") ? { selected_gameserver_id: null } : {}),
        }],
      };
      
      try {
        console.log("[checkout.create] Sending to PayNow:", JSON.stringify({
          headers: enhancedCtx.payNowStorefrontHeaders,
          payload: checkoutData,
          customerId: mapping.paynowCustomerId,
          authToken: authToken.substring(0, 10) + "..."
        }, null, 2));
        
        const result = await PayNowService.checkout(enhancedCtx, checkoutData);
        return { url: result.url };
      } catch (error) {
        console.error("[checkout.create] PayNow checkout failed:", error);
        if (error instanceof Error && error.message.includes("Request failed")) {
          console.error("[checkout.create] Full error details:", {
            message: error.message,
            stack: error.stack,
            // @ts-ignore
            response: error.response?.data || error.response
          });
        }
        throw new Error(`PayNow checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
