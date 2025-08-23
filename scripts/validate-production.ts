#!/usr/bin/env tsx

/**
 * Validate that production is working correctly after applying fixes
 */

import * as https from 'https';

const PRODUCTION_URL = 'https://siraj.life';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${path}`;
    
    https.get(url, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, body });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testEndpoint(name: string, path: string, expectedStatus?: number[]): Promise<boolean> {
  try {
    log(`Testing ${name}...`, 'yellow');
    const { status, body } = await makeRequest(path);
    
    const validStatuses = expectedStatus || [200, 401, 403];
    
    if (status === 500) {
      log(`  ❌ ${name} returned 500 Internal Server Error`, 'red');
      if (body.includes('rateLimit')) {
        log(`     Error mentions rateLimit - configuration issue detected`, 'red');
      }
      return false;
    } else if (validStatuses.includes(status)) {
      log(`  ✅ ${name} returned ${status} (OK)`, 'green');
      return true;
    } else {
      log(`  ⚠️  ${name} returned ${status} (unexpected but not 500)`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`  ❌ ${name} failed: ${error}`, 'red');
    return false;
  }
}

async function checkWebsite(): Promise<boolean> {
  try {
    log('Checking main website...', 'yellow');
    const { status } = await makeRequest('/');
    
    if (status === 200) {
      log('  ✅ Main website is accessible', 'green');
      return true;
    } else {
      log(`  ⚠️  Main website returned ${status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`  ❌ Main website check failed: ${error}`, 'red');
    return false;
  }
}

async function main() {
  log('🔍 Siraj Production Validation', 'cyan');
  log('==============================\n', 'cyan');
  
  let allPassed = true;
  
  // Check main website
  const websiteOk = await checkWebsite();
  allPassed = allPassed && websiteOk;
  
  log('\nChecking API endpoints...', 'blue');
  
  // Test critical endpoints
  const endpoints = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Wallet API', path: '/api/trpc/points.getWallet?input=%7B%22json%22%3A%7B%22uid%22%3A%22test%22%7D%7D' },
    { name: 'Checkout API', path: '/api/trpc/checkout.create' },
    { name: 'Auth Session', path: '/api/auth/session' },
  ];
  
  for (const endpoint of endpoints) {
    const passed = await testEndpoint(endpoint.name, endpoint.path);
    allPassed = allPassed && passed;
  }
  
  log('\n' + '='.repeat(50), 'cyan');
  
  if (allPassed) {
    log('\n✅ All tests passed! Production appears to be working correctly.', 'green');
    log('\nNext steps:', 'blue');
    log('1. Try logging in on https://siraj.life', 'reset');
    log('2. Test the paywall functionality', 'reset');
    log('3. Monitor error logs for any remaining issues', 'reset');
  } else {
    log('\n❌ Some tests failed. Production may still have issues.', 'red');
    log('\nTroubleshooting steps:', 'yellow');
    log('1. Check Cloud Run logs: gcloud run services logs read siraj --limit=50', 'reset');
    log('2. Verify configuration was deployed: gcloud run services describe siraj', 'reset');
    log('3. Try the quick fix: RATE_LIMIT_ENABLED=false', 'reset');
    log('4. Review the deployment guide in docs/PHASE_5/PRODUCTION_DEPLOYMENT_GUIDE.md', 'reset');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Validation script failed: ${error}`, 'red');
  process.exit(1);
});
