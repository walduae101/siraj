import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const paymentsRouter = createTRPCRouter({
  methods: publicProcedure.query(() => (["visa","mastercard","paynow"])),
  intentClientToken: publicProcedure
    .input(z.object({ provider: z.enum(["paynow"]).optional() }))
    .query(async () => ({ token: "stubbed-server-token" })),
});

export type PaymentsRouter = typeof paymentsRouter;
