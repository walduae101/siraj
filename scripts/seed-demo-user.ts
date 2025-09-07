import { getDb } from '../src/server/firebase/admin-lazy';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedDemoUser() {
  console.log('🌱 Seeding demo user...');
  
  const db = await getDb();
  
  // Demo user data
  const demoUser = {
    uid: 'demo_user_123',
    email: 'demo@siraj.com',
    displayName: 'Demo User',
    name: 'Demo User',
    photoURL: 'https://via.placeholder.com/150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Create user document
  await db.collection('users').doc(demoUser.uid).set(demoUser);
  console.log('✅ Demo user created:', demoUser.email);
  
  // Create pro entitlement
  const entitlement = {
    plan: 'pro',
    status: 'active',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    features: ['ai.generate', 'export.csv', 'export.pdf', 'api.calls'],
  };
  
  await db.collection('entitlements').doc(demoUser.uid).set(entitlement);
  console.log('✅ Pro entitlement created for demo user');
  
  // Create sample payments/receipts
  const payments = [
    {
      id: 'pay_demo_1',
      uid: demoUser.uid,
      amount: 29.99,
      currency: 'USD',
      status: 'completed',
      description: 'Pro Plan - Monthly',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      receiptUrl: '/receipts/pay_demo_1.pdf',
    },
    {
      id: 'pay_demo_2',
      uid: demoUser.uid,
      amount: 9.99,
      currency: 'USD',
      status: 'completed',
      description: 'Points Top-up - 1000 points',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      receiptUrl: '/receipts/pay_demo_2.pdf',
    },
  ];
  
  for (const payment of payments) {
    await db.collection('payments').doc(payment.id).set(payment);
  }
  console.log('✅ Sample payments created');
  
  // Create sample usage data
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const usageData = {
    features: {
      'ai.generate': 45,
      'export.csv': 12,
      'export.pdf': 3,
      'api.calls': 234,
    },
    lastUpdated: new Date(),
  };
  
  await db.collection('usage').doc(today).collection('users').doc(demoUser.uid).set(usageData);
  console.log('✅ Sample usage data created');
  
  console.log('🎉 Demo user seeding completed!');
  console.log('📧 Email:', demoUser.email);
  console.log('🔑 UID:', demoUser.uid);
  console.log('💳 Plan: Pro (active)');
}

// Run the seed function
(async () => {
  try {
    await seedDemoUser();
    console.log('✅ Demo user seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo user seed failed:', error);
    process.exit(1);
  }
})();

export { seedDemoUser };