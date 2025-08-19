import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { aiRouter } from "./routers/ai";
import { gsaRouter } from "./routers/gsa";
import { paynowRouter } from "./routers/paynow";

export const appRouter = createTRPCRouter({
  paynow: paynowRouter,
  gsa: gsaRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
