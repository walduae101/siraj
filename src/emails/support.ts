import fs from 'node:fs';
import path from 'node:path';

export interface SupportAutoReplyOptions {
  to: string;
  ticketId: string;
  subject: string;
  severity?: 'low' | 'med' | 'high' | 'urgent';
}

export async function sendSupportAutoReply(options: SupportAutoReplyOptions): Promise<boolean> {
  const { to, ticketId, subject, severity = 'low' } = options;
  
  // Generate email content
  const severityText = {
    low: 'Low Priority',
    med: 'Medium Priority', 
    high: 'High Priority',
    urgent: 'Urgent'
  }[severity];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received - Siraj</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0;">Support Request Received</h1>
    <p style="margin: 0; color: #666;">Thank you for contacting Siraj Support</p>
  </div>
  
  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1f2937; margin-top: 0;">Request Details</h2>
    
    <div style="margin-bottom: 15px;">
      <strong>Ticket ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${ticketId}</code>
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Subject:</strong> ${subject}
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Priority:</strong> <span style="color: ${getSeverityColor(severity)}; font-weight: bold;">${severityText}</span>
    </div>
    
    <div style="margin-bottom: 20px;">
      <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Open</span>
    </div>
    
    <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
      <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">What happens next?</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Our support team will review your request within 24 hours</li>
        <li>You'll receive updates via email as we work on your issue</li>
        <li>For urgent issues, we'll prioritize your request</li>
      </ul>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Need immediate assistance? Reply to this email or visit our 
        <a href="https://siraj.life/support" style="color: #2563eb;">support center</a>.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>© 2025 Siraj. All rights reserved.</p>
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>`;

  const text = `
SUPPORT REQUEST RECEIVED - SIRAJ

Thank you for contacting Siraj Support!

Request Details:
- Ticket ID: ${ticketId}
- Subject: ${subject}
- Priority: ${severityText}
- Status: Open

What happens next?
- Our support team will review your request within 24 hours
- You'll receive updates via email as we work on your issue
- For urgent issues, we'll prioritize your request

Need immediate assistance? Reply to this email or visit our support center at https://siraj.life/support

---
© 2025 Siraj. All rights reserved.
This is an automated message. Please do not reply directly to this email.
`;

  // Dev mode: write to /tmp/emails
  if (process.env.NODE_ENV !== 'production') {
    const dir = path.join(process.cwd(), 'tmp', 'emails');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlFile = path.join(dir, `support-${ticketId}-${timestamp}.html`);
    const txtFile = path.join(dir, `support-${ticketId}-${timestamp}.txt`);

    fs.writeFileSync(htmlFile, html);
    fs.writeFileSync(txtFile, text);

    console.log(`[EMAIL][DEV] Support auto-reply written for ticket ${ticketId}`);
    console.log(`  HTML: ${htmlFile}`);
    console.log(`  Text: ${txtFile}`);
  }

  // In production, this would send via email service (SendGrid, SES, etc.)
  // await emailService.send({
  //   to,
  //   subject: `Support Request Received - ${ticketId}`,
  //   html,
  //   text,
  // });

  return true;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return '#6b7280';
    case 'med': return '#f59e0b';
    case 'high': return '#ef4444';
    case 'urgent': return '#dc2626';
    default: return '#6b7280';
  }
}

export async function sendSupportUpdate(
  to: string,
  ticketId: string,
  subject: string,
  message: string,
  status: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Support Update - Siraj</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0;">Support Update</h1>
    <p style="margin: 0; color: #666;">Update on your support request</p>
  </div>
  
  <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <div style="margin-bottom: 15px;">
      <strong>Ticket ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${ticketId}</code>
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Subject:</strong> ${subject}
    </div>
    
    <div style="margin-bottom: 15px;">
      <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${status}</span>
    </div>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #6b7280;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">Update Message</h3>
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>© 2025 Siraj. All rights reserved.</p>
  </div>
</body>
</html>`;

  const text = `
SUPPORT UPDATE - SIRAJ

Ticket ID: ${ticketId}
Subject: ${subject}
Status: ${status}

Update Message:
${message}

---
© 2025 Siraj. All rights reserved.
`;

  // Dev mode: write to /tmp/emails
  if (process.env.NODE_ENV !== 'production') {
    const dir = path.join(process.cwd(), 'tmp', 'emails');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlFile = path.join(dir, `support-update-${ticketId}-${timestamp}.html`);
    const txtFile = path.join(dir, `support-update-${ticketId}-${timestamp}.txt`);

    fs.writeFileSync(htmlFile, html);
    fs.writeFileSync(txtFile, text);

    console.log(`[EMAIL][DEV] Support update written for ticket ${ticketId}`);
  }

  return true;
}
