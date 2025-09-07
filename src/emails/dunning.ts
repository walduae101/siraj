import type { Invoice, DunningEmail } from '~/types/billing';

export class DunningEmailService {
  async generateDunningEmail(
    invoice: Invoice,
    type: DunningEmail['type'],
    attempt: number
  ): Promise<{ subject: string; html: string; text: string }> {
    const baseSubject = `Payment Reminder - Invoice ${invoice.invoiceNumber}`;
    const subject = this.getSubjectForType(type, baseSubject, attempt);
    
    const html = this.generateHTML(invoice, type, attempt);
    const text = this.generateText(invoice, type, attempt);

    return { subject, html, text };
  }

  private getSubjectForType(type: DunningEmail['type'], baseSubject: string, attempt: number): string {
    switch (type) {
      case 'payment_failed':
        return `Payment Failed - ${baseSubject}`;
      case 'payment_overdue':
        return attempt === 1 
          ? `Payment Overdue - ${baseSubject}`
          : `Final Notice - ${baseSubject}`;
      case 'final_notice':
        return `FINAL NOTICE - ${baseSubject}`;
      default:
        return baseSubject;
    }
  }

  private generateHTML(invoice: Invoice, type: DunningEmail['type'], attempt: number): string {
    const urgency = this.getUrgencyLevel(type, attempt);
    const actionText = this.getActionText(type, attempt);
    const paymentUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/account/billing/pay/${invoice.id}`;

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
    <style>
        body { font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: ${urgency.color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        .urgent { border-left: 4px solid #dc3545; padding-left: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${urgency.title}</h1>
        </div>
        
        <div class="content">
            <p>Dear ${invoice.customer.name},</p>
            
            <div class="${urgency.urgent ? 'urgent' : ''}">
                <p>${urgency.message}</p>
            </div>

            <div class="invoice-details">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Issue Date:</strong> ${this.formatDate(invoice.issueDate)}</p>
                <p><strong>Due Date:</strong> ${this.formatDate(invoice.dueDate)}</p>
                <p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
                ${invoice.taxAmount > 0 ? `<p><strong>VAT:</strong> ${invoice.currency} ${invoice.taxAmount.toFixed(2)}</p>` : ''}
            </div>

            <p>${actionText}</p>
            
            <div style="text-align: center;">
                <a href="${paymentUrl}" class="cta-button">Pay Now</a>
            </div>

            <p>If you have already made this payment, please disregard this notice. If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Thank you for your business.</p>
            
            <p>Best regards,<br>Siraj Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at <a href="mailto:support@siraj.life">support@siraj.life</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateText(invoice: Invoice, type: DunningEmail['type'], attempt: number): string {
    const urgency = this.getUrgencyLevel(type, attempt);
    const actionText = this.getActionText(type, attempt);
    const paymentUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/account/billing/pay/${invoice.id}`;

    return `
${urgency.title}

Dear ${invoice.customer.name},

${urgency.message}

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${this.formatDate(invoice.issueDate)}
- Due Date: ${this.formatDate(invoice.dueDate)}
- Amount Due: ${invoice.currency} ${invoice.total.toFixed(2)}
${invoice.taxAmount > 0 ? `- VAT: ${invoice.currency} ${invoice.taxAmount.toFixed(2)}` : ''}

${actionText}

Pay Now: ${paymentUrl}

If you have already made this payment, please disregard this notice. If you have any questions or need assistance, please contact our support team.

Thank you for your business.

Best regards,
Siraj Team

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@siraj.life
`;
  }

  private getUrgencyLevel(type: DunningEmail['type'], attempt: number) {
    switch (type) {
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          message: 'We were unable to process your payment for the above invoice. Please update your payment method and try again.',
          color: '#ffc107',
          urgent: false,
        };
      case 'payment_overdue':
        if (attempt === 1) {
          return {
            title: 'Payment Overdue',
            message: 'Your payment is now overdue. Please make payment as soon as possible to avoid any service interruptions.',
            color: '#fd7e14',
            urgent: true,
          };
        } else {
          return {
            title: 'Final Notice',
            message: 'This is your final notice. Your payment is significantly overdue and immediate action is required.',
            color: '#dc3545',
            urgent: true,
          };
        }
      case 'final_notice':
        return {
          title: 'FINAL NOTICE',
          message: 'This is your final notice before we take further action. Payment is required immediately.',
          color: '#dc3545',
          urgent: true,
        };
      default:
        return {
          title: 'Payment Reminder',
          message: 'This is a friendly reminder that your payment is due.',
          color: '#007bff',
          urgent: false,
        };
    }
  }

  private getActionText(type: DunningEmail['type'], attempt: number): string {
    switch (type) {
      case 'payment_failed':
        return 'Please update your payment method and complete the payment to avoid any service interruptions.';
      case 'payment_overdue':
        return attempt === 1 
          ? 'Please make payment as soon as possible to avoid any late fees or service interruptions.'
          : 'Immediate payment is required to avoid further action.';
      case 'final_notice':
        return 'Payment is required immediately. Failure to pay may result in service suspension.';
      default:
        return 'Please complete your payment at your earliest convenience.';
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Development mode: write email to file instead of sending
  async sendDunningEmail(email: DunningEmail, invoice: Invoice): Promise<void> {
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      // In development, write to file
      const emailContent = await this.generateDunningEmail(invoice, email.type, email.attempts);
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const emailDir = path.join(process.cwd(), 'tmp', 'emails');
      await fs.mkdir(emailDir, { recursive: true });
      
      const filename = `dunning-${email.id}-${Date.now()}.html`;
      const filepath = path.join(emailDir, filename);
      
      await fs.writeFile(filepath, emailContent.html);
      console.log(`[DEV] Dunning email written to: ${filepath}`);
    } else {
      // In production, integrate with email service (SendGrid, SES, etc.)
      // TODO: Implement actual email sending
      console.log(`[PROD] Would send dunning email to ${invoice.customer.email}`);
    }
  }
}

export const dunningEmailService = new DunningEmailService();
