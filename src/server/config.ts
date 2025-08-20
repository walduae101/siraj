// Centralized configuration loader for Google Secret Manager
import fs from "node:fs";
import { z } from "zod";

const ConfigSchema = z.object({
  paynow: z.object({
    apiKey: z.string(),
    webhookSecret: z.string(),
    storeId: z.string(),
    products: z.record(z.string(), z.string())
  }),
  subscriptions: z.object({
    plans: z.record(z.string(), z.object({ 
      name: z.string(),
      cycle: z.enum(["month", "year"]),
      pointsPerCycle: z.number().int().nonnegative() 
    })),
    pointsKind: z.enum(["paid", "promo"]).default("promo"),
    pointsExpireDays: z.number().int().default(365),
    topupLazy: z.boolean().default(true),
    cronSecret: z.string()
  }),
  auth: z.object({
    nextAuthUrl: z.string().optional(),
    googleClientId: z.string().optional(),
    googleClientSecret: z.string().optional()
  }),
  firebase: z.object({
    projectId: z.string(),
    serviceAccountJson: z.string().optional()
  }),
  openai: z.object({
    apiKey: z.string()
  }),
  features: z.object({
    FEAT_POINTS: z.boolean().default(true),
    FEAT_SUB_POINTS: z.boolean().default(true),
    PAYNOW_LIVE: z.boolean().default(true),
    STUB_CHECKOUT: z.boolean().default(false)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

const CONFIG_PATH = process.env.SIRAJ_CONFIG_PATH ?? "/var/secrets/siraj/config.json";

// Simple TTL cache so we can pick up rotations without hurting latency
let cached: Config | null = null;
let expiresAt = 0;
const TTL_MS = 60_000; // re-read at most once per minute

export function getConfig(): Config {
  const now = Date.now();
  if (cached && now < expiresAt) return cached;

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = ConfigSchema.parse(JSON.parse(raw));
    cached = parsed;
    expiresAt = now + TTL_MS;
    return parsed;
  } catch (error) {
    // In development, fall back to environment variables
    if (process.env.NODE_ENV === "development" && !fs.existsSync(CONFIG_PATH)) {
      console.warn(`[config] ${CONFIG_PATH} not found, falling back to env vars`);
      return getConfigFromEnv();
    }
    throw error;
  }
}

// Fallback for local development - reads from environment variables
function getConfigFromEnv(): Config {
  return {
    paynow: {
      apiKey: process.env.PAYNOW_API_KEY ?? "",
      webhookSecret: process.env.PAYNOW_WEBHOOK_SECRET ?? "",
      storeId: process.env.PAYNOW_STORE_ID ?? "321641745957789696",
      products: JSON.parse(process.env.PAYNOW_PRODUCTS_JSON ?? "{}")
    },
    subscriptions: {
      plans: JSON.parse(process.env.SUB_PLAN_POINTS_JSON ?? "{}"),
      pointsKind: (process.env.SUB_POINTS_KIND as "paid" | "promo") ?? "promo",
      pointsExpireDays: Number(process.env.SUB_POINTS_EXPIRE_DAYS) || 365,
      topupLazy: process.env.SUB_TOPUP_LAZY === "1",
      cronSecret: process.env.CRON_SECRET ?? ""
    },
    auth: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID ?? "",
      serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? ""
    },
    features: {
      FEAT_POINTS: process.env.FEAT_POINTS === "1",
      FEAT_SUB_POINTS: process.env.FEAT_SUB_POINTS === "1",
      PAYNOW_LIVE: process.env.PAYNOW_LIVE === "1",
      STUB_CHECKOUT: process.env.STUB_CHECKOUT === "1"
    }
  };
}

// Helper to get product mapping
export function getProductId(sku: string): string | undefined {
  const cfg = getConfig();
  return cfg.paynow.products[sku];
}

// Helper to get subscription plan
export function getSubscriptionPlan(productId: string) {
  const cfg = getConfig();
  // First check if it's a subscription product
  const skuEntry = Object.entries(cfg.paynow.products).find(([_, id]) => id === productId);
  if (!skuEntry) return null;
  
  const [sku] = skuEntry;
  return cfg.subscriptions.plans[sku] ?? null;
}
