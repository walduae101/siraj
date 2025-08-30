import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { listReceipts, getReceipt } from "~/server/services/receipts.service";

export const receiptsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const data = await listReceipts("demo", page, pageSize);
      return { data, page, pageSize };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const data = await getReceipt("demo", input.id);
      return { data };
    }),
});

export type ReceiptsRouter = typeof receiptsRouter;
