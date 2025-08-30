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
    .input(z.void())                 // explicitly no input
    .query(async () => {
      const cfg = await getConfigSafely();
      const enabled = !!cfg?.features?.paynow?.enabled;
      return { enabled, methods: ["paynow"] };
    }),

  clientToken: publicProcedure
    .input(z.void())                 // explicitly no input
    .query(async () => {
      const cfg = await getConfigSafely();
      const enabled = !!cfg?.features?.paynow?.enabled;
      return enabled ? { enabled, token: "stub-CLIENT-TOKEN" } : { enabled };
    }),

  createIntent: publicProcedure
    .input(CreateIntentInput)
    .mutation(async ({ input }) => {
      const cfg = await getConfigSafely();
      const enabled = !!cfg?.features?.paynow?.enabled;
      if (!enabled) {
        return { ok: false, reason: "PAYNOW_DISABLED" as const };
      }
      // Stub: in a real world call provider API; do not leak secrets.
      // Return a redirect URL or in-app confirmation payload.
      const redirectUrl = `/dashboard/payments?status=created&amt=${encodeURIComponent(
        String(input.amount)
      )}`;
      return {
        ok: true,
        provider: input.provider,
        id: `pi_${Date.now()}`,
        amount: input.amount,
        currency: input.currency,
        redirectUrl,
      };
    }),
});

export type PaymentsRouter = typeof paymentsRouter;
