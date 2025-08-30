import { publicProcedure, createTRPCRouter } from '~/server/api/trpc';
import { z } from 'zod';

export const receiptsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ page: z.number().int().min(1), pageSize: z.number().int().min(1).max(50) }))
    .query(async ({ input }) => {
      const { listReceipts } = await import('~/server/services/receipts.service');
      return await listReceipts("demo", input.page, input.pageSize);
    }),
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const { getReceiptById } = await import('~/server/services/receipts.service');
      return await getReceiptById("demo", input.id);
    }),
});

export type ReceiptsRouter = typeof receiptsRouter;
