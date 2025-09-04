import { getDb } from '../src/server/firebase/admin-lazy';
import { invoiceService } from '../src/lib/billing/invoices';
import type { Invoice } from '../src/types/billing';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function seedInvoices() {
  console.log('🌱 Seeding invoices...');
  
  try {
    // Create sample invoices for demo user
    const demoUid = 'demo_user_123';
    const demoEmail = 'demo@siraj.com';
    
    // Invoice 1: Pro Monthly Subscription
    const invoice1 = await invoiceService.createInvoice({
      uid: demoUid,
      invoiceNumber: await invoiceService.generateInvoiceNumber(),
      status: 'paid',
      customer: {
        name: 'Demo User',
        email: demoEmail,
        address: {
          line1: '123 Business Street',
          line2: 'Suite 100',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'UAE',
        },
      },
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      paidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      items: [
        {
          id: 'item1',
          description: 'Pro Monthly Subscription',
          quantity: 1,
          unitPrice: 29.99,
          total: 29.99,
          category: 'subscription',
        },
      ],
      subtotal: 29.99,
      taxRate: 0.05, // 5% VAT for UAE
      taxAmount: 1.50,
      total: 31.49,
      currency: 'USD',
      paymentMethod: 'Credit Card',
      paymentReference: 'PAY_123456789',
      createdBy: 'system',
    });

    console.log('✅ Created invoice 1:', invoice1.invoiceNumber);

    // Invoice 2: Points Top-up
    const invoice2 = await invoiceService.createInvoice({
      uid: demoUid,
      invoiceNumber: await invoiceService.generateInvoiceNumber(),
      status: 'sent',
      customer: {
        name: 'Demo User',
        email: demoEmail,
        address: {
          line1: '123 Business Street',
          line2: 'Suite 100',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'UAE',
        },
      },
      issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000), // 27 days from now
      items: [
        {
          id: 'item2',
          description: 'AI Points Top-up - 1000 points',
          quantity: 1,
          unitPrice: 9.99,
          total: 9.99,
          category: 'points',
        },
      ],
      subtotal: 9.99,
      taxRate: 0.05, // 5% VAT for UAE
      taxAmount: 0.50,
      total: 10.49,
      currency: 'USD',
      createdBy: 'system',
    });

    console.log('✅ Created invoice 2:', invoice2.invoiceNumber);

    // Invoice 3: Overdue Invoice
    const invoice3 = await invoiceService.createInvoice({
      uid: demoUid,
      invoiceNumber: await invoiceService.generateInvoiceNumber(),
      status: 'overdue',
      customer: {
        name: 'Demo User',
        email: demoEmail,
        address: {
          line1: '123 Business Street',
          line2: 'Suite 100',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '12345',
          country: 'UAE',
        },
      },
      issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      items: [
        {
          id: 'item3',
          description: 'Pro Monthly Subscription',
          quantity: 1,
          unitPrice: 29.99,
          total: 29.99,
          category: 'subscription',
        },
        {
          id: 'item4',
          description: 'Late Fee',
          quantity: 1,
          unitPrice: 5.00,
          total: 5.00,
          category: 'fee',
        },
      ],
      subtotal: 34.99,
      taxRate: 0.05, // 5% VAT for UAE
      taxAmount: 1.75,
      total: 36.74,
      currency: 'USD',
      createdBy: 'system',
    });

    console.log('✅ Created invoice 3:', invoice3.invoiceNumber);

    // Create invoice for organization
    const orgOwnerUid = 'demo_org_owner_123';
    const orgOwnerEmail = 'owner@siraj.com';
    
    const orgInvoice = await invoiceService.createInvoice({
      uid: orgOwnerUid,
      orgId: '5hkD5JGEAUjfRoWfTCUS', // From seed-org.ts
      invoiceNumber: await invoiceService.generateInvoiceNumber(),
      status: 'paid',
      customer: {
        name: 'Demo Organization',
        email: orgOwnerEmail,
        address: {
          line1: '456 Corporate Avenue',
          line2: 'Floor 15',
          city: 'Abu Dhabi',
          state: 'Abu Dhabi',
          postalCode: '54321',
          country: 'UAE',
        },
      },
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: [
        {
          id: 'item5',
          description: 'Organization Monthly Plan',
          quantity: 1,
          unitPrice: 99.99,
          total: 99.99,
          category: 'subscription',
        },
        {
          id: 'item6',
          description: 'Additional Seats (2)',
          quantity: 2,
          unitPrice: 10.00,
          total: 20.00,
          category: 'addon',
        },
      ],
      subtotal: 119.99,
      taxRate: 0.05, // 5% VAT for UAE
      taxAmount: 6.00,
      total: 125.99,
      currency: 'USD',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'BANK_987654321',
      createdBy: 'system',
    });

    console.log('✅ Created organization invoice:', orgInvoice.invoiceNumber);

    // Verify invoices were created
    const allInvoices = await invoiceService.listInvoices({ limit: 10 });
    console.log(`📊 Total invoices in database: ${allInvoices.length}`);
    
    allInvoices.forEach(invoice => {
      console.log(`  - ${invoice.invoiceNumber}: ${invoice.status} - ${invoice.currency} ${invoice.total.toFixed(2)}`);
    });

    console.log('🎉 Invoice seeding completed successfully!');
    console.log('📧 Demo user invoices:', demoEmail);
    console.log('🏢 Organization invoice:', orgOwnerEmail);
    console.log('💳 Sample PDFs available at: /api/invoices/{id}');
    console.log('🔧 Admin view: /admin/invoices');

  } catch (error) {
    console.error('❌ Error seeding invoices:', error);
    process.exit(1);
  }
}

// Run the seed function
(async () => {
  try {
    await seedInvoices();
    console.log('🏁 Invoice seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('💥 Invoice seeding failed:', error);
    process.exit(1);
  }
})();
