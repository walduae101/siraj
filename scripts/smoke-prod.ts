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
}

interface SmokeTestConfig {
  baseUrl: string;
  timeout: number;
  paths: string[];
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
      
      if (response.ok) {
        console.log(`✅ ${path} - ${response.status} (${latency}ms)`);
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
      const eventType = result.success ? 'ops.smoke_passed' : 'ops.smoke_failed';
      
      await track(eventType, {
        path: result.path,
        status: result.status,
        latency: result.latency,
        error: result.error,
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
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgLatency = successful.reduce((sum, r) => sum + r.latency, 0) / successful.length;
    console.log(`⚡ Average latency: ${Math.round(avgLatency)}ms`);
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
    
    if (hasFailures) {
      console.log('\n🚨 Smoke tests failed! Exiting with code 1.');
      process.exit(1);
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
