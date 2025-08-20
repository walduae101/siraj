import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const clientEnv = createEnv({
  /**
   * Client-side environment variables only
   */
  client: {
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL: z.string(),
    NEXT_PUBLIC_PAYNOW_STORE_ID: z.string(),
    NEXT_PUBLIC_DISCORD_INVITE_URL: z.string(),
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: z.string(),
    NEXT_PUBLIC_WEBSITE_URL: z.string(),

    // Firebase Web SDK
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL:
      process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
    NEXT_PUBLIC_PAYNOW_STORE_ID: process.env.NEXT_PUBLIC_PAYNOW_STORE_ID,
    NEXT_PUBLIC_DISCORD_INVITE_URL: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE:
      process.env.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE,
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
