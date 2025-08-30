import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { listReceipts, getReceipt } from "~/server/services/receipts.service";

export const receiptsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ page: z.number().int().min(1), pageSize: z.number().int().min(1).max(50) }))
    .query(async ({ input }) => {
      return await listReceipts("demo", input.page, input.pageSize);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      return await getReceipt("demo", input.id);
    }),
});

export type ReceiptsRouter = typeof receiptsRouter;
