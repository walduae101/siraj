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
export const createTRPCContext = async (opts: { 
  req?: Request; 
  headers?: Headers; 
  resHeaders?: Headers; 
}) => {
  try {
    const cfg = await getConfigSafely();
    
    // Handle both new and old calling patterns
    const req = opts.req;
    const headers = opts.headers || req?.headers || new Headers();
    const resHeaders = opts.resHeaders || new Headers();
    
    const payNowStorefrontHeaders: Record<string, string> = {};

    // IP Address & Country Code Forwarding
    const realIpAddress =
      headers.get("cf-connecting-ip") ||
      headers.get("x-real-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    const realCountryCode = headers.get("cf-ipcountry");

    if (realIpAddress && isValidPublicIP(realIpAddress)) {
      payNowStorefrontHeaders["x-paynow-customer-ip"] = realIpAddress;
    }

    if (realCountryCode && isValidCountryCode(realCountryCode)) {
      payNowStorefrontHeaders["x-paynow-customer-countrycode"] = realCountryCode;
    }

    const pnToken = headers
      .get("cookie")
      ?.split(";")
      ?.find((cookie) => cookie.trim().startsWith("pn_token="))
      ?.split("=")[1];

    // URL decode the token in case it was encoded
    const decodedToken = pnToken ? decodeURIComponent(pnToken) : null;

    if (decodedToken) {
      // Sanitize token to prevent "Invalid character in header content" errors
      const sanitizedToken = decodedToken
        .trim()
        .replace(/[\r\n\t]/g, "")
        .replace(/[^\x20-\x7E]/g, "");
      console.log(
        "Setting auth header with token length:",
        sanitizedToken.length,
      );
      console.log("Original token length:", decodedToken.length);
      console.log("Token has control chars:", decodedToken !== sanitizedToken);
      payNowStorefrontHeaders.Authorization = `Customer ${sanitizedToken}`;
    }

    // Extract Firebase auth token
    let firebaseUser: {
      uid: string;
      email?: string;
      [key: string]: unknown;
    } | null = null;
    const authHeader = headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const auth = await getAdminAuth();
        firebaseUser = await auth.verifyIdToken(token);
        console.log("Firebase user authenticated:", firebaseUser.uid);
      } catch (error) {
        console.error("Failed to verify Firebase token:", {
          error: error instanceof Error ? error.message : String(error),
          tokenLength: token.length,
          tokenPrefix: `${token.substring(0, 20)}...`,
        });
      }
    } else {
      if (authHeader) {
        console.warn("Invalid auth header format:", authHeader.substring(0, 50));
      }
    }

    return {
      headers,
      resHeaders,
      payNowStorefrontHeaders,
      firebaseUser,
      cfg,
      req,
    };
  } catch (e) {
    console.error("[tRPC] createTRPCContext failed; using minimal context");
    return {
      headers: opts.headers || new Headers(),
      resHeaders: opts.resHeaders || new Headers(),
      payNowStorefrontHeaders: {},
      firebaseUser: null,
      cfg: DEFAULT_SAFE_CONFIG,
      req: opts.req,
    };
  }
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
