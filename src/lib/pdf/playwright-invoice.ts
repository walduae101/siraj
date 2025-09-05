import { chromium, Browser, Page } from 'playwright';
import type { Invoice } from '~/types/billing';

export class PlaywrightInvoiceGenerator {
  private browser: Browser | null = null;

  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();
    
    try {
      // Generate HTML content
      const html = this.generateInvoiceHTML(invoice);
      
      // Set content and wait for fonts to load
      await page.setContent(html, { waitUntil: 'networkidle' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  private generateInvoiceHTML(invoice: Invoice): string {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .company-info h1 {
              margin: 0;
              color: #1f2937;
              font-size: 28px;
              font-weight: 700;
            }
            .company-info p {
              margin: 5px 0;
              color: #6b7280;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              margin: 0 0 10px 0;
              color: #1f2937;
              font-size: 24px;
            }
            .invoice-details p {
              margin: 5px 0;
              color: #6b7280;
            }
            .customer-section {
              margin-bottom: 30px;
            }
            .customer-section h3 {
              margin: 0 0 10px 0;
              color: #374151;
              font-size: 18px;
            }
            .customer-section p {
              margin: 5px 0;
              color: #6b7280;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th,
            .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            .items-table th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .items-table .text-right {
              text-align: right;
            }
            .totals-section {
              margin-left: auto;
              width: 300px;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-table .label {
              font-weight: 500;
              color: #374151;
            }
            .totals-table .amount {
              text-align: right;
              font-weight: 600;
              color: #1f2937;
            }
            .totals-table .total-row {
              background-color: #f3f4f6;
              font-weight: 700;
              font-size: 16px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background-color: #d1fae5; color: #065f46; }
            .status-sent { background-color: #dbeafe; color: #1e40af; }
            .status-overdue { background-color: #fee2e2; color: #991b1b; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>Siraj</h1>
              <p>123 Business Street</p>
              <p>Dubai, UAE</p>
              <p>support@siraj.life</p>
            </div>
            <div class="invoice-details">
              <h2>Invoice ${invoice.invoiceNumber}</h2>
              <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> 
                <span class="status-badge status-${invoice.status}">${invoice.status}</span>
              </p>
            </div>
          </div>

          <div class="customer-section">
            <h3>Bill To:</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            <p>${invoice.customer.email}</p>
            ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">${formatCurrency(invoice.subtotal)}</td>
              </tr>
              ${invoice.taxRate > 0 ? `
                <tr>
                  <td class="label">VAT (${(invoice.taxRate * 100).toFixed(1)}%):</td>
                  <td class="amount">${formatCurrency(invoice.taxAmount)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td class="label">Total:</td>
                <td class="amount">${formatCurrency(invoice.total)}</td>
              </tr>
            </table>
          </div>

          ${invoice.paymentDetails ? `
            <div class="footer">
              <p><strong>Payment Details:</strong></p>
              <p>${invoice.paymentDetails.instructions}</p>
              ${invoice.paymentDetails.reference ? `<p>Reference: ${invoice.paymentDetails.reference}</p>` : ''}
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>For questions about this invoice, please contact support@siraj.life</p>
          </div>
        </body>
      </html>
    `;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
let pdfGenerator: PlaywrightInvoiceGenerator | null = null;

export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  if (!pdfGenerator) {
    pdfGenerator = new PlaywrightInvoiceGenerator();
  }
  
  try {
    return await pdfGenerator.generateInvoicePDF(invoice);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}

// Cleanup function for graceful shutdown
export async function cleanupPDFGenerator(): Promise<void> {
  if (pdfGenerator) {
    await pdfGenerator.close();
    pdfGenerator = null;
  }
}
