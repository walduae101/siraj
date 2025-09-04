import { getDb } from '../src/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedOnboarding() {
  console.log('🌱 Seeding onboarding data...');
  
  try {
    const db = await getDb();
    const uid = process.env.DEMO_UID || 'demo_user_123';
    
    // Create onboarding document for demo user
    const onboardingRef = db.collection('users').doc(uid).collection('meta').doc('onboarding');
    const now = Timestamp.now();
    
    const onboardingData = {
      items: {
        create_api_key: { done: true, ts: now },
        call_ping: { done: false },
        upgrade_plan: { done: false },
        invite_member: { done: false },
        enable_2fa: { done: false },
      },
      startedAt: now,
      locale: 'en',
    };

    await onboardingRef.set(onboardingData);
    
    console.log('✅ Onboarding data seeded successfully!');
    console.log(`👤 User ID: ${uid}`);
    console.log('📋 Checklist items:');
    console.log('  - create_api_key: ✅ Done');
    console.log('  - call_ping: ⏳ Pending');
    console.log('  - upgrade_plan: ⏳ Pending');
    console.log('  - invite_member: ⏳ Pending');
    console.log('  - enable_2fa: ⏳ Pending');
    console.log('🌐 Locale: en');
    
    // Verify the data was created
    const doc = await onboardingRef.get();
    if (doc.exists) {
      const data = doc.data()!;
      console.log('\n📊 Verification:');
      console.log(`  - Started at: ${data.startedAt?.toDate().toISOString()}`);
      console.log(`  - Locale: ${data.locale}`);
      console.log(`  - Items count: ${Object.keys(data.items || {}).length}`);
    }

    console.log('\n🎉 Onboarding seeding completed successfully!');
    console.log('📖 Next steps:');
    console.log('1. Visit the onboarding page: http://localhost:3000/account/onboarding');
    console.log('2. Test marking items as done via API:');
    console.log('   curl -X POST http://localhost:3000/api/onboarding/mark?item=call_ping');
    console.log('3. Check console for CRM and analytics events');

  } catch (error) {
    console.error('❌ Error seeding onboarding data:', error);
    process.exit(1);
  }
}

// Run the seed function
(async () => {
  try {
    await seedOnboarding();
    process.exit(0);
  } catch (error) {
    console.error('💥 Onboarding seeding failed:', error);
    process.exit(1);
  }
})();
