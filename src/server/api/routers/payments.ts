import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getConfig } from "~/server/config";

const MethodsSchema = z.array(z.enum(["visa","mastercard","paynow"]));
const CreateIntentInput = z.object({
  amount: z.number().positive(),
  currency: z.string().default("AED"),
  provider: z.enum(["paynow"]).default("paynow"),
  meta: z.record(z.string()).optional(),
});

export const paymentsRouter = createTRPCRouter({
  methods: publicProcedure.query((): z.infer<typeof MethodsSchema> => {
    // Expose options but gate runtime by feature flag
    return ["visa","mastercard","paynow"];
  }),

  clientToken: publicProcedure.query(async () => {
    const cfg = getConfig();
    const enabled = cfg.features?.paynow?.enabled === true;
    if (!enabled) {
      return { enabled, token: null as unknown as string };
    }
    // Stubbed token (no secret exposure). Real flow would sign from provider SDK.
    const token = `stub-${Math.random().toString(36).slice(2)}`;
    return { enabled, token };
  }),

  createIntent: publicProcedure
    .input(CreateIntentInput)
    .mutation(async ({ input }) => {
      const cfg = getConfig();
      const enabled = cfg.features?.paynow?.enabled === true;
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
