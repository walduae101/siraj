import { z } from "zod";
import { getSecret, getSecretName, SECRET_NAMES } from "./lib/secretManager";

// Server-side environment schema - ALL values from GSM
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  
  // Public Firebase config (from GSM for consistency)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  
  // Public app config (from GSM)
  NEXT_PUBLIC_WEBSITE_URL: z.string(),
  NEXT_PUBLIC_PAYNOW_STORE_ID: z.string(),
  NEXT_PUBLIC_BACKGROUND_IMAGE_URL: z.string(),
  NEXT_PUBLIC_DISCORD_INVITE_URL: z.string(),
  NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: z.string(),
  
  // Server-only secrets
  PAYNOW_API_KEY: z.string(),
  PAYNOW_WEBHOOK_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  CRON_SECRET: z.string(),
  
  // Optional configs (from GSM with defaults)
  PAYNOW_PRODUCTS_JSON: z.string().optional().default("{}"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  
  // Feature flags (from GSM)
  FEAT_SUB_POINTS: z.string().optional().transform((val) => val === "1"),
  SUB_PLAN_POINTS_JSON: z.string().optional().default("{}"),
  SUB_POINTS_KIND: z.enum(["paid", "promo"]).optional().default("promo"),
  SUB_POINTS_EXPIRE_DAYS: z.string().optional().transform((val) => Number(val) || 365),
  SUB_TOPUP_LAZY: z.string().optional().transform((val) => val === "1"),
});

// Server environment loader that fetches ALL values from Google Secret Manager
export async function loadServerEnv() {
  const [
    // Public Firebase config
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    firebaseAppId,
    firebaseStorageBucket,
    firebaseMessagingSenderId,
    
    // Public app config
    websiteUrl,
    paynowStoreId,
    backgroundImageUrl,
    discordInviteUrl,
    gameserverConnectionMessage,
    
    // Server secrets
    paynowApiKey,
    paynowWebhookSecret,
    openaiApiKey,
    cronSecret,
    
    // Optional configs
    paynowProductsJson,
    firebaseServiceAccountJson,
    
    // Feature flags
    featSubPoints,
    subPlanPointsJson,
    subPointsKind,
    subPointsExpireDays,
    subTopupLazy,
  ] = await Promise.all([
    // Public Firebase config
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_API_KEY")),
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")),
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_PROJECT_ID")),
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_APP_ID")),
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")),
    getSecret(getSecretName("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")),
    
    // Public app config
    getSecret(getSecretName("NEXT_PUBLIC_WEBSITE_URL")),
    getSecret(getSecretName("NEXT_PUBLIC_PAYNOW_STORE_ID")),
    getSecret(getSecretName("NEXT_PUBLIC_BACKGROUND_IMAGE_URL")),
    getSecret(getSecretName("NEXT_PUBLIC_DISCORD_INVITE_URL")),
    getSecret(getSecretName("NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE")),
    
    // Server secrets
    getSecret(getSecretName("PAYNOW_API_KEY")),
    getSecret(getSecretName("PAYNOW_WEBHOOK_SECRET")),
    getSecret(getSecretName("OPENAI_API_KEY")),
    getSecret(getSecretName("CRON_SECRET")),
    
    // Optional configs
    getSecret(getSecretName("PAYNOW_PRODUCTS_JSON")).catch(() => "{}"),
    getSecret(getSecretName("FIREBASE_SERVICE_ACCOUNT_JSON")).catch(() => undefined),
    
    // Feature flags
    getSecret(getSecretName("FEAT_SUB_POINTS")).catch(() => "0"),
    getSecret(getSecretName("SUB_PLAN_POINTS_JSON")).catch(() => "{}"),
    getSecret(getSecretName("SUB_POINTS_KIND")).catch(() => "promo").then(val => val.trim()),
    getSecret(getSecretName("SUB_POINTS_EXPIRE_DAYS")).catch(() => "365"),
    getSecret(getSecretName("SUB_TOPUP_LAZY")).catch(() => "0"),
  ]);

  return serverEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV || "development",
    
    // Public Firebase config
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseApiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseAuthDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseProjectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseAppId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseStorageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseMessagingSenderId,
    
    // Public app config
    NEXT_PUBLIC_WEBSITE_URL: websiteUrl,
    NEXT_PUBLIC_PAYNOW_STORE_ID: paynowStoreId,
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL: backgroundImageUrl,
    NEXT_PUBLIC_DISCORD_INVITE_URL: discordInviteUrl,
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: gameserverConnectionMessage,
    
    // Server secrets
    PAYNOW_API_KEY: paynowApiKey,
    PAYNOW_WEBHOOK_SECRET: paynowWebhookSecret,
    OPENAI_API_KEY: openaiApiKey,
    CRON_SECRET: cronSecret,
    
    // Optional configs
    PAYNOW_PRODUCTS_JSON: paynowProductsJson,
    FIREBASE_SERVICE_ACCOUNT_JSON: firebaseServiceAccountJson,
    
    // Feature flags
    FEAT_SUB_POINTS: featSubPoints,
    SUB_PLAN_POINTS_JSON: subPlanPointsJson,
    SUB_POINTS_KIND: subPointsKind,
    SUB_POINTS_EXPIRE_DAYS: subPointsExpireDays,
    SUB_TOPUP_LAZY: subTopupLazy,
  });
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;
