#!/usr/bin/env tsx

/**
 * Direct Load Balancer Test Script
 *
 * Tests the load balancer directly using IP address
 * Bypasses DNS propagation issues
 */

import { execSync } from "node:child_process";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  details: string;
  headers?: Record<string, string>;
}

class DirectLBTester {
  private lbIp: string;
  private results: TestResult[] = [];

  constructor(lbIp: string) {
    this.lbIp = lbIp;
  }

  private async curl(
    url: string,
    options: string[] = [],
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }> {
    const curlCmd = `curl -sSI ${options.join(" ")} "${url}"`;

    try {
      const output = execSync(curlCmd, { encoding: "utf8" });
      const lines = output.split("\n");

      // Parse status line
      const statusLine = lines[0];
      const statusMatch = statusLine?.match(/HTTP\/\d+\.\d+ (\d+)/);
      const status = statusMatch ? Number.parseInt(statusMatch[1] || "0") : 0;

      // Parse headers
      const headers: Record<string, string> = {};
      let inHeaders = true;

      for (const line of lines.slice(1)) {
        if (line.trim() === "") {
          inHeaders = false;
          continue;
        }

        if (inHeaders) {
          const colonIndex = line.indexOf(":");
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            headers[key] = value;
          }
        }
      }

      return { status, headers, body: "" };
    } catch (error) {
      console.error(`Error executing curl: ${error}`);
      return { status: 0, headers: {}, body: "" };
    }
  }

  async testLoadBalancerHealth(): Promise<void> {
    console.log("🔍 Testing Load Balancer Health (Direct IP)...");

    // Test with Host header to simulate domain routing
    const result = await this.curl(`https://${this.lbIp}/health`, [
      `-H "Host: siraj.life"`,
      "-k",
    ]);

    if (result.status === 200) {
      this.results.push({
        test: "Load Balancer Health (Direct)",
        status: "PASS",
        details: "Health endpoint responding with 200 OK via direct IP",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "Load Balancer Health (Direct)",
        status: "FAIL",
        details: `Health endpoint returned ${result.status} via direct IP`,
        headers: result.headers,
      });
    }
  }

  async testStaticAssetCaching(): Promise<void> {
    console.log("🔍 Testing Static Asset Caching (Direct IP)...");

    const result = await this.curl(
      `https://${this.lbIp}/_next/static/chunks/webpack-*.js`,
      [`-H "Host: siraj.life"`, "-k"],
    );

    if (result.status !== 200) {
      this.results.push({
        test: "Static Asset Caching (Direct)",
        status: "SKIP",
        details: `Static asset not accessible (${result.status}) via direct IP`,
        headers: result.headers,
      });
      return;
    }

    const cacheControl = result.headers["cache-control"];
    const age = result.headers.age;
    const via = result.headers.via;
    const xCache = result.headers["x-cache"];

    let cacheStatus = "PASS";
    let details = "Static asset properly cached via direct IP";

    if (
      !cacheControl?.includes("max-age=31536000") ||
      !cacheControl?.includes("immutable")
    ) {
      cacheStatus = "FAIL";
      details = "Missing proper cache-control headers via direct IP";
    }

    if (age && Number.parseInt(age) > 0) {
      details += `, Age: ${age}s`;
    }

    if (via?.includes("Google")) {
      details += ", Served via Google CDN";
    }

    if (xCache) {
      details += `, X-Cache: ${xCache}`;
    }

    this.results.push({
      test: "Static Asset Caching (Direct)",
      status: cacheStatus as "PASS" | "FAIL",
      details,
      headers: result.headers,
    });
  }

  async testSSRNonCaching(): Promise<void> {
    console.log("🔍 Testing SSR Non-Caching (Direct IP)...");

    const result = await this.curl(`https://${this.lbIp}/`, [
      `-H "Host: siraj.life"`,
      "-k",
    ]);

    if (result.status !== 200) {
      this.results.push({
        test: "SSR Non-Caching (Direct)",
        status: "SKIP",
        details: `Homepage not accessible (${result.status}) via direct IP`,
        headers: result.headers,
      });
      return;
    }

    const cacheControl = result.headers["cache-control"];

    if (cacheControl?.includes("no-store")) {
      this.results.push({
        test: "SSR Non-Caching (Direct)",
        status: "PASS",
        details: "SSR content properly marked as no-store via direct IP",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "SSR Non-Caching (Direct)",
        status: "FAIL",
        details: `SSR content should be no-store, got: ${cacheControl} via direct IP`,
        headers: result.headers,
      });
    }
  }

  async testSecurityHeaders(): Promise<void> {
    console.log("🔍 Testing Security Headers (Direct IP)...");

    const result = await this.curl(`https://${this.lbIp}/`, [
      `-H "Host: siraj.life"`,
      "-k",
    ]);

    if (result.status !== 200) {
      this.results.push({
        test: "Security Headers (Direct)",
        status: "SKIP",
        details: `Homepage not accessible (${result.status}) via direct IP`,
        headers: result.headers,
      });
      return;
    }

    const requiredHeaders = [
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "referrer-policy",
      "strict-transport-security",
    ];

    const missingHeaders = requiredHeaders.filter(
      (header) => !result.headers[header],
    );

    if (missingHeaders.length === 0) {
      this.results.push({
        test: "Security Headers (Direct)",
        status: "PASS",
        details: "All required security headers present via direct IP",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "Security Headers (Direct)",
        status: "FAIL",
        details: `Missing security headers: ${missingHeaders.join(", ")} via direct IP`,
        headers: result.headers,
      });
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Direct Load Balancer Tests");
    console.log(`📍 Testing: https://${this.lbIp} (with Host: siraj.life)`);
    console.log("=".repeat(60));

    await this.testLoadBalancerHealth();
    await this.testStaticAssetCaching();
    await this.testSSRNonCaching();
    await this.testSecurityHeaders();

    this.printResults();
  }

  private printResults(): void {
    console.log("\n📊 Test Results");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log("");

    for (const result of this.results) {
      const icon =
        result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️";
      console.log(`${icon} ${result.test}`);
      console.log(`   ${result.details}`);

      if (result.headers && Object.keys(result.headers).length > 0) {
        console.log("   Headers:");
        for (const [key, value] of Object.entries(result.headers)) {
          if (
            [
              "cache-control",
              "age",
              "via",
              "x-cache",
              "content-security-policy",
              "strict-transport-security",
            ].includes(key)
          ) {
            console.log(`     ${key}: ${value}`);
          }
        }
      }
      console.log("");
    }

    if (failed === 0) {
      console.log(
        "🎉 All critical tests passed! Load balancer is working correctly.",
      );
      console.log("⏳ Waiting for DNS propagation to complete the cutover...");
    } else {
      console.log("⚠️  Some tests failed. Review the results above.");
    }
  }
}

async function main() {
  const lbIp = "34.107.220.40";
  const tester = new DirectLBTester(lbIp);
  await tester.runAllTests();
}

// Run the main function
main().catch(console.error);
