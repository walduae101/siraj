import { createTicket } from '../src/server/support/service';
import { sendSupportAutoReply } from '../src/emails/support';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedSupportTickets() {
  console.log('🎫 Seeding support tickets...');
  
  try {
    // Create sample support tickets
    const tickets = [
      {
        email: 'demo@siraj.com',
        subject: 'API key not working',
        description: 'I created an API key but when I try to use it with the ping endpoint, I get a 401 error. The key format looks correct: siraj_live_abc123.def456. Can you help me troubleshoot this?',
        severity: 'high' as const,
        source: 'web' as const,
      },
      {
        email: 'user@example.com',
        subject: 'Invoice PDF download issue',
        description: 'When I try to download my invoice PDF, I get a 500 error. This is urgent as I need the invoice for my accounting. The invoice ID is INV-2025-0001.',
        severity: 'urgent' as const,
        source: 'web' as const,
      },
      {
        email: 'developer@company.com',
        subject: 'Rate limiting questions',
        description: 'What are the exact rate limits for the Pro plan? I need to understand the per-minute and per-day limits for planning my application architecture.',
        severity: 'med' as const,
        source: 'web' as const,
      },
      {
        email: 'admin@startup.io',
        subject: 'Feature request: Webhook support',
        description: 'Would it be possible to add webhook support for API events? We would like to receive notifications when API keys are created or revoked, and when rate limits are exceeded.',
        severity: 'low' as const,
        source: 'web' as const,
      },
      {
        email: 'support@enterprise.com',
        subject: 'Organization billing inquiry',
        description: 'We are considering upgrading to the Organization plan. Can you provide more details about the enterprise features and custom rate limits? We have high-volume usage requirements.',
        severity: 'med' as const,
        source: 'web' as const,
      },
    ];

    const createdTickets = [];

    for (const ticketData of tickets) {
      try {
        const { ticketId } = await createTicket(ticketData);
        createdTickets.push({ ticketId, ...ticketData });

        // Send auto-reply email
        await sendSupportAutoReply({
          to: ticketData.email,
          ticketId,
          subject: ticketData.subject,
          severity: ticketData.severity,
        });

        console.log(`✅ Created ticket: ${ticketId}`);
        console.log(`   Email: ${ticketData.email}`);
        console.log(`   Subject: ${ticketData.subject}`);
        console.log(`   Severity: ${ticketData.severity}`);
        console.log(`   Auto-reply sent`);
        console.log('');

      } catch (error) {
        console.error(`❌ Failed to create ticket for ${ticketData.email}:`, error);
      }
    }

    console.log('🎉 Support ticket seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total tickets created: ${createdTickets.length}`);
    console.log(`   Urgent: ${createdTickets.filter(t => t.severity === 'urgent').length}`);
    console.log(`   High: ${createdTickets.filter(t => t.severity === 'high').length}`);
    console.log(`   Medium: ${createdTickets.filter(t => t.severity === 'med').length}`);
    console.log(`   Low: ${createdTickets.filter(t => t.severity === 'low').length}`);
    console.log('');
    console.log('📖 Next steps:');
    console.log('1. Visit the admin panel: http://localhost:3000/admin/support');
    console.log('2. Test the support form: http://localhost:3000/support/new');
    console.log('3. Check auto-reply emails in: tmp/emails/');
    console.log('4. Test API endpoint:');
    console.log('   curl -X POST http://localhost:3000/api/support/create \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email":"test@example.com","subject":"Test ticket","description":"This is a test","severity":"low"}\'');

  } catch (error) {
    console.error('❌ Error seeding support tickets:', error);
    process.exit(1);
  }
}

// Run the seed function
(async () => {
  try {
    await seedSupportTickets();
    process.exit(0);
  } catch (error) {
    console.error('💥 Support ticket seeding failed:', error);
    process.exit(1);
  }
})();
