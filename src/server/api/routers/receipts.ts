import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const receiptSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['success', 'refunded', 'failed']),
  createdAt: z.string(),
  description: z.string().optional(),
});

function makeDemo(uid: string) {
  // deterministic set per user per day to keep UI stable
  const base = new Date();
  const ymd = `${base.getFullYear()}${String(base.getMonth() + 1).padStart(2, '0')}${String(base.getDate()).padStart(2, '0')}`;
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `RCP-${ymd}-${String(i + 1).padStart(4, '0')}`,
    amount: 9900 + i * 500, // AED 99.00, 104.00, ...
    currency: 'AED',
    status: i === 3 ? 'refunded' : 'success',
    createdAt: new Date(base.getTime() - i * 3600_000).toISOString(),
    description: i === 0 ? 'Welcome credit' : 'Purchase',
  }));
}

export const receiptsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.userId ?? 'anon';
    const items = makeDemo(uid);
    return items;
  }),
  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const uid = ctx.userId ?? 'anon';
    const items = makeDemo(uid);
    const found = items.find(r => r.id === input.id) ?? null;
    return found;
  }),
});
