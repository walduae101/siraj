import { getDb } from '../src/server/firebase/admin-lazy';
import { apiKeyService } from '../src/lib/apiKeys';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedDemoApiKey() {
  console.log('🔑 Seeding demo API key...');
  
  try {
    const demoUid = 'demo_user_123';
    
    // Create a demo API key
    const result = await apiKeyService.generateKey(demoUid, {
      name: 'Demo API Key',
      permissions: ['read', 'write'],
    });

    console.log('✅ Demo API key created successfully!');
    console.log(`📋 Key ID: ${result.id}`);
    console.log(`🔑 Full Key: ${result.key}`);
    console.log(`📝 Name: ${result.name}`);
    console.log(`📅 Created: ${result.createdAt.toISOString()}`);
    
    // Test the key by verifying it
    console.log('\n🧪 Testing API key verification...');
    const verification = await apiKeyService.verifyKey(result.key);
    
    if (verification) {
      console.log('✅ API key verification successful');
      console.log(`👤 User ID: ${verification.uid}`);
      console.log(`🔑 Key ID: ${verification.key.keyId}`);
      console.log(`📊 Status: ${verification.key.status}`);
    } else {
      console.log('❌ API key verification failed');
    }

    // List all keys for the demo user
    console.log('\n📋 Listing all API keys for demo user...');
    const keys = await apiKeyService.listKeys(demoUid);
    console.log(`Found ${keys.length} API key(s):`);
    
    keys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key.name} (${key.status})`);
      console.log(`     Key: ${apiKeyService.maskKey(key.keyId)}`);
      console.log(`     Created: ${key.createdAt.toISOString()}`);
      if (key.lastUsedAt) {
        console.log(`     Last Used: ${key.lastUsedAt.toISOString()}`);
      }
    });

    console.log('\n🎉 Demo API key seeding completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('1. Test the API key:');
    console.log(`   curl -H "x-api-key: ${result.key}" http://localhost:3000/api/ping`);
    console.log('2. Visit the developer portal: http://localhost:3000/account/api');
    console.log('3. View API documentation: http://localhost:3000/docs/api');

  } catch (error) {
    console.error('❌ Error seeding demo API key:', error);
    process.exit(1);
  }
}

// Run the seed function
(async () => {
  try {
    await seedDemoApiKey();
    process.exit(0);
  } catch (error) {
    console.error('💥 Demo API key seeding failed:', error);
    process.exit(1);
  }
})();
