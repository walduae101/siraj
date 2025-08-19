import { createTRPCRouter, publicProcedure } from "../trpc";
import { protectedProcedure } from "../protectedCompat";
import { zCredit, zSpend, zSpendPreview, zGetLedger } from "../schema/points";
import { pointsService } from "../../services/points";
import { z } from "zod";

export const pointsRouter = createTRPCRouter({
  getWallet: protectedProcedure.input(z.object({ uid: z.string().min(1) })).query(({ input }) =>
    pointsService.getWallet(input.uid)
  ),

  previewSpend: protectedProcedure.input(zSpendPreview)
    .query(({ input }) => pointsService.previewSpend(input)),

  spend: protectedProcedure.input(zSpend)
    .mutation(({ input }) =>
      pointsService.spend(input)
    ),

  credit: protectedProcedure.input(zCredit)
    .mutation(({ input }) =>
      pointsService.credit(input)
    ),

  ledger: protectedProcedure.input(zGetLedger)
    .query(({ input }) =>
      pointsService.getLedger(input)
    ),
});
