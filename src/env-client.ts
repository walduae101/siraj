import { z } from "zod";

// Client-side environment schema - re-exported from server
export const clientEnvSchema = z.object({
  // Public Firebase config
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  
  // Public app config
  NEXT_PUBLIC_WEBSITE_URL: z.string(),
  NEXT_PUBLIC_PAYNOW_STORE_ID: z.string(),
  NEXT_PUBLIC_BACKGROUND_IMAGE_URL: z.string(),
  NEXT_PUBLIC_DISCORD_INVITE_URL: z.string(),
  NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: z.string(),
});

// Client environment - will be populated from server environment
export const clientEnv = clientEnvSchema.parse({
  // These will be populated by the server environment loader
  NEXT_PUBLIC_FIREBASE_API_KEY: "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
  NEXT_PUBLIC_FIREBASE_APP_ID: "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
  NEXT_PUBLIC_WEBSITE_URL: "",
  NEXT_PUBLIC_PAYNOW_STORE_ID: "",
  NEXT_PUBLIC_BACKGROUND_IMAGE_URL: "",
  NEXT_PUBLIC_DISCORD_INVITE_URL: "",
  NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: "",
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
