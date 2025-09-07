import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getReceipt, listReceipts } from "~/server/services/receipts.service";

export const receiptsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      return await listReceipts(ctx, { page, pageSize });
    }),
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return await getReceipt(ctx, input.id);
    }),
});

export type ReceiptsRouter = typeof receiptsRouter;
