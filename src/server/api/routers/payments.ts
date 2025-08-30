import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getConfigSafely } from "~/server/api/trpc";

const CreateIntentInput = z.object({
  amount: z.number().positive(),
  currency: z.string().default("AED"),
  provider: z.enum(["paynow"]).default("paynow"),
  meta: z.record(z.string()).optional(),
});

export const paymentsRouter = createTRPCRouter({
  methods: publicProcedure
    .input(z.void())
    .query(({ ctx }) => {
      const paynow = ctx.cfg.features.paynow;
      return { enabled: paynow.enabled, methods: paynow.methods };
    }),

  clientToken: publicProcedure
    .input(z.void())
    .query(({ ctx }) => {
      // Gate by feature; never throw
      if (!ctx.cfg.features.paynow.enabled) {
        return { enabled: false, token: null as string | null };
      }
      // Stub token for now; replace later with real integration
      return { enabled: true, token: 'stub-client-token' };
    }),

  createIntent: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string().min(3).max(3),
      returnUrl: z.string().url(),
    }))
    .mutation(({ input, ctx }) => {
      if (!ctx.cfg.features.paynow.enabled) {
        // Do not error; gracefully signal disabled state
        return { enabled: false, redirectUrl: null as string | null };
      }
      // Minimal happy-path stub
      const redirectUrl = `${new URL(input.returnUrl).origin}/dashboard/payments?status=processing`;
      return { enabled: true, redirectUrl };
    }),
});

export type PaymentsRouter = typeof paymentsRouter;
