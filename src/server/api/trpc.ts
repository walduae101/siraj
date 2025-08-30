import { initTRPC } from "@trpc/server";

import superjson from "superjson";

import { ZodError } from "zod";

import type Context from "./types/context";

import { TRPCError } from "@trpc/server";
import { getAdminAuth } from "~/server/firebase/admin-lazy";
import isValidCountryCode from "./utils/countryCode";
import isValidPublicIP from "./utils/ip";
import { type inferAsyncReturnType } from "@trpc/server";

import type { Headers as NodeHeaders } from 'node-fetch'; // or global Headers in Node 20

type PaynowFeature = { enabled: boolean; methods: string[] };
type Features = { paynow: PaynowFeature };
type SafeConfig = { features: Features };

const DEFAULT_SAFE_CONFIG: SafeConfig = {
  features: { paynow: { enabled: false, methods: [] } },
};

async function getConfigSafely(): Promise<SafeConfig> {
  try {
    // If a project getConfig() exists, prefer it (lazy import to avoid top-level crashes)
    const mod = await import('./config'); // adjust if your getConfig() lives elsewhere
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
export async function createTRPCContext(input: { req?: Request; headers?: NodeHeaders | Headers; resHeaders?: Headers }) {
  const cfg = await getConfigSafely();

  // Legacy compatibility: expose headers/resHeaders if provided
  const headers = input.headers ?? input.req?.headers;
  const resHeaders = input.resHeaders ?? new Headers();

  // If you previously had auth user on context, keep a null-safe placeholder
  const firebaseUser = null;

  return {
    req: input.req ?? new Request('http://local.fake'), // harmless placeholder if not provided
    headers,
    resHeaders,
    firebaseUser,
    cfg,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export type Context = TRPCContext;

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
