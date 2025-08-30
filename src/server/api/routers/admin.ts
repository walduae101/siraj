import { TRPCError } from "@trpc/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { getAdminAuth } from "~/server/firebase/admin-lazy";
import { ProductCatalogService } from "~/server/services/productCatalog";
import { WalletLedgerService } from "~/server/services/walletLedger";

export const adminRouter = createTRPCRouter({
  // Get user wallet and ledger
  getUserWallet: adminProcedure
    .input(
      z.object({
        uid: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
        startAfter: z.string().optional(),
      }),
    )
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
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
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
    .input(
      z.object({
        uid: z.string().min(1),
        amount: z.number(), // positive for credit, negative for debit
        reason: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { uid, amount, reason } = input;
      const adminUid = ctx.adminUser?.uid;
      if (!adminUid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin authentication required",
        });
      }

      // Validate amount
      if (amount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Amount cannot be zero",
        });
      }

      // Create ledger entry
      const entry = await WalletLedgerService.createLedgerEntry(
        uid,
        {
          amount,
          kind: "admin_adjustment",
          status: "posted",
          currency: "POINTS",
          source: {
            reason,
          },
        },
        `admin:${adminUid}`,
      );

      return {
        success: true,
        entryId: entry.ledgerId,
        newBalance: entry.newBalance,
      };
    }),

  // Get products
  getProducts: adminProcedure.query(async () => {
    return await ProductCatalogService.getActiveProducts();
  }),

  // Upsert product
  upsertProduct: adminProcedure
    .input(
      z.object({
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const adminUid = ctx.adminUser?.uid;
      if (!adminUid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin authentication required",
        });
      }

      // Convert dates to Timestamps if provided
      const productData = {
        ...input,
        effectiveFrom: input.effectiveFrom
          ? Timestamp.fromDate(input.effectiveFrom)
          : undefined,
        effectiveTo: input.effectiveTo
          ? Timestamp.fromDate(input.effectiveTo)
          : null,
      };

      // Remove id if it's undefined to match the expected type
      const { id, ...productDataWithoutId } = productData;
      const finalProductData = id
        ? { ...productDataWithoutId, id }
        : productDataWithoutId;

      // Cast to the expected type since we know the structure is correct
      return await ProductCatalogService.upsertProduct(
        finalProductData as any,
        adminUid,
      );
    }),

  // Get promotions
  getPromotions: adminProcedure.query(async () => {
    return await ProductCatalogService.getActivePromotions();
  }),

  // Upsert promotion
  upsertPromotion: adminProcedure
    .input(
      z.object({
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const adminUid = ctx.adminUser?.uid;
      if (!adminUid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin authentication required",
        });
      }

      // Convert dates to Timestamps
      const promotionData = {
        ...input,
        startsAt: Timestamp.fromDate(input.startsAt),
        endsAt: Timestamp.fromDate(input.endsAt),
      };

      return await ProductCatalogService.upsertPromotion(
        promotionData,
        adminUid,
      );
    }),

  // Get ledger entry
  getLedgerEntry: adminProcedure
    .input(
      z.object({
        uid: z.string().min(1),
        entryId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const entry = await WalletLedgerService.getLedgerEntry(
        input.uid,
        input.entryId,
      );
      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ledger entry not found",
        });
      }
      return entry;
    }),

  // Export ledger
  exportLedger: adminProcedure
    .input(
      z.object({
        uid: z.string().min(1),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().min(1).max(1000).default(1000),
      }),
    )
    .query(async ({ input }) => {
      const { uid, startDate, endDate, limit } = input;

      const entries = await WalletLedgerService.getLedgerEntries(uid, {
        limit,
      });

      return {
        entries: entries.entries,
        total: entries.entries.length,
        hasMore: entries.hasMore,
      };
    }),
});
