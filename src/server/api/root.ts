import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { features } from "../../config/features";
import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";
import { checkoutRouter } from "./routers/checkout";
import { fraudRouter } from "./routers/fraud";
import { paynowRouter } from "./routers/paynow";
import { pointsRouter } from "./routers/points";

export const appRouter = createTRPCRouter({
  paynow: paynowRouter,
  ai: aiRouter,
  points: pointsRouter,
  checkout: checkoutRouter,
  admin: adminRouter,
  fraud: fraudRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
