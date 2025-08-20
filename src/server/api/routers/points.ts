import { z } from "zod";
import { pointsService } from "../../services/points";
import { protectedProcedure } from "../protectedCompat";
import { zCredit, zGetLedger, zSpend, zSpendPreview } from "../schema/points";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const pointsRouter = createTRPCRouter({
  getWallet: protectedProcedure
    .input(z.object({ uid: z.string().min(1) }))
    .query(({ input }) => pointsService.getWallet(input.uid)),

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
