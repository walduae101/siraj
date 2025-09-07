import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// =============================================================================
// ENTERPRISE NEXT.JS APP TEMPLATE - ENVIRONMENT CONFIGURATION
// =============================================================================
// 
// This file contains only client-side environment variables
// For server-side variables, import from ./env-server.js
//
// IMPORTANT: Replace all {{PLACEHOLDER}} values with your actual values
// =============================================================================

export const env = createEnv({
  /**
   * Empty server object - server vars are in env-server.js
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // =============================================================================
    // APP IDENTITY & METADATA
    // =============================================================================
    NEXT_PUBLIC_APP_NAME: z
      .string()
      .default("{{APP_NAME}}"),
    NEXT_PUBLIC_APP_DESCRIPTION: z
      .string()
      .default("{{APP_DESCRIPTION}}"),
    NEXT_PUBLIC_APP_VERSION: z
      .string()
      .default("1.0.0"),
    NEXT_PUBLIC_WEBSITE_URL: z
      .string()
      .default("{{WEBSITE_URL}}"),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .default("{{APP_URL}}"),

    // =============================================================================
    // FIREBASE CONFIGURATION
    // =============================================================================
    // Get these values from your Firebase project console
    NEXT_PUBLIC_FIREBASE_API_KEY: z
      .string()
      .default("{{FIREBASE_API_KEY}}"),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
      .string()
      .default("{{FIREBASE_AUTH_DOMAIN}}"),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
      .string()
      .default("{{FIREBASE_PROJECT_ID}}"),
    NEXT_PUBLIC_FIREBASE_APP_ID: z
      .string()
      .default("{{FIREBASE_APP_ID}}"),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
      .string()
      .default("{{FIREBASE_MESSAGING_SENDER_ID}}"),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
      .string()
      .default("{{FIREBASE_STORAGE_BUCKET}}"),

    // =============================================================================
    // AUTHENTICATION & SECURITY
    // =============================================================================
    NEXT_PUBLIC_AUTH_ENABLED: z
      .boolean()
      .default(true),
    NEXT_PUBLIC_AUTH_PROVIDERS: z
      .string()
      .default("google,email"), // Comma-separated list

    // =============================================================================
    // PAYMENT INTEGRATION (OPTIONAL)
    // =============================================================================
    // Stripe (recommended for most apps)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .optional()
      .default("{{STRIPE_PUBLISHABLE_KEY}}"),

    // PayNow (alternative payment provider)
    NEXT_PUBLIC_PAYNOW_STORE_ID: z
      .string()
      .optional()
      .default("{{PAYNOW_STORE_ID}}"),

    // =============================================================================
    // AI & EXTERNAL SERVICES (OPTIONAL)
    // =============================================================================
    NEXT_PUBLIC_AI_ENABLED: z
      .boolean()
      .default(false),
    NEXT_PUBLIC_AI_PROVIDER: z
      .enum(["openai", "google", "anthropic", "custom"])
      .optional()
      .default("{{AI_PROVIDER}}"),

    // =============================================================================
    // MONITORING & ANALYTICS
    // =============================================================================
    NEXT_PUBLIC_ANALYTICS_ENABLED: z
      .boolean()
      .default(true),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z
      .string()
      .optional()
      .default("{{GA_MEASUREMENT_ID}}"),

    // =============================================================================
    // FEATURE FLAGS
    // =============================================================================
    NEXT_PUBLIC_FEATURE_PAYMENTS: z
      .boolean()
      .default(false),
    NEXT_PUBLIC_FEATURE_AI: z
      .boolean()
      .default(false),
    NEXT_PUBLIC_FEATURE_MULTI_LANG: z
      .boolean()
      .default(false),
    NEXT_PUBLIC_FEATURE_PWA: z
      .boolean()
      .default(true),

    // =============================================================================
    // CUSTOMIZATION POINTS
    // =============================================================================
    // Add your custom client-side environment variables below
    // NEXT_PUBLIC_CUSTOM_API_KEY: z.string().optional(),
    // NEXT_PUBLIC_CUSTOM_SERVICE_URL: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // =============================================================================
    // APP IDENTITY & METADATA
    // =============================================================================
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME ||
      "{{APP_NAME}}",
    NEXT_PUBLIC_APP_DESCRIPTION:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
      "{{APP_DESCRIPTION}}",
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ||
      "1.0.0",
    NEXT_PUBLIC_WEBSITE_URL:
      process.env.NEXT_PUBLIC_WEBSITE_URL ||
      "{{WEBSITE_URL}}",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      "{{APP_URL}}",

    // =============================================================================
    // FIREBASE CONFIGURATION
    // =============================================================================
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "{{FIREBASE_API_KEY}}",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      "{{FIREBASE_AUTH_DOMAIN}}",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "{{FIREBASE_PROJECT_ID}}",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      "{{FIREBASE_APP_ID}}",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      "{{FIREBASE_MESSAGING_SENDER_ID}}",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "{{FIREBASE_STORAGE_BUCKET}}",

    // =============================================================================
    // AUTHENTICATION & SECURITY
    // =============================================================================
    NEXT_PUBLIC_AUTH_ENABLED:
      process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ||
      true,
    NEXT_PUBLIC_AUTH_PROVIDERS:
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS ||
      "google,email",

    // =============================================================================
    // PAYMENT INTEGRATION (OPTIONAL)
    // =============================================================================
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "{{STRIPE_PUBLISHABLE_KEY}}",
    NEXT_PUBLIC_PAYNOW_STORE_ID:
      process.env.NEXT_PUBLIC_PAYNOW_STORE_ID ||
      "{{PAYNOW_STORE_ID}}",

    // =============================================================================
    // AI & EXTERNAL SERVICES (OPTIONAL)
    // =============================================================================
    NEXT_PUBLIC_AI_ENABLED:
      process.env.NEXT_PUBLIC_AI_ENABLED === "true" ||
      false,
    NEXT_PUBLIC_AI_PROVIDER:
      process.env.NEXT_PUBLIC_AI_PROVIDER ||
      "{{AI_PROVIDER}}",

    // =============================================================================
    // MONITORING & ANALYTICS
    // =============================================================================
    NEXT_PUBLIC_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true" ||
      true,
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      "{{GA_MEASUREMENT_ID}}",

    // =============================================================================
    // FEATURE FLAGS
    // =============================================================================
    NEXT_PUBLIC_FEATURE_PAYMENTS:
      process.env.NEXT_PUBLIC_FEATURE_PAYMENTS === "true" ||
      false,
    NEXT_PUBLIC_FEATURE_AI:
      process.env.NEXT_PUBLIC_FEATURE_AI === "true" ||
      false,
    NEXT_PUBLIC_FEATURE_MULTI_LANG:
      process.env.NEXT_PUBLIC_FEATURE_MULTI_LANG === "true" ||
      false,
    NEXT_PUBLIC_FEATURE_PWA:
      process.env.NEXT_PUBLIC_FEATURE_PWA === "true" ||
      true,

    // =============================================================================
    // CUSTOMIZATION POINTS
    // =============================================================================
    // Add your custom runtime environment variables below
    // NEXT_PUBLIC_CUSTOM_API_KEY: process.env.NEXT_PUBLIC_CUSTOM_API_KEY,
    // NEXT_PUBLIC_CUSTOM_SERVICE_URL: process.env.NEXT_PUBLIC_CUSTOM_SERVICE_URL,
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

// =============================================================================
// TEMPLATE NOTES
// =============================================================================
// 
// 1. Replace all {{PLACEHOLDER}} values with your actual values
// 2. Add custom environment variables as needed
// 3. Configure feature flags for your app
// 4. Set up payment integration variables
// 5. Configure AI service providers
// 6. Set up analytics and monitoring
//
// For production deployment:
// - Use Secret Manager for sensitive values
// - Set appropriate defaults for development
// - Validate all required variables
// - Use feature flags for gradual rollouts
//
// =============================================================================
