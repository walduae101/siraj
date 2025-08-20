import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { features } from "../../config/features";
import { aiRouter } from "./routers/ai";
import { checkoutRouter } from "./routers/checkout";
import { paynowRouter } from "./routers/paynow";
import { pointsRouter } from "./routers/points";

export const appRouter = createTRPCRouter({
  paynow: paynowRouter,
  ai: aiRouter,
  ...(features.pointsServer ? { points: pointsRouter } : {}),
  ...(features.stubCheckout ? { checkout: checkoutRouter } : {}),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
