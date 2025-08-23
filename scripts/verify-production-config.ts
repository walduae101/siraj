#!/usr/bin/env tsx

/**
 * Verify that production configuration has all required fields
 * This helps diagnose configuration issues in production
 */

import { z } from "zod";

// Define the complete config schema that production expects
const ConfigSchema = z.object({
  paynow: z.object({
    apiKey: z.string(),
    webhookSecret: z.string(),
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
    PRODUCT_SOT: z.enum(["firestore", "gsm"]).default("firestore"),
    ALLOW_NEGATIVE_BALANCE: z.boolean().default(true),
    RECONCILIATION_ENABLED: z.boolean().default(true),
    BACKFILL_ENABLED: z.boolean().default(true),
    ENVIRONMENT: z.enum(["test", "prod"]).default("test"),
    RATE_LIMIT_ENABLED: z.boolean().default(true),
    RISK_HOLDS_ENABLED: z.boolean().default(true),
  }),
  rateLimit: z.object({
    authenticated: z.object({
      requestsPerMinute: z.number().default(30),
      burstSize: z.number().default(15),
    }),
    anonymous: z.object({
      requestsPerMinute: z.number().default(10),
      burstSize: z.number().default(5),
    }),
    admin: z.object({
      requestsPerMinute: z.number().default(3),
      burstSize: z.number().default(1),
    }),
    routes: z.object({
      webhook: z.object({
        requestsPerMinute: z.number().default(300),
        burstSize: z.number().default(100),
      }),
      paywall: z.object({
        requestsPerMinute: z.number().default(60),
        burstSize: z.number().default(30),
      }),
      promo: z.object({
        requestsPerMinute: z.number().default(10),
        burstSize: z.number().default(5),
      }),
      admin: z.object({
        requestsPerMinute: z.number().default(3),
        burstSize: z.number().default(1),
      }),
    }),
  }),
});

// Sample minimal config for production with rateLimit
const sampleConfig = {
  paynow: {
    apiKey: "your-paynow-api-key",
    webhookSecret: "your-webhook-secret",
    storeId: "321641745957789696",
    products: {
      "459935272365195264": "20",
      "458255405240287232": "50",
      "458255787102310400": "150",
      "458256188073574400": "500",
    },
  },
  subscriptions: {
    plans: {
      "458253675014389760": {
        name: "Basic Monthly",
        cycle: "month" as const,
        pointsPerCycle: 50,
      },
      "458254106331451392": {
        name: "Pro Monthly",
        cycle: "month" as const,
        pointsPerCycle: 150,
      },
    },
    pointsKind: "promo" as const,
    pointsExpireDays: 365,
    topupLazy: true,
    cronSecret: "your-cron-secret",
  },
  auth: {
    nextAuthUrl: "https://siraj.life",
    googleClientId: "your-google-client-id",
    googleClientSecret: "your-google-client-secret",
  },
  firebase: {
    projectId: "your-firebase-project-id",
    serviceAccountJson: '{"type":"service_account",...}',
  },
  openai: {
    apiKey: "your-openai-api-key",
  },
  features: {
    FEAT_POINTS: true,
    FEAT_SUB_POINTS: true,
    PAYNOW_LIVE: true,
    STUB_CHECKOUT: false,
    webhookMode: "sync" as const,
    PRODUCT_SOT: "firestore" as const,
    ALLOW_NEGATIVE_BALANCE: true,
    RECONCILIATION_ENABLED: true,
    BACKFILL_ENABLED: true,
    ENVIRONMENT: "prod" as const,
    RATE_LIMIT_ENABLED: true,
    RISK_HOLDS_ENABLED: true,
  },
  rateLimit: {
    authenticated: {
      requestsPerMinute: 30,
      burstSize: 15,
    },
    anonymous: {
      requestsPerMinute: 10,
      burstSize: 5,
    },
    admin: {
      requestsPerMinute: 3,
      burstSize: 1,
    },
    routes: {
      webhook: {
        requestsPerMinute: 300,
        burstSize: 100,
      },
      paywall: {
        requestsPerMinute: 60,
        burstSize: 30,
      },
      promo: {
        requestsPerMinute: 10,
        burstSize: 5,
      },
      admin: {
        requestsPerMinute: 3,
        burstSize: 1,
      },
    },
  },
};

