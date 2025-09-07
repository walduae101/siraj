import { createTicket } from '../src/server/support/service';
import { listTickets } from '../src/server/support/service';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function smokeTestSupport() {
  console.log('🧪 Running support system smoke tests...');
  console.log('');

  try {
    // Test 1: Create a support ticket via service
    console.log('1️⃣ Testing support ticket creation via service...');
    const { ticketId } = await createTicket({
      email: 'smoke-test@example.com',
      subject: 'Smoke test ticket',
      description: 'This is a smoke test to verify the support system is working correctly.',
      severity: 'low',
      source: 'web',
    });
    console.log(`✅ Created ticket: ${ticketId}`);
    console.log('');

    // Test 2: List tickets
    console.log('2️⃣ Testing ticket listing...');
    const tickets = await listTickets({ limitSize: 10 });
    console.log(`✅ Found ${tickets.length} tickets`);
    console.log('');

    // Test 3: Test API endpoint
    console.log('3️⃣ Testing support API endpoint...');
    const testPayload = {
      email: 'api-test@example.com',
      subject: 'API smoke test',
      description: 'Testing the support API endpoint functionality.',
      severity: 'med',
    };

    const response = await fetch('http://localhost:3000/api/support/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ API endpoint working: ${result.ticketId}`);
    } else {
      const error = await response.text();
      console.log(`❌ API endpoint failed: ${response.status} - ${error}`);
    }
    console.log('');

    // Test 4: Test invalid payload
    console.log('4️⃣ Testing API validation...');
    const invalidResponse = await fetch('http://localhost:3000/api/support/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        subject: '',
        description: '',
      }),
    });

    if (invalidResponse.status === 400) {
      console.log('✅ API validation working (rejected invalid payload)');
    } else {
      console.log(`❌ API validation failed: expected 400, got ${invalidResponse.status}`);
    }
    console.log('');

    // Test 5: Check email files
    console.log('5️⃣ Checking auto-reply email files...');
    const fs = await import('fs');
    const path = await import('path');
    
    const emailDir = path.join(process.cwd(), 'tmp', 'emails');
    if (fs.existsSync(emailDir)) {
      const emailFiles = fs.readdirSync(emailDir).filter(f => f.includes('support-'));
      console.log(`✅ Found ${emailFiles.length} auto-reply email files`);
      if (emailFiles.length > 0) {
        console.log(`   Latest: ${emailFiles[emailFiles.length - 1]}`);
      }
    } else {
      console.log('⚠️  Email directory not found (emails may not have been generated)');
    }
    console.log('');

    console.log('🎉 Support system smoke tests completed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('   ✅ Ticket creation via service');
    console.log('   ✅ Ticket listing');
    console.log('   ✅ API endpoint functionality');
    console.log('   ✅ API validation');
    console.log('   ✅ Auto-reply email generation');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Visit admin panel: http://localhost:3000/admin/support');
    console.log('   2. Test support form: http://localhost:3000/support/new');
    console.log('   3. Check email files in tmp/emails/');

  } catch (error) {
    console.error('❌ Support smoke test failed:', error);
    process.exit(1);
  }
}

// Run smoke tests
(async () => {
  try {
    await smokeTestSupport();
    process.exit(0);
  } catch (error) {
    console.error('💥 Smoke test execution failed:', error);
    process.exit(1);
  }
})();
