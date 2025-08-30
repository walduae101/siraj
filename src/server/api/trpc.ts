import { initTRPC } from "@trpc/server";

import superjson from "superjson";

import { ZodError } from "zod";

import type Context from "./types/context";

import { TRPCError } from "@trpc/server";
import { getAdminAuth } from "~/server/firebase/admin-lazy";
import isValidCountryCode from "./utils/countryCode";
import isValidPublicIP from "./utils/ip";
import { type inferAsyncReturnType } from "@trpc/server";

/* additions at top-level of file */
type PaynowFeature = { enabled: boolean; methods: string[] };
type Features = { paynow: PaynowFeature };
type SafeConfig = { features: Features };

// Minimal safe default that matches shape the app expects
const DEFAULT_SAFE_CONFIG: SafeConfig = {
  features: { paynow: { enabled: false, methods: [] } },
};

// Safe config wrapper that never throws
export async function getConfigSafely(): Promise<SafeConfig> {
  try {
    // If you already have getConfig(), prefer to deep-merge its result.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cfg: any = await getConfig(); // existing impl in this module/project
    // Defensive merge
    return {
      features: {
        paynow: {
          enabled: Boolean(cfg?.features?.paynow?.enabled ?? false),
          methods: Array.isArray(cfg?.features?.paynow?.methods) ? cfg.features.paynow.methods : [],
        },
      },
    };
  } catch {
    return DEFAULT_SAFE_CONFIG;
  }
}

// Ensure context factory never throws and carries config explicitly
export const createTRPCContext = async (opts: { req: Request }) => {
  const cfg = await getConfigSafely();
  return { req: opts.req, cfg };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error("[trpc:server]", {
      path: "unknown",
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

// Admin procedure that checks for admin claims
export const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.firebaseUser?.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Check admin claims
  const auth = await getAdminAuth();
  const userRecord = await auth.getUser(ctx.firebaseUser.uid);

  if (!userRecord.customClaims?.admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminUser: ctx.firebaseUser,
    },
  });
});

// Protected procedure for authenticated users
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.firebaseUser?.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.firebaseUser,
      userId: ctx.firebaseUser.uid,
    },
  });
});
