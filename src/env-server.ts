import { z } from "zod";
import { getSecret, getSecretName, SECRET_NAMES } from "./lib/secretManager";

// Server-side environment schema
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  
  // These will be loaded from Google Secret Manager
  FIREBASE_API_KEY: z.string(),
  FIREBASE_AUTH_DOMAIN: z.string(),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_APP_ID: z.string().optional(),
  
  PAYNOW_API_KEY: z.string(),
  PAYNOW_STORE_ID: z.string(),
  PAYNOW_WEBHOOK_SECRET: z.string().optional(),
  PAYNOW_PRODUCTS_JSON: z.string().optional().default("{}"),
  
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
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
});

// Server environment loader that fetches secrets from Google Secret Manager
export async function loadServerEnv() {
  const [
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    firebaseAppId,
    paynowApiKey,
    paynowStoreId,
    paynowWebhookSecret,
    openaiApiKey,
    cronSecret,
  ] = await Promise.all([
    getSecret(getSecretName(SECRET_NAMES.FIREBASE_API_KEY)),
    getSecret(getSecretName(SECRET_NAMES.FIREBASE_AUTH_DOMAIN)),
    getSecret(getSecretName(SECRET_NAMES.FIREBASE_PROJECT_ID)),
    getSecret(getSecretName(SECRET_NAMES.FIREBASE_APP_ID)).catch(() => undefined),
    getSecret(getSecretName(SECRET_NAMES.PAYNOW_API_KEY)),
    getSecret(getSecretName(SECRET_NAMES.PAYNOW_STORE_ID)),
    getSecret(getSecretName(SECRET_NAMES.PAYNOW_WEBHOOK_SECRET)).catch(() => undefined),
    getSecret(getSecretName(SECRET_NAMES.OPENAI_API_KEY)),
    getSecret(getSecretName(SECRET_NAMES.CRON_SECRET)).catch(() => undefined),
  ]);

  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV || "development",
    FIREBASE_API_KEY: firebaseApiKey,
    FIREBASE_AUTH_DOMAIN: firebaseAuthDomain,
    FIREBASE_PROJECT_ID: firebaseProjectId,
    FIREBASE_APP_ID: firebaseAppId,
    PAYNOW_API_KEY: paynowApiKey,
    PAYNOW_STORE_ID: paynowStoreId,
    PAYNOW_WEBHOOK_SECRET: paynowWebhookSecret,
    PAYNOW_PRODUCTS_JSON: process.env.PAYNOW_PRODUCTS_JSON,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    OPENAI_API_KEY: openaiApiKey,
    GAMESERVER_GAME: process.env.GAMESERVER_GAME,
    GAMESERVER_IP: process.env.GAMESERVER_IP,
    GAMESERVER_PORT: process.env.GAMESERVER_PORT,
    FEAT_SUB_POINTS: process.env.FEAT_SUB_POINTS,
    SUB_PLAN_POINTS_JSON: process.env.SUB_PLAN_POINTS_JSON,
    SUB_POINTS_KIND: process.env.SUB_POINTS_KIND,
    SUB_POINTS_EXPIRE_DAYS: process.env.SUB_POINTS_EXPIRE_DAYS,
    SUB_TOPUP_LAZY: process.env.SUB_TOPUP_LAZY,
    CRON_SECRET: cronSecret,
  });
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;
