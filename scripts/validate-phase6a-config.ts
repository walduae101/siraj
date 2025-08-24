#!/usr/bin/env node

import { getConfig } from "../src/server/config.js";

async function validatePhase6AConfig() {
  console.log("🔧 Phase 6A Configuration Validation");
  console.log("=".repeat(50));

  try {
    const config = await getConfig();

    console.log("📋 Configuration Check:");
    console.log(`   webhookMode: ${config.features.webhookMode}`);
    console.log(
      `   webhookQueueCanaryRatio: ${config.features.webhookQueueCanaryRatio}`,
    );

    // Validate configuration
    const isValid =
      typeof config.features.webhookMode === "string" &&
      config.features.webhookMode in { sync: true, queue: true } &&
      typeof config.features.webhookQueueCanaryRatio === "number" &&
      config.features.webhookQueueCanaryRatio >= 0 &&
      config.features.webhookQueueCanaryRatio <= 1;

    if (isValid) {
      console.log("✅ Configuration is valid");
      console.log("✅ Phase 6A ready for deployment");
    } else {
      console.log("❌ Configuration is invalid");
      console.log("❌ Please check config values");
    }

    return isValid;
  } catch (error) {
    console.error("❌ Error loading configuration:", error);
    return false;
  }
}

// Run validation
validatePhase6AConfig()
  .then((isValid) => {
    process.exit(isValid ? 0 : 1);
  })
  .catch((error) => {
    console.error("Validation failed:", error);
    process.exit(1);
  });
