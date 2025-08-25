// Centralized configuration loader for Google Secret Manager
import fs from "node:fs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { z } from "zod";

// Validate no secrets in environment variables
function validateNoSecretsInEnv() {
  const dangerousPatterns = [
    /AIza[A-Za-z0-9_-]{35}/, // Firebase API keys
    /pnapi_v1_[A-Za-z0-9]{40,}/, // PayNow API keys
    /sk-proj-[A-Za-z0-9]{20,}/, // OpenAI API keys
    /pn-[a-f0-9]{32}/, // PayNow webhook secrets
    /[A-Za-z0-9+/]{40,}={0,2}/, // Base64 encoded secrets (like cron secrets)
  ];

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) continue; // Skip public vars

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value || "")) {
        console.error(
          `❌ SECURITY: Detected secret pattern in environment variable ${key}`,
        );
        console.error(
          "   Secrets must be loaded from Secret Manager, not environment variables",
        );
        process.exit(1);
      }
    }
  }
}

const ConfigSchema = z.object({
  paynow: z.object({
    apiKey: z.string(),
    webhookSecret: z.string(),
    webhookId: z.string().optional(),
    storeId: z.string(),
    products: z.record(z.string(), z.string()),
  }),
  subscriptions: z.object({
    plans: z.record(
      z.string(),
      z.object({
        name: z.string(),
        cycle: z.enum(["month", "year"]),
        pointsPerCycle: z.number().int().nonnegative(),
        paynowProductId: z.string().optional(),
        price: z.number().int().nonnegative().optional(),
      }),
    ),
    pointsKind: z.enum(["paid", "promo"]).default("promo"),
    pointsExpireDays: z.number().int().default(365),
    topupLazy: z.boolean().default(true),
    cronSecret: z.string(),
  }),
  auth: z.object({
    nextAuthUrl: z.string().optional(),
    googleClientId: z.string().optional(),
    googleClientSecret: z.string().optional(),
  }),
  firebase: z.object({
    projectId: z.string(),
    serviceAccountJson: z.string().optional(),
    apiKey: z.string().optional(),
    authDomain: z.string().optional(),
    appId: z.string().optional(),
    storageBucket: z.string().optional(),
    messagingSenderId: z.string().optional(),
  }),
  openai: z.object({
    apiKey: z.string(),
  }),
  features: z.object({
    FEAT_POINTS: z.boolean().default(true),
    FEAT_SUB_POINTS: z.boolean().default(true),
    PAYNOW_LIVE: z.boolean().default(true),
    STUB_CHECKOUT: z.boolean().default(false),
    webhookMode: z.enum(["sync", "queue"]).default("sync"),
    // PHASE 6A: Queue Mode Canary
    webhookQueueCanaryRatio: z.number().min(0).max(1).default(0),
    PRODUCT_SOT: z.enum(["firestore", "gsm"]).default("firestore"),
    ALLOW_NEGATIVE_BALANCE: z.boolean().default(true),
    // PHASE 4: Revenue Assurance
    RECONCILIATION_ENABLED: z.boolean().default(true),
    BACKFILL_ENABLED: z.boolean().default(true),
    ENVIRONMENT: z.enum(["test", "prod"]).default("test"),
    // PHASE 5: Fraud/Abuse Controls
    RATE_LIMIT_ENABLED: z.boolean().default(true),
    RISK_HOLDS_ENABLED: z.boolean().default(true),
    // PHASE 5: Fraud Detection & Prevention
    FRAUD_SHADOW_MODE: z.boolean().default(true),
    EDGE_RATE_LIMIT_ENABLED: z.boolean().default(true),
    APP_RATE_LIMIT_ENABLED: z.boolean().default(true),
    // PHASE 7: Multi-Region Readiness
    multiRegion: z
      .object({
        enabled: z.boolean().default(false),
        primaryRegion: z.string().default("us-central1"),
        secondaryRegion: z.string().default("europe-west1"),
        failoverEnabled: z.boolean().default(true),
      })
      .default({
        enabled: false,
        primaryRegion: "us-central1",
        secondaryRegion: "europe-west1",
        failoverEnabled: true,
      }),
    eventSchema: z
      .object({
        version: z.number().default(3),
        minCompatible: z.number().default(2),
      })
      .default({
        version: 3,
        minCompatible: 2,
      }),
  }),

  // Fraud detection configuration
  fraud: z
    .object({
      // Phase 5: Fraud Mode and Thresholds
      FRAUD_MODE: z.enum(["off", "shadow", "enforce"]).default("shadow"),
      FRAUD_SCORE_THRESHOLD_PURCHASE: z.number().min(0).max(100).default(72), // TUNED: Increased from 65 to 72
      FRAUD_SCORE_THRESHOLD_SUBSCRIPTION: z
        .number()
        .min(0)
        .max(100)
        .default(60),
      FRAUD_BLOCK_COUNTRIES: z.array(z.string().length(2)).default([]),
      FRAUD_ALLOW_TEST_USERS: z.boolean().default(true),

      // Rate limiting configuration
      RATE_LIMITS: z
        .object({
          perIpPerMin: z.number().default(60),
          perUidPerMin: z.number().default(30),
          perUidPerHour: z.number().default(200),
        })
        .default({ perIpPerMin: 180, perUidPerMin: 30, perUidPerHour: 200 }), // TUNED: Increased perIpPerMin from 60 to 180

      // Bot defense configuration
      BOTDEFENSE: z
        .object({
          appCheckRequired: z.boolean().default(true),
          recaptchaEnterpriseSiteKey: z.string().optional(),
          minScore: z.number().min(0).max(1).default(0.6),
        })
        .default({ appCheckRequired: true, minScore: 0.6 }),

      // Rate limiting caps per UID and per IP
      checkoutCaps: z
        .object({
          uid: z
            .object({
              perMinute: z.number().default(5),
              perHour: z.number().default(20),
              perDay: z.number().default(100),
            })
            .default({ perMinute: 5, perHour: 20, perDay: 100 }),
          ip: z
            .object({
              perMinute: z.number().default(10),
              perHour: z.number().default(50),
              perDay: z.number().default(200),
            })
            .default({ perMinute: 10, perHour: 50, perDay: 200 }),
        })
        .default({
          uid: { perMinute: 5, perHour: 20, perDay: 100 },
          ip: { perMinute: 10, perHour: 50, perDay: 200 },
        }),

      // Risk scoring thresholds
      minAccountAgeMinutes: z.number().default(10),
      riskThresholds: z
        .object({
          allow: z.number().default(30),
          challenge: z.number().default(70),
          deny: z.number().default(90),
        })
        .default({ allow: 30, challenge: 70, deny: 90 }),

      // Bot defense
      recaptchaSiteKey: z.string().optional(),
      recaptchaProject: z.string().optional(),
      appCheckPublicKeys: z.array(z.string()).default([]),
    })
    .default({
      FRAUD_MODE: "shadow",
      FRAUD_SCORE_THRESHOLD_PURCHASE: 72, // TUNED: Increased from 65 to 72
      FRAUD_SCORE_THRESHOLD_SUBSCRIPTION: 60,
      FRAUD_BLOCK_COUNTRIES: [],
      FRAUD_ALLOW_TEST_USERS: true,
      RATE_LIMITS: { perIpPerMin: 180, perUidPerMin: 30, perUidPerHour: 200 }, // TUNED: Increased perIpPerMin from 60 to 180
      BOTDEFENSE: { appCheckRequired: true, minScore: 0.6 },
      checkoutCaps: {
        uid: { perMinute: 5, perHour: 20, perDay: 100 },
        ip: { perMinute: 10, perHour: 50, perDay: 200 },
      },
      minAccountAgeMinutes: 10,
      riskThresholds: { allow: 30, challenge: 70, deny: 90 },
      recaptchaSiteKey: undefined,
      recaptchaProject: undefined,
      appCheckPublicKeys: [],
    }),

  // Rate limiting configuration
  rateLimit: z
    .object({
      // Default limits per role
      authenticated: z
        .object({
          requestsPerMinute: z.number().default(30),
          burstSize: z.number().default(15),
        })
        .default({ requestsPerMinute: 30, burstSize: 15 }),
      anonymous: z
        .object({
          requestsPerMinute: z.number().default(10),
          burstSize: z.number().default(5),
        })
        .default({ requestsPerMinute: 10, burstSize: 5 }),
      admin: z
        .object({
          requestsPerMinute: z.number().default(3),
          burstSize: z.number().default(1),
        })
        .default({ requestsPerMinute: 3, burstSize: 1 }),

      // Per-route overrides
      routes: z
        .object({
          webhook: z
            .object({
              requestsPerMinute: z.number().default(300),
              burstSize: z.number().default(100),
            })
            .default({ requestsPerMinute: 300, burstSize: 100 }),
          paywall: z
            .object({
              requestsPerMinute: z.number().default(60),
              burstSize: z.number().default(30),
            })
            .default({ requestsPerMinute: 60, burstSize: 30 }),
          promo: z
            .object({
              requestsPerMinute: z.number().default(10),
              burstSize: z.number().default(5),
            })
            .default({ requestsPerMinute: 10, burstSize: 5 }),
          admin: z
            .object({
              requestsPerMinute: z.number().default(3),
              burstSize: z.number().default(1),
            })
            .default({ requestsPerMinute: 3, burstSize: 1 }),
        })
        .default({
          webhook: { requestsPerMinute: 300, burstSize: 100 },
          paywall: { requestsPerMinute: 60, burstSize: 30 },
          promo: { requestsPerMinute: 10, burstSize: 5 },
          admin: { requestsPerMinute: 3, burstSize: 1 },
        }),
    })
    .default({
      authenticated: { requestsPerMinute: 30, burstSize: 15 },
      anonymous: { requestsPerMinute: 10, burstSize: 5 },
      admin: { requestsPerMinute: 3, burstSize: 1 },
      routes: {
        webhook: { requestsPerMinute: 300, burstSize: 100 },
        paywall: { requestsPerMinute: 60, burstSize: 30 },
        promo: { requestsPerMinute: 10, burstSize: 5 },
        admin: { requestsPerMinute: 3, burstSize: 1 },
      },
    }),
});

