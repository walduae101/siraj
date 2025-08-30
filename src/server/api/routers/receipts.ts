import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { listReceipts, getReceipt } from "~/server/services/receipts.service";

export const receiptsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const uid = ctx.userId ?? "demo";
      const data = await listReceipts(uid, page, pageSize);
      return { data, page, pageSize };
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
