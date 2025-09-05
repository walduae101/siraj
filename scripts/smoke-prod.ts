#!/usr/bin/env tsx

/**
 * Production Smoke Test Script
 * 
 * Tests key endpoints for availability, latency, and basic functionality
 * Emits analytics events for monitoring and SLO tracking
 */

import { track } from '../src/lib/analytics';

interface SmokeTestResult {
  path: string;
  status: number;
  latency: number;
  success: boolean;
  error?: string;
  headers?: Record<string, string>;
  sloViolation?: boolean;
}

interface SmokeTestConfig {
  baseUrl: string;
  timeout: number;
  paths: string[];
  slos: Record<string, number>; // Path -> max latency in ms
}

const DEFAULT_CONFIG: SmokeTestConfig = {
  baseUrl: process.env.BASE_URL || 'https://siraj.life',
  timeout: 10000, // 10 seconds
  paths: [
    '/api/health',
    '/api/ux/ping',
    '/dashboard',
    '/account/api',
    '/support/new',
  ],
  slos: {
    '/api/health': 1200,    // 1.2s
    '/api/ux/ping': 800,    // 0.8s
    '/dashboard': 2500,     // 2.5s
    '/account/api': 2500,   // 2.5s
    '/support/new': 2500,   // 2.5s
  },
};

async function smokeTest(config: SmokeTestConfig = DEFAULT_CONFIG): Promise<SmokeTestResult[]> {
  const results: SmokeTestResult[] = [];
  
  console.log(`🧪 Starting smoke tests against: ${config.baseUrl}`);
  console.log(`📋 Testing ${config.paths.length} endpoints...\n`);

  for (const path of config.paths) {
    const url = `${config.baseUrl}${path}`;
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Testing: ${path}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Siraj-Smoke-Test/1.0',
          'Accept': 'text/html,application/json,*/*',
        },
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      const result: SmokeTestResult = {
        path,
        status: response.status,
        latency,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };
      
      results.push(result);
      
      // Check for CSP header on HTML responses
      if (response.headers.get('content-type')?.includes('text/html')) {
        const cspHeader = response.headers.get('content-security-policy');
        if (!cspHeader) {
          console.warn(`⚠️  No CSP header found on ${path}`);
        }
      }
      
      // Check SLO threshold
      const sloThreshold = config.slos[path];
      const sloViolation = sloThreshold && latency > sloThreshold;
      
      if (response.ok && !sloViolation) {
        console.log(`✅ ${path} - ${response.status} (${latency}ms)`);
      } else if (response.ok && sloViolation) {
        console.log(`⚠️  ${path} - ${response.status} (${latency}ms) - SLO VIOLATION (>${sloThreshold}ms)`);
        result.sloViolation = true;
      } else {
        console.log(`❌ ${path} - ${response.status} (${latency}ms)`);
      }
      
    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      const result: SmokeTestResult = {
        path,
        status: 0,
        latency,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      results.push(result);
      console.log(`💥 ${path} - ERROR: ${result.error} (${latency}ms)`);
    }
  }
  
  return results;
}

async function emitAnalytics(results: SmokeTestResult[]): Promise<void> {
  console.log('\n📊 Emitting analytics...');
  
  for (const result of results) {
    try {
      let eventType = 'ops.smoke_passed';
      
      if (!result.success) {
        eventType = 'ops.smoke_failed';
      } else if (result.sloViolation) {
        eventType = 'ops.smoke_failed'; // SLO violations are failures
      }
      
      await track(eventType, {
        path: result.path,
        status: result.status,
        latency: result.latency,
        error: result.error,
        sloViolation: result.sloViolation || false,
        timestamp: Date.now(),
      });
      
      console.log(`📈 ${eventType}: ${result.path}`);
    } catch (error) {
      console.error(`❌ Failed to emit analytics for ${result.path}:`, error);
    }
  }
}

function printSummary(results: SmokeTestResult[]): void {
  console.log('\n📋 Smoke Test Summary:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success && !r.sloViolation);
  const failed = results.filter(r => !r.success);
  const sloViolations = results.filter(r => r.sloViolation);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⚠️  SLO Violations: ${sloViolations.length}/${results.length}`);
  
  if (successful.length > 0) {
    const latencies = successful.map(r => r.latency).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, r) => sum + r, 0) / latencies.length;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    
    console.log(`⚡ Average latency: ${Math.round(avgLatency)}ms`);
    console.log(`📊 P95 latency: ${p95Latency}ms`);
    console.log(`🏃 Fastest: ${Math.min(...latencies)}ms`);
    console.log(`🐌 Slowest: ${Math.max(...latencies)}ms`);
  }
  
  if (sloViolations.length > 0) {
    console.log('\n⚠️  SLO Violations:');
    sloViolations.forEach(result => {
      console.log(`  - ${result.path}: ${result.latency}ms (exceeded threshold)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n💥 Failed endpoints:');
    failed.forEach(result => {
      console.log(`  - ${result.path}: ${result.status} (${result.error || 'HTTP error'})`);
    });
  }
  
  console.log('=' .repeat(50));
}

async function main(): Promise<void> {
  try {
    const results = await smokeTest();
    await emitAnalytics(results);
    printSummary(results);
    
    const hasFailures = results.some(r => !r.success);
    const hasSloViolations = results.some(r => r.sloViolation);
    
    if (hasFailures) {
      console.log('\n🚨 Smoke tests failed! Exiting with code 1.');
      process.exit(1);
    } else if (hasSloViolations) {
      console.log('\n⚠️  SLO violations detected! Exiting with code 2.');
      process.exit(2);
    } else {
      console.log('\n🎉 All smoke tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Smoke test script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
