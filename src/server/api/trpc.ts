import { initTRPC } from "@trpc/server";

import superjson from "superjson";

import { ZodError } from "zod";

import type Context from "./types/context";

import isValidCountryCode from "./utils/countryCode";
import isValidPublicIP from "./utils/ip";

export const createTRPCContext = async ({
  headers,
  resHeaders,
}: {
  headers: Headers;
  resHeaders: Headers;
}): Promise<Context> => {
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

  return {
    headers,
    resHeaders,
    payNowStorefrontHeaders,
  };
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
