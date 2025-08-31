import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type Context from "~/server/api/types/context";

const tokenSchema = z.void();
const intentSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.literal("AED"),
  meta: z.object({ note: z.string().max(140).optional() }).optional(),
});

function paynowEnabled(ctx: Context) {
  return Boolean(ctx.cfg?.features?.paynow?.enabled);
}

export const paymentsRouter = createTRPCRouter({
  methods: publicProcedure.input(tokenSchema).query(({ ctx }) => {
    // Keep shape stable for UI (enabled + methods[])
    return {
      enabled: paynowEnabled(ctx),
      methods: paynowEnabled(ctx) ? (["paynow"] as const) : ([] as string[]),
    };
  }),

  clientToken: publicProcedure.input(tokenSchema).query(async ({ ctx }) => {
    if (!paynowEnabled(ctx)) {
      return { enabled: false as const, token: null as null };
    }
    // Stubbed token generator (safe; replace with provider call later)
    const token = Buffer.from(`${Date.now()}:${ctx.reqId || "demo"}`).toString(
      "base64url",
    );
    return { enabled: true as const, token };
  }),

  createIntent: publicProcedure
    .input(intentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!paynowEnabled(ctx)) {
        // deterministic no-op intent in disabled mode (for demos/QA)
        return {
          id: `demo_${Date.now()}`,
          status: "requires_payment" as const,
          redirectUrl: `${ctx.req?.url ? new URL(ctx.req.url).origin : "https://siraj.life"}/dashboard/payments?demo=1`,
        };
      }
      // Minimal fake intent shaped for UI; real provider call gated behind secrets
      const id = `pi_${Date.now()}`;
      // Redirect would normally be provider URL; keep internal for now
      const redirectUrl = `${ctx.req?.url ? new URL(ctx.req.url).origin : "https://siraj.life"}/dashboard/payments?intent=${id}`;
      return { id, status: "requires_payment" as const, redirectUrl };
    }),
});

export type PaymentsRouter = typeof paymentsRouter;
