#!/usr/bin/env tsx

/**
 * Fix production configuration by adding missing rateLimit section
 * This script can be used to update the configuration in Secret Manager or generate a fixed config file
 */

import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Define the rateLimit schema
const RateLimitConfigSchema = z.object({
  authenticated: z.object({
    maxTokens: z.number().default(30),
    refillRate: z.number().default(0.5),
    windowMinutes: z.number().default(1),
  }),
  anonymous: z.object({
    maxTokens: z.number().default(10),
    refillRate: z.number().default(0.17),
    windowMinutes: z.number().default(1),
  }),
  admin: z.object({
    maxTokens: z.number().default(100),
    refillRate: z.number().default(1.67),
    windowMinutes: z.number().default(1),
  }),
  perRoute: z.object({
    webhook: z.object({
      maxTokens: z.number().default(300),
      refillRate: z.number().default(5),
      windowMinutes: z.number().default(1),
    }),
    paywall: z.object({
      maxTokens: z.number().default(60),
      refillRate: z.number().default(1),
      windowMinutes: z.number().default(1),
    }),
    promo: z.object({
      maxTokens: z.number().default(5),
      refillRate: z.number().default(0.08),
      windowMinutes: z.number().default(1),
    }),
    admin: z.object({
      maxTokens: z.number().default(50),
      refillRate: z.number().default(0.83),
      windowMinutes: z.number().default(1),
    }),
  }),
});

// Default rateLimit configuration
const defaultRateLimit = {
  authenticated: {
    maxTokens: 30,
    refillRate: 0.5,
    windowMinutes: 1,
  },
  anonymous: {
    maxTokens: 10,
    refillRate: 0.17,
    windowMinutes: 1,
  },
  admin: {
    maxTokens: 100,
    refillRate: 1.67,
    windowMinutes: 1,
  },
  perRoute: {
    webhook: {
      maxTokens: 300,
      refillRate: 5,
      windowMinutes: 1,
    },
    paywall: {
      maxTokens: 60,
      refillRate: 1,
      windowMinutes: 1,
    },
    promo: {
      maxTokens: 5,
      refillRate: 0.08,
      windowMinutes: 1,
    },
    admin: {
      maxTokens: 50,
      refillRate: 0.83,
      windowMinutes: 1,
    },
  },
};

async function main() {
  console.log("🔧 Production Configuration Fixer");
  console.log("=================================\n");

  // Check if a config file is provided as argument
  const configPath = process.argv[2];
  
  if (configPath) {
    console.log(`📄 Reading configuration from: ${configPath}`);
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      console.log("✅ Successfully parsed configuration");
      
      // Check if rateLimit is missing
      if (!config.rateLimit) {
        console.log("⚠️  Missing rateLimit section - adding default configuration");
        config.rateLimit = defaultRateLimit;
        
        // Also ensure feature flags are set
        config.rateLimitEnabled = config.rateLimitEnabled ?? true;
        config.riskHoldsEnabled = config.riskHoldsEnabled ?? true;
        
        // Write the fixed configuration
        const outputPath = configPath.replace('.json', '.fixed.json');
        fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
        
        console.log(`✅ Fixed configuration written to: ${outputPath}`);
        console.log("\n📋 Next steps:");
        console.log("1. Review the fixed configuration");
        console.log("2. Update your Secret Manager or config file with the fixed version");
        console.log("3. Restart/redeploy your application");
      } else {
        console.log("✅ Configuration already has rateLimit section");
        
        // Validate the rateLimit section
        try {
          RateLimitConfigSchema.parse(config.rateLimit);
          console.log("✅ rateLimit configuration is valid");
        } catch (error) {
          console.error("❌ Invalid rateLimit configuration:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error processing configuration:", error);
    }
  } else {
    console.log("📝 Generating default rateLimit configuration...\n");
    console.log("Add this to your production configuration:\n");
    console.log(JSON.stringify({ rateLimit: defaultRateLimit }, null, 2));
    
    console.log("\n📋 You should also ensure these feature flags are set:");
    console.log(JSON.stringify({
      rateLimitEnabled: true,
      riskHoldsEnabled: true,
    }, null, 2));
    
    console.log("\n💡 Usage: tsx scripts/fix-production-config.ts <path-to-config.json>");
  }
}

main().catch(console.error);
