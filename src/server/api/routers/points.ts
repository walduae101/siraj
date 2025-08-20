import { z } from "zod";
import { pointsService } from "../../services/points";
import { protectedProcedure } from "../protectedCompat";
import { zCredit, zGetLedger, zSpend, zSpendPreview } from "../schema/points";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const pointsRouter = createTRPCRouter({
  getWallet: protectedProcedure
    .input(z.object({ uid: z.string().min(1).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const uid = input?.uid ?? ctx.user?.uid ?? ctx.userId;
      if (!uid) throw new Error("No user ID available");
      return pointsService.getWallet(uid);
    }),

  previewSpend: protectedProcedure
    .input(zSpendPreview)
    .query(({ input }) => pointsService.previewSpend(input)),

  spend: protectedProcedure
    .input(zSpend)
    .mutation(({ input }) => pointsService.spend(input)),

  credit: protectedProcedure
    .input(zCredit)
    .mutation(({ input }) => pointsService.credit(input)),

  ledger: protectedProcedure
    .input(zGetLedger)
    .query(({ input }) => pointsService.getLedger(input)),
});
