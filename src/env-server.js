import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// This file should only be imported in server-side code
export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),

    PAYNOW_API_KEY: z.string(),

    // Firebase Admin / Backend
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),

    // OpenAI
    OPENAI_API_KEY: z.string(),

    GAMESERVER_GAME: z.enum(["source", "minecraft"]).optional(),
    GAMESERVER_IP: z.string().optional(),
    GAMESERVER_PORT: z.string().optional(),

    // Subscription Points System
    FEAT_SUB_POINTS: z
      .string()
      .optional()
      .transform((val) => val === "1"),
    SUB_PLAN_POINTS_JSON: z.string().optional().default("{}"),
    SUB_POINTS_KIND: z.enum(["paid", "promo"]).optional().default("promo"),
    SUB_POINTS_EXPIRE_DAYS: z
      .string()
      .optional()
      .transform((val) => Number(val) || 365),
    SUB_TOPUP_LAZY: z
      .string()
      .optional()
      .transform((val) => val === "1"),
    CRON_SECRET: z.string().optional(),
  },

  /**
   * Empty client object since this is server-only
   */
  client: {},

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PAYNOW_API_KEY: process.env.PAYNOW_API_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GAMESERVER_GAME: process.env.GAMESERVER_GAME,
    GAMESERVER_IP: process.env.GAMESERVER_IP,
    GAMESERVER_PORT: process.env.GAMESERVER_PORT,
    FEAT_SUB_POINTS: process.env.FEAT_SUB_POINTS,
    SUB_PLAN_POINTS_JSON: process.env.SUB_PLAN_POINTS_JSON,
    SUB_POINTS_KIND: process.env.SUB_POINTS_KIND,
    SUB_POINTS_EXPIRE_DAYS: process.env.SUB_POINTS_EXPIRE_DAYS,
    SUB_TOPUP_LAZY: process.env.SUB_TOPUP_LAZY,
    CRON_SECRET: process.env.CRON_SECRET,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
