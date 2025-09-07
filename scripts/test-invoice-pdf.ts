import { getDb } from '../src/server/firebase/admin-lazy';
import { invoiceService } from '../src/lib/billing/invoices';
import { generateInvoicePDF } from '../src/lib/pdf/playwright-invoice';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin
import '../src/server/bootstrap';

async function testInvoicePDF() {
  console.log('🧪 Testing invoice PDF generation...');
  
  try {
    // Get the first invoice from the database
    const invoices = await invoiceService.listInvoices({ limit: 1 });
    
    if (invoices.length === 0) {
      console.log('❌ No invoices found. Please run seed-invoices.ts first.');
      process.exit(1);
    }

    const invoice = invoices[0];
    console.log(`📄 Testing PDF generation for invoice: ${invoice.invoiceNumber}`);

    // Generate PDF using Playwright
    const pdfBuffer = await generateInvoicePDF(invoice);
    console.log(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Save to file for inspection
    const tmpDir = join(process.cwd(), 'tmp');
    mkdirSync(tmpDir, { recursive: true });
    const outputPath = join(tmpDir, `test-invoice-${invoice.invoiceNumber}.pdf`);
    writeFileSync(outputPath, pdfBuffer);
    console.log(`💾 PDF saved to: ${outputPath}`);

    // Test API endpoint (simulate request)
    console.log('🔗 Test the API endpoint:');
    console.log(`   GET http://localhost:3000/api/invoices/${invoice.id}`);
    console.log('   (Note: Requires authentication in production)');

    console.log('🎉 Invoice PDF test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing invoice PDF:', error);
    process.exit(1);
  }
}

// Run the test
(async () => {
  try {
    await testInvoicePDF();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
})();
