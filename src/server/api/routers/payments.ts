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
    .query(async () => {
      const cfg = await getConfigSafely();
      return { enabled: !!cfg.features?.paynow?.enabled, methods: ["paynow"] };
    }),

  clientToken: publicProcedure
    .input(z.void())
    .query(async () => {
      const cfg = await getConfigSafely();
      const enabled = !!cfg.features?.paynow?.enabled;
      return enabled ? { enabled, token: "stub-CLIENT-TOKEN" } : { enabled };
    }),

  createIntent: publicProcedure
    .input(z.object({ amount: z.number().positive(), currency: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const cfg = await getConfigSafely();
      const enabled = !!cfg.features?.paynow?.enabled;
      if (!enabled) return { ok: false, reason: "disabled" };
      return {
        ok: true,
        id: `demo_${Date.now()}`,
        amount: input.amount,
        currency: input.currency,
        redirectUrl: "/dashboard/payments?status=created",
      };
    }),
});

export type PaymentsRouter = typeof paymentsRouter;