export type Config = z.infer<typeof ConfigSchema>;

// Google Secret Manager client
let secretManagerClient: SecretManagerServiceClient | null = null;

// Simple TTL cache so we can pick up rotations without hurting latency
let cached: Config | null = null;
let expiresAt = 0;
const TTL_MS = 10 * 60_000; // re-read at most once per 10 minutes

async function getSecretManagerClient(): Promise<SecretManagerServiceClient> {
  if (!secretManagerClient) {
    secretManagerClient = new SecretManagerServiceClient();
  }
  return secretManagerClient;
}

async function getSecret(secretName: string): Promise<string> {
  try {
    const client = await getSecretManagerClient();
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        "GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID environment variable is required",
      );
    }

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });

    if (!version.payload?.data) {
      throw new Error(`Secret ${secretName} not found or empty`);
    }

    return version.payload.data.toString();
  } catch (error) {
    console.error(`Failed to fetch secret ${secretName}:`, error);
    throw error;
  }
}

export async function getConfig(): Promise<Config> {
  const now = Date.now();
  if (cached && now < expiresAt) return cached;

  try {
    // Check if config is available as environment variable first (Cloud Run mounted secret)
    if (process.env.SIRAJ_CONFIG) {
      console.log(
        "[config] Loading configuration from SIRAJ_CONFIG environment variable",
      );
      const parsed = ConfigSchema.parse(JSON.parse(process.env.SIRAJ_CONFIG));
      cached = parsed;
      expiresAt = now + TTL_MS;
      return parsed;
    }

    // Try to load from Google Secret Manager API
    if (
      process.env.NODE_ENV === "production" ||
      process.env.USE_SECRET_MANAGER === "true"
    ) {
      console.log(
        "[config] Loading configuration from Google Secret Manager API",
      );

      const configSecret = await getSecret("siraj-config");
      const parsed = ConfigSchema.parse(JSON.parse(configSecret));
      cached = parsed;
      expiresAt = now + TTL_MS;
      return parsed;
    }

    // Fallback to local config file for development
    const CONFIG_PATH =
      process.env.SIRAJ_CONFIG_PATH ?? "/var/secrets/siraj/config.json";
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = ConfigSchema.parse(JSON.parse(raw));
    cached = parsed;
    expiresAt = now + TTL_MS;
    return parsed;
  } catch (error) {
    // In development, fall back to environment variables
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[config] Secret Manager and config file not available, falling back to env vars",
      );
      return getConfigFromEnv();
    }
    throw error;
  }
}

