import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { listReceipts, getReceipt } from "~/server/services/receipts.service";

export const receiptsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(50).default(20), userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const uid = input.userId ?? ctx.userId ?? "demo";
      const data = await listReceipts(uid, input.page, input.pageSize);
      return { data, page: input.page, pageSize: input.pageSize };
    }),

  byId: protectedProcedure
    .input(z.object({ receiptId: z.string(), userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const uid = input.userId ?? ctx.userId ?? "demo";
      const data = await getReceipt(uid, input.receiptId);
      return { data };
    }),
});

export type ReceiptsRouter = typeof receiptsRouter;
