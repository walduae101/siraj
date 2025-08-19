import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import SteamService from "../services/steam";
// Avoid top-level import of firebase-admin to prevent bundling into RSC build
import PayNowService from "./../services/paynow";

export const paynowRouter = createTRPCRouter({
  getStore: publicProcedure.query(({ ctx }) => PayNowService.getStore(ctx)),

  getProducts: publicProcedure.query(({ ctx }) =>
    PayNowService.getProducts(ctx),
  ),

  getNavlinks: publicProcedure.query(({ ctx }) =>
    PayNowService.getNavlinks(ctx),
  ),

  getTags: publicProcedure.query(({ ctx }) => PayNowService.getTags(ctx)),

  getModules: publicProcedure.query(({ ctx }) => PayNowService.getModules(ctx)),

  getAuth: publicProcedure.query(({ ctx }) => PayNowService.getAuth(ctx)),

  getCart: publicProcedure.query(({ ctx }) => PayNowService.getCart(ctx)),

  updateCartItem: publicProcedure
    .input(
      z.object({
        product_id: z.string(),
        quantity: z.number(),
        gameserver_id: z.string().optional().nullable(),
        increment: z.boolean().default(true),
        subscription: z.boolean().default(false),
      }),
    )
    .mutation(({ ctx, input }) => PayNowService.updateCartItem(ctx, input)),

  checkout: publicProcedure
    .input(
      z.object({
        subscription: z.boolean(),
        lines: z
          .object({
            product_id: z.string(),
            quantity: z.number(),
            gift_to: z
              .object({
                platform: z.string(),
                id: z.string(),
              })
              .optional()
              .nullable(),
            gift_to_customer_id: z.string().optional().nullable(),
            selected_gameserver_id: z.string().optional().nullable(),
          })
          .array(),
      }),
    )
    .mutation(({ ctx, input }) => PayNowService.checkout(ctx, input)),

  checkoutFromCart: publicProcedure
    .input(z.any())
    .mutation(({ ctx, input }) => PayNowService.checkoutFromCart(ctx, input)),

  minecraftLogin: publicProcedure
    .input(
      z.object({
        username: z.string().trim().max(64),
        platform: z.enum(["bedrock", "java"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customerId = await PayNowService.findOrCreateMinecraftCustomer(
        input.username,
        input.platform,
      );

      const token = await PayNowService.generateAuthToken(customerId);

      PayNowService.setAuthCookie(ctx, token);
    }),

  steamLogin: publicProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { query } = input;

      const steamId = await SteamService.resolveSteamIdFromOpenIdQS(query);

      const customerId = await PayNowService.findOrCreateSteamCustomer(steamId);

      const token = await PayNowService.generateAuthToken(customerId);

      return token;
    }),

  getSteamLoginUrl: publicProcedure.query(async ({ ctx }) =>
    SteamService.getLoginUrl(),
  ),

  logout: publicProcedure.mutation(({ ctx }) => PayNowService.logout(ctx)),

  // Firebase Google login: accepts an ID token, verifies it, maps to PayNow customer
  googleLogin: publicProcedure
    .input(z.object({ idToken: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const { getAdminAuth, getFirestore } = await import(
        "~/server/firebase/admin-lazy"
      );
      const { cookies } = await import("next/headers");

      const adminAuth = await getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(input.idToken);

      const db = await getFirestore();
      const uid = decoded.uid;
      const userDoc = db.collection("userMappings").doc(uid);

      let mapping = (await userDoc.get()).data() as
        | { paynowCustomerId?: string }
        | undefined;
      if (!mapping?.paynowCustomerId) {
        // Create on PayNow if needed
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
          body: JSON.stringify({ email: decoded.email }),
        });
        if (!resp.ok)
          throw new Error(`PayNow create customer failed: ${resp.status}`);
        const data = await resp.json();
        mapping = { paynowCustomerId: data.id };
        await userDoc.set(mapping, { merge: true });
        console.log(
          `[userMappings] Created mapping for ${decoded.uid} -> ${data.id}`,
        );
      }

      // Issue short-lived session token from your backend or forward PayNow token
      const tokenValue = mapping.paynowCustomerId || "";
      const cookieStore = await cookies();
      cookieStore.set("pn_token", tokenValue, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        domain: ".siraj.life",
        maxAge: 60 * 60 * 24 * 7,
      });

      return { ok: true };
    }),

  getGiftcardBalanceByCode: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).trim(),
      }),
    )
    .mutation(({ input }) =>
      PayNowService.getGiftcardBalanceByCode(input.code),
    ),
});
