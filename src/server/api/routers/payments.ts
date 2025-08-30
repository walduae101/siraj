import { publicProcedure, createTRPCRouter } from '~/server/api/trpc';
import { z } from 'zod';

export const paymentsRouter = createTRPCRouter({
  methods: publicProcedure.input(z.void()).query(({ ctx }) => {
    const p = ctx.cfg.features.paynow;
    return { enabled: p.enabled, methods: p.methods };
  }),
  clientToken: publicProcedure.input(z.void()).query(({ ctx }) => {
    const p = ctx.cfg.features.paynow;
    return p.enabled ? { enabled: true, token: 'stub-client-token' } : { enabled: false, token: null };
  }),
  createIntent: publicProcedure
    .input(z.object({ amount: z.number().positive(), currency: z.string().length(3), returnUrl: z.string().url() }))
    .mutation(({ input, ctx }) => {
      const p = ctx.cfg.features.paynow;
      if (!p.enabled) return { enabled: false, redirectUrl: null };
      const url = new URL(input.returnUrl);
      return { enabled: true, redirectUrl: `${url.origin}/dashboard/payments?status=processing` };
    }),
});
