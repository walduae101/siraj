import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { aiRouter } from "./routers/ai";
import { paynowRouter } from "./routers/paynow";
import { features } from "../../config/features";
import { pointsRouter } from "./routers/points";
import { checkoutRouter } from "./routers/checkout";

export const appRouter = createTRPCRouter({
  paynow: paynowRouter,
  ai: aiRouter,
  ...(features.pointsServer ? { points: pointsRouter } : {}),
  ...(features.stubCheckout ? { checkout: checkoutRouter } : {}),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
