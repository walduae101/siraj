import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { features } from "../../config/features";
import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";
import { checkoutRouter } from "./routers/checkout";
import { fraudRouter } from "./routers/fraud";
import { paynowRouter } from "./routers/paynow";
import { paymentsRouter } from "./routers/payments";
import { pointsRouter } from "./routers/points";
import { receiptsRouter } from "./routers/receipts";

export const appRouter = createTRPCRouter({
  paynow: paynowRouter,
  ai: aiRouter,
  points: pointsRouter,
  checkout: checkoutRouter,
  admin: adminRouter,
  fraud: fraudRouter,
  payments: paymentsRouter,
  receipts: receiptsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