// Synchronous version for backward compatibility
export function getConfigSync(): Config {
  if (cached) return cached;

  // For synchronous access, use environment variables
  console.warn(
    "[config] Using synchronous config access - consider using async getConfig()",
  );
  return getConfigFromEnv();
}

// Fallback for local development - reads from environment variables
function getConfigFromEnv(): Config {
  // Run security validation before processing any environment variables
  validateNoSecretsInEnv();
  return {
    paynow: {
      apiKey: process.env.PAYNOW_API_KEY ?? "",
      webhookSecret: process.env.PAYNOW_WEBHOOK_SECRET ?? "",
      storeId: process.env.PAYNOW_STORE_ID ?? "321641745957789696",
      products: JSON.parse(process.env.PAYNOW_PRODUCTS_JSON ?? "{}"),
    },
    subscriptions: {
      plans: JSON.parse(process.env.SUB_PLAN_POINTS_JSON ?? "{}"),
      pointsKind: (process.env.SUB_POINTS_KIND as "paid" | "promo") ?? "promo",
      pointsExpireDays: Number(process.env.SUB_POINTS_EXPIRE_DAYS) || 365,
      topupLazy: process.env.SUB_TOPUP_LAZY === "1",
      cronSecret: process.env.CRON_SECRET ?? "",
    },
    auth: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID ?? "",
      serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? "",
    },
    features: {
      FEAT_POINTS: process.env.FEAT_POINTS === "1",
      FEAT_SUB_POINTS: process.env.FEAT_SUB_POINTS === "1",
      PAYNOW_LIVE: process.env.PAYNOW_LIVE === "1",
      STUB_CHECKOUT: process.env.STUB_CHECKOUT === "1",
      webhookMode: (process.env.WEBHOOK_MODE as "sync" | "queue") ?? "sync",
      webhookQueueCanaryRatio: Number.parseFloat(
        process.env.WEBHOOK_QUEUE_CANARY_RATIO ?? "0",
      ),
      PRODUCT_SOT:
        (process.env.PRODUCT_SOT as "firestore" | "gsm") ?? "firestore",
      ALLOW_NEGATIVE_BALANCE: process.env.ALLOW_NEGATIVE_BALANCE === "1",
      // PHASE 4: Revenue Assurance
      RECONCILIATION_ENABLED: process.env.RECONCILIATION_ENABLED !== "0",
      BACKFILL_ENABLED: process.env.BACKFILL_ENABLED !== "0",
      ENVIRONMENT: (process.env.ENVIRONMENT as "test" | "prod") ?? "test",
      // PHASE 5: Fraud/Abuse Controls
      RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "0",
      RISK_HOLDS_ENABLED: process.env.RISK_HOLDS_ENABLED !== "0",
      // PHASE 5: Fraud Detection & Prevention
      FRAUD_SHADOW_MODE: process.env.FRAUD_SHADOW_MODE === "1",
      EDGE_RATE_LIMIT_ENABLED: process.env.EDGE_RATE_LIMIT_ENABLED === "1",
      APP_RATE_LIMIT_ENABLED: process.env.APP_RATE_LIMIT_ENABLED === "1",
      // PHASE 7: Multi-Region Readiness
      multiRegion: {
        enabled: process.env.MULTI_REGION_ENABLED === "1",
        primaryRegion: process.env.PRIMARY_REGION ?? "us-central1",
        secondaryRegion: process.env.SECONDARY_REGION ?? "europe-west1",
        failoverEnabled: process.env.FAILOVER_ENABLED !== "0",
      },
      eventSchema: {
        version: Number.parseInt(process.env.EVENT_SCHEMA_VERSION ?? "3", 10),
        minCompatible: Number.parseInt(
          process.env.EVENT_SCHEMA_MIN_COMPATIBLE ?? "2",
          10,
        ),
      },
    },
    fraud: {
      // Phase 5: Fraud Mode and Thresholds
      FRAUD_MODE:
        (process.env.FRAUD_MODE as "off" | "shadow" | "enforce") ?? "shadow",
      FRAUD_SCORE_THRESHOLD_PURCHASE:
        Number(process.env.FRAUD_SCORE_THRESHOLD_PURCHASE) || 65,
      FRAUD_SCORE_THRESHOLD_SUBSCRIPTION:
        Number(process.env.FRAUD_SCORE_THRESHOLD_SUBSCRIPTION) || 60,
      FRAUD_BLOCK_COUNTRIES: (process.env.FRAUD_BLOCK_COUNTRIES ?? "")
        .split(",")
        .filter(Boolean),
      FRAUD_ALLOW_TEST_USERS: process.env.FRAUD_ALLOW_TEST_USERS !== "0",

      // Rate limiting configuration
      RATE_LIMITS: {
        perIpPerMin: Number(process.env.FRAUD_RATE_LIMITS_PER_IP_PER_MIN) || 60,
        perUidPerMin:
          Number(process.env.FRAUD_RATE_LIMITS_PER_UID_PER_MIN) || 30,
        perUidPerHour:
          Number(process.env.FRAUD_RATE_LIMITS_PER_UID_PER_HOUR) || 200,
      },

      // Bot defense configuration
      BOTDEFENSE: {
        appCheckRequired:
          process.env.FRAUD_BOTDEFENSE_APP_CHECK_REQUIRED !== "0",
        recaptchaEnterpriseSiteKey:
          process.env.FRAUD_BOTDEFENSE_RECAPTCHA_ENTERPRISE_SITE_KEY,
        minScore: Number(process.env.FRAUD_BOTDEFENSE_MIN_SCORE) || 0.6,
      },

      checkoutCaps: {
        uid: {
          perMinute: Number(process.env.FRAUD_CHECKOUT_CAPS_UID_RPM) || 5,
          perHour: Number(process.env.FRAUD_CHECKOUT_CAPS_UID_RPH) || 20,
          perDay: Number(process.env.FRAUD_CHECKOUT_CAPS_UID_RPD) || 100,
        },
        ip: {
          perMinute: Number(process.env.FRAUD_CHECKOUT_CAPS_IP_RPM) || 10,
          perHour: Number(process.env.FRAUD_CHECKOUT_CAPS_IP_RPH) || 50,
          perDay: Number(process.env.FRAUD_CHECKOUT_CAPS_IP_RPD) || 200,
        },
      },
      minAccountAgeMinutes:
        Number(process.env.FRAUD_MIN_ACCOUNT_AGE_MINUTES) || 10,
      riskThresholds: {
        allow: Number(process.env.FRAUD_RISK_THRESHOLDS_ALLOW) || 30,
        challenge: Number(process.env.FRAUD_RISK_THRESHOLDS_CHALLENGE) || 70,
        deny: Number(process.env.FRAUD_RISK_THRESHOLDS_DENY) || 90,
      },
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
      recaptchaProject: process.env.RECAPTCHA_PROJECT,
      appCheckPublicKeys: (process.env.APP_CHECK_PUBLIC_KEYS ?? "").split(","),
    },
    rateLimit: {
      authenticated: {
        requestsPerMinute: Number(process.env.RATE_LIMIT_AUTH_RPM) || 30,
        burstSize: Number(process.env.RATE_LIMIT_AUTH_BURST) || 15,
      },
      anonymous: {
        requestsPerMinute: Number(process.env.RATE_LIMIT_ANON_RPM) || 10,
        burstSize: Number(process.env.RATE_LIMIT_ANON_BURST) || 5,
      },
      admin: {
        requestsPerMinute: Number(process.env.RATE_LIMIT_ADMIN_RPM) || 3,
        burstSize: Number(process.env.RATE_LIMIT_ADMIN_BURST) || 1,
      },
      routes: {
        webhook: {
          requestsPerMinute: Number(process.env.RATE_LIMIT_WEBHOOK_RPM) || 300,
          burstSize: Number(process.env.RATE_LIMIT_WEBHOOK_BURST) || 100,
        },
        paywall: {
          requestsPerMinute: Number(process.env.RATE_LIMIT_PAYWALL_RPM) || 60,
          burstSize: Number(process.env.RATE_LIMIT_PAYWALL_BURST) || 30,
        },
        promo: {
          requestsPerMinute: Number(process.env.RATE_LIMIT_PROMO_RPM) || 10,
          burstSize: Number(process.env.RATE_LIMIT_PROMO_BURST) || 5,
        },
        admin: {
          requestsPerMinute:
            Number(process.env.RATE_LIMIT_ADMIN_ROUTE_RPM) || 3,
          burstSize: Number(process.env.RATE_LIMIT_ADMIN_ROUTE_BURST) || 1,
        },
      },
    },
  };
}

