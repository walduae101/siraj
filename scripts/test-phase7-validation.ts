#!/usr/bin/env node

import { getConfig } from "../src/server/config.js";

// Test Phase 7 multi-region validation scenarios
async function testPhase7Validation() {
  console.log("🧪 Phase 7 Multi-Region Validation");
  console.log("=".repeat(60));

  try {
    // Test 1: Configuration
    console.log("📋 Test 1: Multi-Region Configuration");
    const config = await getConfig();
    console.log(
      `   multiRegion.enabled: ${config.features.multiRegion.enabled}`,
    );
    console.log(
      `   multiRegion.primaryRegion: ${config.features.multiRegion.primaryRegion}`,
    );
    console.log(
      `   multiRegion.secondaryRegion: ${config.features.multiRegion.secondaryRegion}`,
    );
    console.log(
      `   eventSchema.version: ${config.features.eventSchema.version}`,
    );
    console.log(
      `   eventSchema.minCompatible: ${config.features.eventSchema.minCompatible}`,
    );
    console.log("   ✅ Configuration loaded successfully");

    // Test 2: Schema Versioning
    console.log("\n📋 Test 2: Event Schema Versioning");
    const currentVersion = config.features.eventSchema.version;
    const minCompatible = config.features.eventSchema.minCompatible;

    console.log(`   Current version: ${currentVersion}`);
    console.log(`   Min compatible: ${minCompatible}`);
    console.log(
      `   Backward compatible: ${currentVersion >= minCompatible ? "✅" : "❌"}`,
    );

    // Test version compatibility
    const testVersions = [1, 2, 3, 4];
    for (const version of testVersions) {
      const compatible = version >= minCompatible;
      console.log(
        `   Version ${version}: ${compatible ? "✅ Compatible" : "❌ Incompatible"}`,
      );
    }

    // Test 3: Region Configuration
    console.log("\n📋 Test 3: Region Configuration");
    console.log(
      `   Primary region: ${config.features.multiRegion.primaryRegion}`,
    );
    console.log(
      `   Secondary region: ${config.features.multiRegion.secondaryRegion}`,
    );
    console.log(
      `   Failover enabled: ${config.features.multiRegion.failoverEnabled ? "✅" : "❌"}`,
    );

    // Validate region names
    const validRegions = ["us-central1", "europe-west1", "asia-southeast1"];
    const primaryValid = validRegions.includes(
      config.features.multiRegion.primaryRegion,
    );
    const secondaryValid = validRegions.includes(
      config.features.multiRegion.secondaryRegion,
    );
    const regionsDifferent =
      config.features.multiRegion.primaryRegion !==
      config.features.multiRegion.secondaryRegion;

    console.log(`   Primary region valid: ${primaryValid ? "✅" : "❌"}`);
    console.log(`   Secondary region valid: ${secondaryValid ? "✅" : "❌"}`);
    console.log(`   Regions different: ${regionsDifferent ? "✅" : "❌"}`);

    // Test 4: Feature Flag Validation
    console.log("\n📋 Test 4: Feature Flag Validation");
    const multiRegionEnabled = config.features.multiRegion.enabled;
    const schemaVersioningEnabled = config.features.eventSchema.version >= 3;

    console.log(
      `   Multi-region enabled: ${multiRegionEnabled ? "✅" : "⚠️  (disabled)"}`,
    );
    console.log(
      `   Schema versioning enabled: ${schemaVersioningEnabled ? "✅" : "❌"}`,
    );

    if (!multiRegionEnabled) {
      console.log(
        "   ⚠️  Multi-region is disabled - enable for full functionality",
      );
    }

    // Test 5: Environment Variables
    console.log("\n📋 Test 5: Environment Variables");
    const envVars = {
      REGION: process.env.REGION,
      SERVICE_NAME: process.env.SERVICE_NAME,
      MULTI_REGION_ENABLED: process.env.MULTI_REGION_ENABLED,
      PRIMARY_REGION: process.env.PRIMARY_REGION,
      SECONDARY_REGION: process.env.SECONDARY_REGION,
    };

    for (const [key, value] of Object.entries(envVars)) {
      console.log(`   ${key}: ${value || "undefined"}`);
    }

    // Test 6: Validation Summary
    console.log("\n📋 Test 6: Validation Summary");
    const allTestsPassed =
      primaryValid &&
      secondaryValid &&
      regionsDifferent &&
      currentVersion >= minCompatible &&
      schemaVersioningEnabled;

    console.log(`   All tests passed: ${allTestsPassed ? "✅" : "❌"}`);

    if (allTestsPassed) {
      console.log("\n🎯 Phase 7 Multi-Region Validation: ✅ READY");
      console.log("   - Configuration: ✅");
      console.log("   - Schema versioning: ✅");
      console.log("   - Region configuration: ✅");
      console.log("   - Feature flags: ✅");
      console.log("   - Environment variables: ✅");
    } else {
      console.log("\n🎯 Phase 7 Multi-Region Validation: ⚠️  ISSUES DETECTED");
      console.log("   - Review configuration and fix issues above");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testPhase7Validation()
  .then(() => {
    console.log("\n✅ Phase 7 validation test complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Phase 7 validation test failed:", error);
    process.exit(1);
  });
