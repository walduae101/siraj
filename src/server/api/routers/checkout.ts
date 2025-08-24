import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { features } from "~/config/features";
import { protectedProcedure } from "~/server/api/protectedCompat";
import {
  checkoutCompleteInput,
  checkoutPreviewInput,
} from "~/server/api/schema/checkout";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getConfig, getProductId } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { checkoutStub } from "~/server/services/checkoutStub";
import {
  createCheckout,
  ensureCustomerId,
  getOrder,
} from "~/server/services/paynowMgmt";
import type { PayNowSku } from "~/server/services/paynowProducts";
import { pointsService } from "~/server/services/points";
import { ProductCatalogService } from "~/server/services/productCatalog";
import { riskEngine } from "~/server/services/riskEngine";

const productPoints = JSON.parse(
  process.env.NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON ?? "{}",
) as Record<string, number>;

export const checkoutRouter = createTRPCRouter({
  preview: protectedProcedure.input(checkoutPreviewInput).query(({ input }) => {
    if (!features.stubCheckout) throw new Error("Checkout disabled");
    return checkoutStub.preview(input);
  }),

  complete: protectedProcedure
    .input(
      z.object({
        orderId: z.string().optional(),
        checkoutId: z.string().optional(),
      }),
    )
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
        throw new Error(
          `Order not paid/complete (status=${order.status}, payment=${order.payment_state})`,
        );
      }

      let totalCredited = 0;
      const config = await getConfig();

      for (const line of order.lines ?? []) {
        const pid = String(line.product_id);
        const qty = Number(line.quantity ?? 1);

        // Find the product points - first check if it's in Firestore
        let points: number | null = null;

        // Try to get from ProductCatalogService
        const product = await ProductCatalogService.getProductByPayNowId(pid);
        if (product) {
          points = product.points;
        } else {
          // Fallback to config mapping
          const gsmProduct = await ProductCatalogService.getProductFromGSM(pid);
          if (gsmProduct) {
            points = gsmProduct.points;
          }
        }

        if (points && qty > 0) {
          const delta = points * qty;
          await pointsService.credit({
            uid,
            kind: "paid", // never expires
            amount: delta,
            source: "paynow:order",
            actionId: `${order.pretty_id || order.id}_${pid}_${qty}`,
          });
          totalCredited += delta;
        }
      }
      return {
        ok: true,
        credited: totalCredited,
        orderId: order.pretty_id || order.id,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().optional(),
        productId: z.string().optional(),
        qty: z.number().int().min(1).max(10).default(1),
        recaptchaToken: z.string().optional(),
        appCheckToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const uid = ctx.user?.uid ?? ctx.userId;
      if (!uid) throw new Error("Not authenticated");

      // Resolve product ID from SKU or direct productId
      const resolvedProductId =
        input.productId ?? (await getProductId(input.sku ?? "")) ?? "";
      const productId = resolvedProductId;
      if (!productId) {
        const cfg = await getConfig();
        const keys = Object.keys(cfg.paynow.products).join(", ");
        throw new Error(
          `Unknown product (sku=${input.sku}, productId=${input.productId}). Known SKUs: [${keys}]`,
        );
      }

      // Get product details for risk evaluation
      // First try to get product from Firestore by PayNow ID
      let productData: any = null;
      let price = 0;

      // Check if we have a product in Firestore with this PayNow ID
      const productSnapshot = await db
        .collection("products")
        .where("paynowProductId", "==", productId)
        .where("active", "==", true)
        .limit(1)
        .get();

      if (!productSnapshot.empty) {
        const productDoc = productSnapshot.docs[0];
        if (productDoc) {
          productData = productDoc.data();
          price = productData?.priceUSD || 0;
        }
      } else {
        // Fallback: Get price from PayNow products config
        // The price mapping is not in our config, so we'll use a default based on points
        const cfg = await getConfig();
        const sku = Object.entries(cfg.paynow.products).find(
          ([_, id]) => id === productId,
        )?.[0];

        if (sku) {
          // Extract points from SKU name (e.g., "points_20" -> 20)
          const pointsMatch = sku.match(/points_(\d+)/);
          if (pointsMatch?.[1]) {
            const points = Number.parseInt(pointsMatch[1], 10);
            // Use the price structure from the paywall page
            const priceMap: Record<number, number> = {
              20: 2.0,
              50: 5.0,
              150: 12.0,
              500: 25.0,
            };
            price = priceMap[points] || 0;
          }
        }

        if (!price) {
          throw new Error("Product not found");
        }
      }

      // Get user data for risk evaluation
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }
      const userData = userDoc.data()!;
      const email = userData.email || "";

      // Calculate account age
      const createdAt = userData.createdAt?.toDate() || new Date();
      const accountAgeMinutes = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60),
      );

      // Get client IP and user agent
      const ip =
        (ctx.headers?.get("x-forwarded-for") as string) ||
        (ctx.headers?.get("x-real-ip") as string) ||
        "127.0.0.1";
      const userAgent = (ctx.headers?.get("user-agent") as string) || "";

      // Evaluate risk before creating checkout
      const riskDecision = await riskEngine.evaluateCheckout({
        uid,
        email,
        ip,
        userAgent,
        accountAgeMinutes,
        orderIntent: {
          productId,
          quantity: input.qty,
          price,
        },
        recaptchaToken: input.recaptchaToken,
        appCheckToken: input.appCheckToken,
      });

      // Handle risk decision
      const config = await getConfig();
      console.log(
        "[checkout] FRAUD_SHADOW_MODE:",
        config.features.FRAUD_SHADOW_MODE,
      );
      if (!config.features.FRAUD_SHADOW_MODE) {
        // Enforce mode: block based on decision
        switch (riskDecision.action) {
          case "deny":
            throw new Error("Checkout denied due to risk assessment");

          case "challenge":
            throw new Error("reCAPTCHA challenge required");

          case "queue_review":
            throw new Error("Checkout queued for manual review");
          default:
            // Continue with checkout
            break;
        }
      }

      // Ensure we have a PayNow customer ID
      const customerId = await ensureCustomerId(db, uid, {
        name: ctx.user?.email?.split("@")[0] || uid,
        email: ctx.user?.email,
      });

      // Build URLs
      const baseUrl =
        process.env.NEXT_PUBLIC_WEBSITE_URL || "https://siraj.life";
      const successUrl = new URL("/checkout/success", baseUrl).toString();
      const cancelUrl = new URL("/paywall", baseUrl).toString();

      // Create the checkout session
      const session = await createCheckout({
        customerId,
        productId,
        qty: input.qty,
        successUrl,
        cancelUrl,
      });

      return {
        url: session.url,
        checkoutId: session.id,
        riskDecision: config.features.FRAUD_SHADOW_MODE
          ? riskDecision
          : undefined,
      };
    }),
});