// Helper to get product mapping
export async function getProductId(sku: string): Promise<string | undefined> {
  const cfg = await getConfig();
  return cfg.paynow.products[sku];
}

// Helper to get subscription plan
export async function getSubscriptionPlan(productId: string) {
  const cfg = await getConfig();
  // First check if it's a subscription product
  const skuEntry = Object.entries(cfg.paynow.products).find(
    ([_, id]) => id === productId,
  );
  if (!skuEntry) return null;

  const [sku] = skuEntry;
  return cfg.subscriptions.plans[sku] ?? null;
}

/**
 * Get fraud configuration with structured logging support
 */
export async function getFraudConfig() {
  const config = await getConfig();
  return {
    mode: config.fraud.FRAUD_MODE,
    scoreThresholdPurchase: config.fraud.FRAUD_SCORE_THRESHOLD_PURCHASE,
    scoreThresholdSubscription: config.fraud.FRAUD_SCORE_THRESHOLD_SUBSCRIPTION,
    blockCountries: config.fraud.FRAUD_BLOCK_COUNTRIES,
    allowTestUsers: config.fraud.FRAUD_ALLOW_TEST_USERS,
    rateLimits: config.fraud.RATE_LIMITS,
    botDefense: config.fraud.BOTDEFENSE,
    // Legacy fields for backward compatibility
    checkoutCaps: config.fraud.checkoutCaps,
    minAccountAgeMinutes: config.fraud.minAccountAgeMinutes,
    riskThresholds: config.fraud.riskThresholds,
    recaptchaSiteKey: config.fraud.recaptchaSiteKey,
    recaptchaProject: config.fraud.recaptchaProject,
    appCheckPublicKeys: config.fraud.appCheckPublicKeys,
  };
}
