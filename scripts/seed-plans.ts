#!/usr/bin/env tsx

import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "../src/server/firebase/admin-lazy";

// Initialize Firebase Admin
import "../src/server/bootstrap";

const db = await getDb();

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'monthly' as const,
    features: [
      '20 AI generations per day',
      '5 CSV exports per day',
      '100 API calls per day',
      'Basic support'
    ],
    sku: 'FREE_PLAN',
    isActive: true,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'For power users and small teams',
    price: 29.99,
    interval: 'monthly' as const,
    features: [
      '500 AI generations per day',
      '50 CSV exports per day',
      '5,000 API calls per day',
      'Priority support',
      'Advanced analytics',
      'Custom templates'
    ],
    sku: 'PRO_MONTHLY',
    isActive: true,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    description: 'Best value for power users',
    price: 299.99,
    interval: 'yearly' as const,
    features: [
      '500 AI generations per day',
      '50 CSV exports per day',
      '5,000 API calls per day',
      'Priority support',
      'Advanced analytics',
      'Custom templates',
      '2 months free'
    ],
    sku: 'PRO_YEARLY',
    isActive: true,
  },
  {
    id: 'org_monthly',
    name: 'Organization Monthly',
    description: 'For teams and businesses',
    price: 99.99,
    interval: 'monthly' as const,
    features: [
      '2,000 AI generations per day',
      '200 CSV exports per day',
      '25,000 API calls per day',
      'Team collaboration',
      'Admin dashboard',
      'SSO integration',
      'Dedicated support'
    ],
    sku: 'ORG_MONTHLY',
    isActive: true,
  },
];

async function seedPlans() {
  console.log('🌱 Seeding plans...');
  
  try {
    for (const plan of plans) {
      const now = Timestamp.now();
      const planData = {
        ...plan,
        createdAt: now,
        updatedAt: now,
      };

      // Use the plan ID as the document ID for consistency
      await db.collection('plans').doc(plan.id).set(planData);
      console.log(`✅ Created plan: ${plan.name} (${plan.id})`);
    }
    
    console.log('🎉 All plans seeded successfully!');
    
    // Verify the plans were created
    const snapshot = await db.collection('plans').get();
    console.log(`📊 Total plans in database: ${snapshot.size}`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name}: $${data.price}/${data.interval} (SKU: ${data.sku})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
}

// Run the seed function
(async () => {
  try {
    await seedPlans();
    console.log('🏁 Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
})();
