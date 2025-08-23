import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ProductCatalogService } from "~/server/services/productCatalog";
import { WalletLedgerService } from "~/server/services/walletLedger";
import { getAdminAuth } from "~/server/firebase/admin-lazy";

// Admin procedure that checks for admin claims
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.firebaseUser?.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Check admin claims
  const auth = await getAdminAuth();
  const userRecord = await auth.getUser(ctx.firebaseUser.uid);
  
  if (!userRecord.customClaims?.admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminUser: ctx.firebaseUser,
    },
  });
});

export const adminRouter = createTRPCRouter({
  // Get user wallet and ledger
  getUserWallet: adminProcedure
    .input(z.object({
      uid: z.string().min(1),
      limit: z.number().min(1).max(100).default(50),
      startAfter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { uid, limit, startAfter } = input;

      // Get wallet balance
      const wallet = await WalletLedgerService.getWalletBalance(uid);
      
      // Get ledger entries
      const ledger = await WalletLedgerService.getLedgerEntries(uid, {
        limit,
        startAfter,
      });

      return {
        wallet,
        ledger: ledger.entries,
        hasMore: ledger.hasMore,
      };
    }),

  // Search user by email
  searchUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const { email } = input;
      const auth = await getAdminAuth();
      
      try {
        const userRecord = await auth.getUserByEmail(email);
        return {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          createdAt: userRecord.metadata.creationTime,
        };
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
    }),

  // Manual wallet adjustment
  adjustWallet: adminProcedure
    .input(z.object({
      uid: z.string().min(1),
      amount: z.number(), // positive for credit, negative for debit
      reason: z.string().min(1).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const { uid, amount, reason } = input;
      const adminUid = ctx.adminUser.uid;

      // Validate amount
      if (amount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Amount cannot be zero",
        });
      }

      // Create admin adjustment
      const result = await WalletLedgerService.createAdminAdjustment(
        uid,
        amount,
        reason,
        adminUid
      );

      // Log admin action
      console.log("[admin] Wallet adjustment", {
        admin_uid: adminUid,
        user_uid: uid,
        amount,
        reason,
        ledger_id: result.ledgerId,
        new_balance: result.newBalance,
      });

      return result;
    }),

  // Get all products
  getProducts: adminProcedure
    .query(async () => {
      return await ProductCatalogService.getActiveProducts();
    }),

  // Get all promotions
  getPromotions: adminProcedure
    .query(async () => {
      return await ProductCatalogService.getActivePromotions();
    }),

  // Create or update product
  upsertProduct: adminProcedure
    .input(z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      type: z.enum(["one_time", "subscription"]),
      points: z.number().int().positive(),
      priceUSD: z.number().positive(),
      paynowProductId: z.string().min(1),
      active: z.boolean(),
      version: z.number().int().positive().default(1),
      effectiveFrom: z.date().optional(),
      effectiveTo: z.date().nullable().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminUid = ctx.adminUser.uid;

      const productData: any = {
        title: input.title,
        type: input.type,
        points: input.points,
        priceUSD: input.priceUSD,
        paynowProductId: input.paynowProductId,
        active: input.active,
        version: input.version,
        effectiveFrom: input.effectiveFrom ? Timestamp.fromDate(new Date(input.effectiveFrom)) : undefined,
        effectiveTo: input.effectiveTo ? Timestamp.fromDate(new Date(input.effectiveTo)) : null,
        ...(input.metadata && { metadata: input.metadata }),
        ...(input.id && { id: input.id }),
      };
      
      const product = await ProductCatalogService.upsertProduct(
        productData,
        adminUid
      );

      // Log admin action
      console.log("[admin] Product upserted", {
        admin_uid: adminUid,
        product_id: product.id,
        paynow_product_id: product.paynowProductId,
        title: product.title,
        points: product.points,
      });

      return product;
    }),

  // Create or update promotion
  upsertPromotion: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(20),
      discountPercent: z.number().min(0).max(100).optional(),
      bonusPoints: z.number().int().positive().optional(),
      appliesTo: z.union([z.literal("*"), z.array(z.string())]),
      active: z.boolean(),
      usageLimit: z.number().int().positive(),
      usageCount: z.number().int().min(0).default(0),
      startsAt: z.date(),
      endsAt: z.date(),
      terms: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminUid = ctx.adminUser.uid;

      // Validate that either discountPercent or bonusPoints is provided
      if (!input.discountPercent && !input.bonusPoints) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either discountPercent or bonusPoints must be provided",
        });
      }

      const promotion = await ProductCatalogService.upsertPromotion(
        {
          ...input,
          startsAt: Timestamp.fromDate(new Date(input.startsAt)),
          endsAt: Timestamp.fromDate(new Date(input.endsAt)),
        },
        adminUid
      );

      // Log admin action
      console.log("[admin] Promotion upserted", {
        admin_uid: adminUid,
        promotion_id: promotion.id,
        code: promotion.code,
        active: promotion.active,
      });

      return promotion;
    }),

  // Get ledger entry details
  getLedgerEntry: adminProcedure
    .input(z.object({
      uid: z.string().min(1),
      ledgerId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const { uid, ledgerId } = input;

      const entry = await WalletLedgerService.getLedgerEntry(uid, ledgerId);
      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ledger entry not found",
        });
      }

      // If this is a reversal, get the original entry
      let originalEntry = null;
      if (entry.source.reversalOf) {
        originalEntry = await WalletLedgerService.getLedgerEntry(uid, entry.source.reversalOf);
      }

      // If this entry has reversals, get them
      let reversals = null;
      if (entry.kind === "purchase") {
        reversals = await WalletLedgerService.getReversalsOfEntry(uid, ledgerId);
      }

      return {
        entry,
        originalEntry,
        reversals,
      };
    }),

  // Export ledger as CSV (client-side generation)
  exportLedger: adminProcedure
    .input(z.object({
      uid: z.string().min(1),
      limit: z.number().min(1).max(1000).default(1000),
    }))
    .query(async ({ input }) => {
      const { uid, limit } = input;

      const ledger = await WalletLedgerService.getLedgerEntries(uid, { limit });
      
      // Format for CSV export
      const csvData = ledger.entries.map(entry => ({
        id: entry.id,
        createdAt: entry.createdAt.toDate().toISOString(),
        kind: entry.kind,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        currency: entry.currency,
        orderId: entry.source.orderId || "",
        productId: entry.source.productId || "",
        productVersion: entry.source.productVersion || "",
        reversalOf: entry.source.reversalOf || "",
        reason: entry.source.reason || "",
        createdBy: entry.createdBy,
      }));

      return csvData;
    }),
});
