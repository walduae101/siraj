import { getDb } from '../src/server/firebase/admin-lazy';
import { apiKeyService } from '../src/lib/apiKeys';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function smokeTestPing() {
  console.log('🧪 Running ping endpoint smoke tests...');
  
  try {
    const demoUid = 'demo_user_123';
    
    // Get the demo API key
    const keys = await apiKeyService.listKeys(demoUid);
    if (keys.length === 0) {
      console.log('❌ No API keys found. Please run seed-demo-api-key.ts first.');
      process.exit(1);
    }

    // We need to reconstruct the full key, but we can't since we only store the hash
    // For smoke testing, we'll create a new key and test it
    console.log('🔑 Creating test API key...');
    const testKey = await apiKeyService.generateKey(demoUid, {
      name: 'Smoke Test Key',
    });

    console.log(`✅ Test API key created: ${testKey.key}`);

    // Test 1: Ping without API key (should return 401)
    console.log('\n🧪 Test 1: Ping without API key (expect 401)');
    try {
      const response = await fetch('http://localhost:3000/api/ping');
      if (response.status === 401) {
        console.log('✅ Correctly returned 401 Unauthorized');
      } else {
        console.log(`❌ Expected 401, got ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Request failed:', error);
    }

    // Test 2: Ping with invalid API key (should return 401)
    console.log('\n🧪 Test 2: Ping with invalid API key (expect 401)');
    try {
      const response = await fetch('http://localhost:3000/api/ping', {
        headers: {
          'x-api-key': 'siraj_live_invalid.invalid_secret',
        },
      });
      if (response.status === 401) {
        console.log('✅ Correctly returned 401 Unauthorized');
      } else {
        console.log(`❌ Expected 401, got ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Request failed:', error);
    }

    // Test 3: Ping with valid API key (should return 200)
    console.log('\n🧪 Test 3: Ping with valid API key (expect 200)');
    try {
      const response = await fetch('http://localhost:3000/api/ping', {
        headers: {
          'x-api-key': testKey.key,
        },
      });
      
      if (response.status === 200) {
        console.log('✅ Correctly returned 200 OK');
        const data = await response.json();
        console.log('📊 Response data:', {
          ok: data.ok,
          keyId: data.keyId,
          uid: data.uid,
          plan: data.plan,
        });
      } else {
        console.log(`❌ Expected 200, got ${response.status}`);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.log('❌ Request failed:', error);
    }

    // Test 4: Rate limiting (make multiple requests quickly)
    console.log('\n🧪 Test 4: Rate limiting test');
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        fetch('http://localhost:3000/api/ping', {
          headers: {
            'x-api-key': testKey.key,
          },
        })
      );
    }

    try {
      const responses = await Promise.all(promises);
      const statusCounts = responses.reduce((acc, response) => {
        acc[response.status] = (acc[response.status] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      console.log('📊 Response status counts:', statusCounts);
      
      if (statusCounts[429]) {
        console.log('✅ Rate limiting is working (got 429 responses)');
      } else {
        console.log('⚠️  No rate limiting detected (no 429 responses)');
      }
    } catch (error) {
      console.log('❌ Rate limiting test failed:', error);
    }

    // Clean up test key
    console.log('\n🧹 Cleaning up test key...');
    await apiKeyService.revokeKey(demoUid, testKey.id);
    console.log('✅ Test key revoked');

    console.log('\n🎉 Ping endpoint smoke tests completed!');

  } catch (error) {
    console.error('❌ Error running smoke tests:', error);
    process.exit(1);
  }
}

// Run the smoke tests
(async () => {
  try {
    await smokeTestPing();
    process.exit(0);
  } catch (error) {
    console.error('💥 Smoke tests failed:', error);
    process.exit(1);
  }
})();
