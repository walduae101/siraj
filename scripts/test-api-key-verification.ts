import { getDb } from '../src/server/firebase/admin-lazy';
import { apiKeyService } from '../src/lib/apiKeys';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function testApiKeyVerification() {
  console.log('🧪 Testing API key verification...');
  
  try {
    const demoUid = 'demo_user_123';
    
    // Get the demo API key
    const keys = await apiKeyService.listKeys(demoUid);
    if (keys.length === 0) {
      console.log('❌ No API keys found. Please run seed-demo-api-key.ts first.');
      process.exit(1);
    }

    const key = keys[0];
    console.log(`📋 Testing with key: ${key.keyPrefix}${key.keyId}...`);

    // Try to verify with a test key format
    const testKey = `${key.keyPrefix}${key.keyId}.test_secret`;
    console.log(`🔑 Testing key: ${testKey}`);

    const result = await apiKeyService.verifyKey(testKey);
    console.log('🔍 Verification result:', result);

    // Let's also check what's in the database
    const db = await getDb();
    const snapshot = await db
      .collectionGroup('devkeys')
      .where('keyId', '==', key.keyId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('📊 Database data:', {
        keyId: data.keyId,
        status: data.status,
        uid: data.uid,
        hasSecretHash: !!data.secretHash,
        hasSalt: !!data.salt,
        createdAt: data.createdAt?.toDate(),
      });
    } else {
      console.log('❌ No document found in database');
    }

  } catch (error) {
    console.error('❌ Error testing API key verification:', error);
  }
}

// Run the test
(async () => {
  try {
    await testApiKeyVerification();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
})();
