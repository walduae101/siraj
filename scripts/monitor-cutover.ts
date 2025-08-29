#!/usr/bin/env tsx

/**
 * Cutover Monitoring Script
 *
 * Monitors DNS propagation and TLS certificate activation
 * for the siraj.life CDN cutover
 */

import { execSync } from "node:child_process";

interface MonitoringResult {
  timestamp: string;
  dnsNameservers: string[];
  dnsARecord: string[];
  certificateStatus: string;
  domainStatus: string;
}

class CutoverMonitor {
  private results: MonitoringResult[] = [];

  private async runCommand(command: string): Promise<string> {
    try {
      return execSync(command, { encoding: "utf8" }).trim();
    } catch (error) {
      return "";
    }
  }

  private async checkNameservers(): Promise<string[]> {
    console.log("🔍 Checking nameservers...");

    const output = await this.runCommand(
      "nslookup -type=NS siraj.life 8.8.8.8",
    );
    const nameservers: string[] = [];

    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("nameserver =")) {
        const ns = line.split("nameserver =")[1]?.trim();
        if (ns) nameservers.push(ns);
      }
    }

    return nameservers;
  }

  private async checkARecord(): Promise<string[]> {
    console.log("🔍 Checking A record...");

    const output = await this.runCommand("nslookup siraj.life 8.8.8.8");
    const addresses: string[] = [];

    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("Addresses:")) {
        // Get the next few lines that contain IP addresses
        const addressLines = lines.slice(lines.indexOf(line) + 1);
        for (const addrLine of addressLines) {
          const trimmed = addrLine.trim();
          if (trimmed && /^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
            addresses.push(trimmed);
          }
        }
        break;
      }
    }

    return addresses;
  }

  private async checkCertificateStatus(): Promise<{
    status: string;
    domainStatus: string;
  }> {
    console.log("🔍 Checking certificate status...");

    const status = await this.runCommand(
      'gcloud compute ssl-certificates describe siraj-web-cert --global --format="value(managed.status)"',
    );

    const domainStatusOutput = await this.runCommand(
      'gcloud compute ssl-certificates describe siraj-web-cert --global --format="value(managed.domainStatus.siraj.life)"',
    );

    return {
      status: status || "UNKNOWN",
      domainStatus: domainStatusOutput || "UNKNOWN",
    };
  }

  async runCheck(): Promise<void> {
    console.log("🚀 Starting Cutover Monitoring Check");
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    const nameservers = await this.checkNameservers();
    const aRecord = await this.checkARecord();
    const certStatus = await this.checkCertificateStatus();

    const result: MonitoringResult = {
      timestamp: new Date().toISOString(),
      dnsNameservers: nameservers,
      dnsARecord: aRecord,
      certificateStatus: certStatus.status,
      domainStatus: certStatus.domainStatus,
    };

    this.results.push(result);
    this.printResults(result);
  }

  private printResults(result: MonitoringResult): void {
    console.log("\n📊 Current Status");
    console.log("=".repeat(60));

    // Nameserver Status
    const expectedNS = [
      "ns-cloud-e1.googledomains.com.",
      "ns-cloud-e2.googledomains.com.",
      "ns-cloud-e3.googledomains.com.",
      "ns-cloud-e4.googledomains.com.",
    ];

    const nsCorrect = expectedNS.every((ns) =>
      result.dnsNameservers.includes(ns),
    );
    console.log(
      `🌐 Nameservers: ${nsCorrect ? "✅" : "❌"} ${result.dnsNameservers.join(", ")}`,
    );

    // A Record Status
    const expectedIP = "34.107.220.40";
    const aRecordCorrect = result.dnsARecord.includes(expectedIP);
    console.log(
      `📍 A Record: ${aRecordCorrect ? "✅" : "❌"} ${result.dnsARecord.join(", ")}`,
    );

    // Certificate Status
    const certActive = result.certificateStatus === "ACTIVE";
    console.log(
      `🔒 Certificate Status: ${certActive ? "✅" : "❌"} ${result.certificateStatus}`,
    );

    // Domain Status
    const domainValid = result.domainStatus === "ACTIVE";
    console.log(
      `🌍 Domain Status: ${domainValid ? "✅" : "❌"} ${result.domainStatus}`,
    );

    console.log("\n📈 Progress Assessment");
    console.log("=".repeat(60));

    if (nsCorrect && aRecordCorrect && certActive && domainValid) {
      console.log("🎉 CUTOVER COMPLETE! All systems operational.");
      console.log("✅ DNS propagated");
      console.log("✅ TLS certificate active");
      console.log("✅ Load balancer accessible");
    } else if (!nsCorrect) {
      console.log("⏳ Waiting for nameserver propagation...");
      console.log("   Expected: Google Cloud DNS nameservers");
      console.log("   Current: GoDaddy nameservers");
      console.log("   Timeline: 24-48 hours (usually much faster)");
    } else if (!aRecordCorrect) {
      console.log("⏳ Waiting for A record propagation...");
      console.log("   Expected: 34.107.220.40");
      console.log("   Current: Google's servers");
      console.log("   Timeline: Should follow nameserver change");
    } else if (!certActive) {
      console.log("⏳ Waiting for TLS certificate activation...");
      console.log("   Status: Certificate provisioning");
      console.log("   Timeline: 1-2 hours after DNS propagation");
    }

    console.log("\n🔄 Next Check");
    console.log("=".repeat(60));
    console.log("Run this script again in 15-30 minutes to monitor progress.");
    console.log("Command: npx tsx scripts/monitor-cutover.ts");
  }

  async runContinuousMonitoring(intervalMinutes = 15): Promise<void> {
    console.log(
      `🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)`,
    );
    console.log("Press Ctrl+C to stop monitoring");

    while (true) {
      await this.runCheck();

      if (this.results.length > 0) {
        const lastResult = this.results[this.results.length - 1];
        const allComplete =
          lastResult?.dnsNameservers.includes(
            "ns-cloud-e1.googledomains.com.",
          ) &&
          lastResult.dnsARecord.includes("34.107.220.40") &&
          lastResult.certificateStatus === "ACTIVE" &&
          lastResult.domainStatus === "ACTIVE";

        if (allComplete) {
          console.log("\n🎉 CUTOVER COMPLETE! Stopping monitoring.");
          break;
        }
      }

      console.log(
        `\n⏰ Waiting ${intervalMinutes} minutes before next check...`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, intervalMinutes * 60 * 1000),
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const monitor = new CutoverMonitor();

  if (args.includes("--continuous")) {
    const intervalIndex = args.indexOf("--interval");
    const interval =
      intervalIndex >= 0 && args[intervalIndex + 1]
        ? Number.parseInt(args[intervalIndex + 1] || "15")
        : 15;
    await monitor.runContinuousMonitoring(interval);
  } else {
    await monitor.runCheck();
  }
}

// Run the main function
main().catch(console.error);
