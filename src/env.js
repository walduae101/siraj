import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL: z
      .string()
      .default(
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
      ),
    NEXT_PUBLIC_PAYNOW_STORE_ID: z.string().default("321641745957789696"),
    NEXT_PUBLIC_DISCORD_INVITE_URL: z
      .string()
      .default("https://discord.gg/siraj"),
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: z
      .string()
      .default("Connecting to Siraj Game Server..."),
    NEXT_PUBLIC_WEBSITE_URL: z.string().default("https://siraj.life"),

    // Firebase config is now loaded at runtime via /api/public-config
    // No more NEXT_PUBLIC_FIREBASE_* variables needed

    // PayNow Points Mapping
    NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON: z
      .string()
      .optional()
      .default("{}"),
    NEXT_PUBLIC_SUB_PLAN_POINTS_JSON: z.string().optional().default("{}"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL:
      process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL ||
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    NEXT_PUBLIC_PAYNOW_STORE_ID:
      process.env.NEXT_PUBLIC_PAYNOW_STORE_ID || "321641745957789696",
    NEXT_PUBLIC_DISCORD_INVITE_URL:
      process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/siraj",
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE:
      process.env.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE ||
      "Connecting to Siraj Game Server...",
    NEXT_PUBLIC_WEBSITE_URL:
      process.env.NEXT_PUBLIC_WEBSITE_URL || "https://siraj.life",
    
    // Firebase config is now loaded at runtime via /api/public-config
    // No more NEXT_PUBLIC_FIREBASE_* variables needed
    
    NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON:
      process.env.NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON,
    NEXT_PUBLIC_SUB_PLAN_POINTS_JSON:
      process.env.NEXT_PUBLIC_SUB_PLAN_POINTS_JSON,
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
