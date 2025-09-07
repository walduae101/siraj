import { getDb } from '../src/server/firebase/admin-lazy';
import { invoiceService } from '../src/lib/billing/invoices';
import { dunningEmailService } from '../src/emails/dunning';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { DunningEmail } from '../src/types/billing';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function testDunningEmail() {
  console.log('🧪 Testing dunning email generation...');
  
  try {
    // Get any invoice (we'll simulate it being overdue)
    const invoices = await invoiceService.listInvoices({ limit: 1 });
    
    if (invoices.length === 0) {
      console.log('❌ No overdue invoices found. Please run seed-invoices.ts first.');
      process.exit(1);
    }

    const invoice = invoices[0];
    console.log(`📧 Testing dunning email for invoice: ${invoice.invoiceNumber}`);

    // Create a mock dunning email record
    const dunningEmail: DunningEmail = {
      id: 'test-dunning-1',
      uid: invoice.uid,
      invoiceId: invoice.id,
      type: 'payment_overdue',
      status: 'pending',
      attempts: 1,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate dunning email
    const emailContent = await dunningEmailService.generateDunningEmail(
      invoice,
      dunningEmail.type,
      dunningEmail.attempts
    );

    console.log(`✅ Dunning email generated successfully`);
    console.log(`📧 Subject: ${emailContent.subject}`);

    // Save HTML email to file for inspection
    const tmpDir = join(process.cwd(), 'tmp', 'emails');
    mkdirSync(tmpDir, { recursive: true });
    
    const htmlPath = join(tmpDir, `dunning-${invoice.invoiceNumber}-${dunningEmail.type}.html`);
    writeFileSync(htmlPath, emailContent.html);
    console.log(`💾 HTML email saved to: ${htmlPath}`);

    // Save text email to file
    const textPath = join(tmpDir, `dunning-${invoice.invoiceNumber}-${dunningEmail.type}.txt`);
    writeFileSync(textPath, emailContent.text);
    console.log(`💾 Text email saved to: ${textPath}`);

    // Test sending (dev mode - writes to file)
    await dunningEmailService.sendDunningEmail(dunningEmail, invoice);
    console.log('📤 Dunning email sent (dev mode - check tmp/emails/)');

    console.log('🎉 Dunning email test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing dunning email:', error);
    process.exit(1);
  }
}

// Run the test
(async () => {
  try {
    await testDunningEmail();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
})();
