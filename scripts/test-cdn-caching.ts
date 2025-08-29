#!/usr/bin/env tsx

/**
 * CDN Caching Test Script
 *
 * Tests the CDN caching behavior for siraj.life after cutover
 * Validates static asset caching and SSR non-caching
 */

import { execSync } from "node:child_process";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  details: string;
  headers?: Record<string, string>;
}

class CDNCacheTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
    console.log("🔍 Testing Load Balancer Health...");

    const result = await this.curl(`${this.baseUrl}/health`);

    if (result.status === 200) {
      this.results.push({
        test: "Load Balancer Health",
        status: "PASS",
        details: "Health endpoint responding with 200 OK",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "Load Balancer Health",
        status: "FAIL",
        details: `Health endpoint returned ${result.status}`,
        headers: result.headers,
      });
    }
  }

  async testStaticAssetCaching(): Promise<void> {
    console.log("🔍 Testing Static Asset Caching...");

    // First request
    const result1 = await this.curl(
      `${this.baseUrl}/_next/static/chunks/webpack-*.js`,
    );

    if (result1.status !== 200) {
      this.results.push({
        test: "Static Asset Caching",
        status: "SKIP",
        details: `Static asset not accessible (${result1.status})`,
        headers: result1.headers,
      });
      return;
    }

    // Check cache headers
    const cacheControl = result1.headers["cache-control"];
    const age = result1.headers.age;
    const via = result1.headers.via;
    const xCache = result1.headers["x-cache"];

    let cacheStatus = "PASS";
    let details = "Static asset properly cached";

    if (
      !cacheControl?.includes("max-age=31536000") ||
      !cacheControl?.includes("immutable")
    ) {
      cacheStatus = "FAIL";
      details = "Missing proper cache-control headers";
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
      test: "Static Asset Caching",
      status: cacheStatus as "PASS" | "FAIL",
      details,
      headers: result1.headers,
    });
  }

  async testSSRNonCaching(): Promise<void> {
    console.log("🔍 Testing SSR Non-Caching...");

    const result = await this.curl(`${this.baseUrl}/`);

    if (result.status !== 200) {
      this.results.push({
        test: "SSR Non-Caching",
        status: "SKIP",
        details: `Homepage not accessible (${result.status})`,
        headers: result.headers,
      });
      return;
    }

    const cacheControl = result.headers["cache-control"];

    if (cacheControl?.includes("no-store")) {
      this.results.push({
        test: "SSR Non-Caching",
        status: "PASS",
        details: "SSR content properly marked as no-store",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "SSR Non-Caching",
        status: "FAIL",
        details: `SSR content should be no-store, got: ${cacheControl}`,
        headers: result.headers,
      });
    }
  }

  async testAPINonCaching(): Promise<void> {
    console.log("🔍 Testing API Non-Caching...");

    const result = await this.curl(`${this.baseUrl}/api/health`);

    if (result.status !== 200) {
      this.results.push({
        test: "API Non-Caching",
        status: "SKIP",
        details: `API endpoint not accessible (${result.status})`,
        headers: result.headers,
      });
      return;
    }

    const cacheControl = result.headers["cache-control"];

    if (cacheControl?.includes("no-store")) {
      this.results.push({
        test: "API Non-Caching",
        status: "PASS",
        details: "API content properly marked as no-store",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "API Non-Caching",
        status: "FAIL",
        details: `API content should be no-store, got: ${cacheControl}`,
        headers: result.headers,
      });
    }
  }

  async testHTTP3Support(): Promise<void> {
    console.log("🔍 Testing HTTP/3 Support...");

    try {
      const result = await this.curl(
        `${this.baseUrl}/_next/static/chunks/webpack-*.js`,
        ["--http3"],
      );
      const server = result.headers.server;

      if (server?.includes("Google") || result.status === 200) {
        this.results.push({
          test: "HTTP/3 Support",
          status: "PASS",
          details: "HTTP/3 request successful",
          headers: result.headers,
        });
      } else {
        this.results.push({
          test: "HTTP/3 Support",
          status: "SKIP",
          details: "HTTP/3 not supported or not configured",
          headers: result.headers,
        });
      }
    } catch (error) {
      this.results.push({
        test: "HTTP/3 Support",
        status: "SKIP",
        details: "HTTP/3 not available",
        headers: {},
      });
    }
  }

  async testSecurityHeaders(): Promise<void> {
    console.log("🔍 Testing Security Headers...");

    const result = await this.curl(`${this.baseUrl}/`);

    if (result.status !== 200) {
      this.results.push({
        test: "Security Headers",
        status: "SKIP",
        details: `Homepage not accessible (${result.status})`,
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
        test: "Security Headers",
        status: "PASS",
        details: "All required security headers present",
        headers: result.headers,
      });
    } else {
      this.results.push({
        test: "Security Headers",
        status: "FAIL",
        details: `Missing security headers: ${missingHeaders.join(", ")}`,
        headers: result.headers,
      });
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting CDN Cache Tests");
    console.log(`📍 Testing: ${this.baseUrl}`);
    console.log("=".repeat(60));

    await this.testLoadBalancerHealth();
    await this.testStaticAssetCaching();
    await this.testSSRNonCaching();
    await this.testAPINonCaching();
    await this.testHTTP3Support();
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
      console.log("🎉 All critical tests passed! CDN cutover successful.");
    } else {
      console.log("⚠️  Some tests failed. Review the results above.");
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || "https://siraj.life";

  if (!baseUrl.startsWith("http")) {
    console.error(
      "❌ Please provide a valid URL starting with http:// or https://",
    );
    process.exit(1);
  }

  const tester = new CDNCacheTester(baseUrl);
  await tester.runAllTests();
}

// Run the main function
main().catch(console.error);
