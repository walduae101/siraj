import { initTRPC } from "@trpc/server";

import superjson from "superjson";

import { ZodError } from "zod";



import { TRPCError } from "@trpc/server";
import { getAdminAuth } from "~/server/firebase/admin-lazy";
import isValidCountryCode from "./utils/countryCode";
import isValidPublicIP from "./utils/ip";
import { type inferAsyncReturnType } from "@trpc/server";



type PaynowFeature = { enabled: boolean; methods: string[] };
type Features = { paynow: PaynowFeature };
type SafeConfig = { features: Features };

const DEFAULT_SAFE_CONFIG: SafeConfig = {
  features: { paynow: { enabled: false, methods: [] } },
};

async function getConfigSafely(): Promise<SafeConfig> {
  try {
    const mod = await import('~/server/config'); // adjust if actual path differs
    const raw: any = await (mod as any).getConfig?.();
    return {
      features: {
        paynow: {
          enabled: Boolean(raw?.features?.paynow?.enabled ?? false),
          methods: Array.isArray(raw?.features?.paynow?.methods) ? raw.features.paynow.methods : [],
        },
      },
    };
  } catch {
    return DEFAULT_SAFE_CONFIG;
  }
}

/**
 * Backward-compatible createTRPCContext:
 * - New callers: createTRPCContext({ req })
 * - Legacy callers: createTRPCContext({ headers, resHeaders })
 */
export async function createTRPCContext(input: { req?: Request; headers?: Headers; resHeaders?: Headers }) {
  const cfg = await getConfigSafely();
  const headers = input.headers ?? input.req?.headers;
  const resHeaders = input.resHeaders ?? new Headers();
  const firebaseUser = null; // placeholder to satisfy legacy access
  const adminUser = null;    // placeholder if legacy admin code reads it

  return {
    req: input.req ?? new Request('http://local.invalid'), // harmless placeholder
    headers: headers ?? new Headers(),
    resHeaders,
    payNowStorefrontHeaders: {}, // Add missing field
    firebaseUser,
    adminUser,
    cfg,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export type Context = {
  headers: Headers;
  resHeaders: Headers;
  payNowStorefrontHeaders: Record<string, string>;
  firebaseUser: { uid: string; email?: string; [key: string]: unknown } | null;
  adminUser: { uid: string; email?: string; [key: string]: unknown } | null;
  user?: { uid: string; email?: string; [key: string]: unknown };
  userId?: string;
  cfg: {
    features: {
      paynow: { enabled: boolean; methods: string[] };
    };
  };
  req?: Request;
};

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
  const typedCtx = ctx as Context;
  if (!typedCtx.firebaseUser?.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  // Check admin claims
  const auth = await getAdminAuth();
  const userRecord = await auth.getUser(typedCtx.firebaseUser.uid);

  if (!userRecord.customClaims?.admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...typedCtx,
      adminUser: typedCtx.firebaseUser as { uid: string; email?: string; [key: string]: unknown },
    },
  });
});

// Protected procedure for authenticated users
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const typedCtx = ctx as Context;
  if (!typedCtx.firebaseUser?.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...typedCtx,
      user: typedCtx.firebaseUser as { uid: string; email?: string; [key: string]: unknown },
      userId: typedCtx.firebaseUser.uid,
    },
  });
});
