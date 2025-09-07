import { getDb } from '../src/server/firebase/admin-lazy';
import { createOrg, inviteMember } from '../src/server/orgs/service';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedDemoOrg() {
  console.log('🌱 Seeding demo organization...');
  
  const db = await getDb();
  
  // Demo organization owner
  const ownerUid = 'demo_org_owner_123';
  const ownerEmail = 'owner@siraj.com';
  
  // Create owner user
  const ownerUser = {
    uid: ownerUid,
    email: ownerEmail,
    displayName: 'Organization Owner',
    name: 'Organization Owner',
    photoURL: 'https://via.placeholder.com/150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.collection('users').doc(ownerUid).set(ownerUser);
  console.log('✅ Organization owner created:', ownerEmail);
  
  // Create organization
  const org = await createOrg({
    name: 'Demo Organization',
    ownerUid,
    seats: 5,
  });
  
  console.log('✅ Demo organization created:', org.name);
  console.log('🏢 Org ID:', org.id);
  
  // Create org entitlement
  const orgEntitlement = {
    plan: 'org',
    status: 'active',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    features: ['ai.generate', 'export.csv', 'export.pdf', 'api.calls', 'org.management'],
  };
  
  await db.collection('entitlements').doc(ownerUid).set(orgEntitlement);
  console.log('✅ Organization entitlement created');
  
  // Create additional team members
  const teamMembers = [
    {
      uid: 'demo_member_1',
      email: 'member1@siraj.com',
      name: 'Team Member 1',
    },
    {
      uid: 'demo_member_2',
      email: 'member2@siraj.com',
      name: 'Team Member 2',
    },
  ];
  
  for (const member of teamMembers) {
    // Create user
    const userData = {
      uid: member.uid,
      email: member.email,
      displayName: member.name,
      name: member.name,
      photoURL: 'https://via.placeholder.com/150',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('users').doc(member.uid).set(userData);
    
    // Add as org member
    await db.collection('orgs').doc(org.id).collection('members').doc(member.uid).set({
      uid: member.uid,
      role: 'MEMBER',
      invitedAt: new Date(),
      joinedAt: new Date(),
      invitedBy: ownerUid,
    });
    
    console.log('✅ Team member added:', member.email);
  }
  
  // Create pending invite
  const invite = await inviteMember({
    orgId: org.id,
    email: 'pending@siraj.com',
    role: 'ADMIN',
    invitedBy: ownerUid,
  });
  
  console.log('✅ Pending invite created for: pending@siraj.com');
  console.log('🔗 Invite link: /i/' + invite.token);
  
  // Create sample org usage data
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orgUsageData = {
    features: {
      'ai.generate': 156,
      'export.csv': 28,
      'export.pdf': 8,
      'api.calls': 1234,
    },
    lastUpdated: new Date(),
  };
  
  await db.collection('usage').doc(today).collection('orgs').doc(org.id).set(orgUsageData);
  console.log('✅ Sample organization usage data created');
  
  // Create sample payments for org
  const orgPayment = {
    id: 'pay_org_demo_1',
    uid: ownerUid,
    orgId: org.id,
    amount: 99.99,
    currency: 'USD',
    status: 'completed',
    description: 'Organization Plan - Monthly',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    receiptUrl: '/receipts/pay_org_demo_1.pdf',
  };
  
  await db.collection('payments').doc(orgPayment.id).set(orgPayment);
  console.log('✅ Organization payment created');
  
  console.log('🎉 Demo organization seeding completed!');
  console.log('🏢 Organization:', org.name);
  console.log('👑 Owner:', ownerEmail);
  console.log('👥 Members:', teamMembers.length + 1);
  console.log('📧 Pending invite:', 'pending@siraj.com');
  console.log('🔗 Invite token:', invite.token);
}

// Run the seed function
(async () => {
  try {
    await seedDemoOrg();
    console.log('✅ Demo organization seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo organization seed failed:', error);
    process.exit(1);
  }
})();

export { seedDemoOrg };