async function main() {
  console.log("🔍 Verifying production configuration schema...\n");

  try {
    // Validate the sample config
    const parsed = ConfigSchema.parse(sampleConfig);
    console.log("✅ Sample configuration is valid!");

    // Check if we can read from environment
    const hasEnvConfig = !!(
      process.env.PAYNOW_API_KEY || process.env.FIREBASE_PROJECT_ID
    );

    if (hasEnvConfig) {
      console.log(
        "\n📋 Environment variables detected. Building config from env...",
      );

      // Build config from environment (similar to getConfigFromEnv)
      const envConfig = {
        paynow: {
          apiKey: process.env.PAYNOW_API_KEY || "",
          webhookSecret: process.env.PAYNOW_WEBHOOK_SECRET || "",
          storeId: process.env.PAYNOW_STORE_ID || "321641745957789696",
          products: JSON.parse(process.env.PAYNOW_PRODUCTS_JSON || "{}"),
        },
        subscriptions: {
          plans: JSON.parse(process.env.SUB_PLAN_POINTS_JSON || "{}"),
          pointsKind:
            (process.env.SUB_POINTS_KIND as "paid" | "promo") || "promo",
          pointsExpireDays: Number(process.env.SUB_POINTS_EXPIRE_DAYS) || 365,
          topupLazy: process.env.SUB_TOPUP_LAZY === "1",
          cronSecret: process.env.CRON_SECRET || "",
        },
        auth: {
          nextAuthUrl: process.env.NEXTAUTH_URL,
          googleClientId: process.env.GOOGLE_CLIENT_ID,
          googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "",
          serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY || "",
        },
        features: {
          FEAT_POINTS: process.env.FEAT_POINTS === "1",
          FEAT_SUB_POINTS: process.env.FEAT_SUB_POINTS === "1",
          PAYNOW_LIVE: process.env.PAYNOW_LIVE === "1",
          STUB_CHECKOUT: process.env.STUB_CHECKOUT === "1",
          webhookMode: (process.env.WEBHOOK_MODE as "sync" | "queue") || "sync",
          PRODUCT_SOT:
            (process.env.PRODUCT_SOT as "firestore" | "gsm") || "firestore",
          ALLOW_NEGATIVE_BALANCE: process.env.ALLOW_NEGATIVE_BALANCE === "1",
          RECONCILIATION_ENABLED: process.env.RECONCILIATION_ENABLED !== "0",
          BACKFILL_ENABLED: process.env.BACKFILL_ENABLED !== "0",
          ENVIRONMENT: (process.env.ENVIRONMENT as "test" | "prod") || "test",
          RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "0",
          RISK_HOLDS_ENABLED: process.env.RISK_HOLDS_ENABLED !== "0",
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
              requestsPerMinute:
                Number(process.env.RATE_LIMIT_WEBHOOK_RPM) || 300,
              burstSize: Number(process.env.RATE_LIMIT_WEBHOOK_BURST) || 100,
            },
            paywall: {
              requestsPerMinute:
                Number(process.env.RATE_LIMIT_PAYWALL_RPM) || 60,
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

      try {
        const parsedEnv = ConfigSchema.parse(envConfig);
        console.log("✅ Environment-based configuration is valid!");
      } catch (error) {
        console.error("❌ Environment-based configuration is invalid:");
        if (error instanceof z.ZodError) {
          console.error(JSON.stringify(error.errors, null, 2));
        }
      }
    }

    console.log("\n📝 Required configuration structure:");
    console.log(JSON.stringify(sampleConfig, null, 2));

    console.log(
      "\n⚠️  IMPORTANT: Make sure your production config includes the 'rateLimit' section!",
    );
    console.log(
      "This was added in Phase 5 and is required for the application to work properly.",
    );
  } catch (error) {
    console.error("❌ Configuration validation failed:");
    if (error instanceof z.ZodError) {
      console.error(JSON.stringify(error.errors, null, 2));
    } else {
      console.error(error);
    }
  }
}

main().catch(console.error);
