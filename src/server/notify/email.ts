import { promises as fs } from 'fs';
import path from 'path';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  data?: Record<string, any>;
}

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Siraj!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Siraj!</h1>
        <p>Thank you for signing up. We're excited to have you on board!</p>
        <p>Your account is now ready to use. You can start exploring our features right away.</p>
        <div style="margin: 20px 0;">
          <a href="{{appUrl}}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Siraj Team</p>
      </div>
    `,
    text: `
      Welcome to Siraj!
      
      Thank you for signing up. We're excited to have you on board!
      
      Your account is now ready to use. You can start exploring our features right away.
      
      Go to Dashboard: {{appUrl}}/dashboard
      
      If you have any questions, feel free to reach out to our support team.
      
      Best regards,
      The Siraj Team
    `,
  },
  
  invite: {
    subject: 'You\'re invited to join {{orgName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">You're Invited!</h1>
        <p>{{inviterName}} has invited you to join <strong>{{orgName}}</strong> on Siraj.</p>
        <p>Your role will be: <strong>{{role}}</strong></p>
        <div style="margin: 20px 0;">
          <a href="{{inviteUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
        </div>
        <p>This invitation will expire on {{expiresAt}}.</p>
        <p>If you don't want to join this organization, you can safely ignore this email.</p>
        <p>Best regards,<br>The Siraj Team</p>
      </div>
    `,
    text: `
      You're Invited!
      
      {{inviterName}} has invited you to join {{orgName}} on Siraj.
      
      Your role will be: {{role}}
      
      Accept Invitation: {{inviteUrl}}
      
      This invitation will expire on {{expiresAt}}.
      
      If you don't want to join this organization, you can safely ignore this email.
      
      Best regards,
      The Siraj Team
    `,
  },
  
  receipt: {
    subject: 'Receipt for your Siraj purchase',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Payment Receipt</h1>
        <p>Thank you for your purchase! Here are the details:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Description:</strong> {{description}}</p>
          <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        </div>
        <p>You can view your full payment history in your account settings.</p>
        <div style="margin: 20px 0;">
          <a href="{{appUrl}}/account/plan" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Account</a>
        </div>
        <p>Best regards,<br>The Siraj Team</p>
      </div>
    `,
    text: `
      Payment Receipt
      
      Thank you for your purchase! Here are the details:
      
      Description: {{description}}
      Amount: {{amount}} {{currency}}
      Date: {{date}}
      Transaction ID: {{transactionId}}
      
      You can view your full payment history in your account settings.
      
      View Account: {{appUrl}}/account/plan
      
      Best regards,
      The Siraj Team
    `,
  },
  
  cancelConfirm: {
    subject: 'Subscription cancellation confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Subscription Cancelled</h1>
        <p>Your subscription has been successfully cancelled.</p>
        <p>Your access will continue until <strong>{{expiresAt}}</strong>.</p>
        <p>After that date, you'll be moved to the free plan.</p>
        <div style="margin: 20px 0;">
          <a href="{{appUrl}}/pricing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Plans</a>
        </div>
        <p>We're sorry to see you go. If you change your mind, you can reactivate your subscription anytime before the expiration date.</p>
        <p>Best regards,<br>The Siraj Team</p>
      </div>
    `,
    text: `
      Subscription Cancelled
      
      Your subscription has been successfully cancelled.
      
      Your access will continue until {{expiresAt}}.
      
      After that date, you'll be moved to the free plan.
      
      View Plans: {{appUrl}}/pricing
      
      We're sorry to see you go. If you change your mind, you can reactivate your subscription anytime before the expiration date.
      
      Best regards,
      The Siraj Team
    `,
  },
  
  usageLimit: {
    subject: 'Usage limit reached - {{feature}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Usage Limit Reached</h1>
        <p>You've reached your daily limit for <strong>{{feature}}</strong>.</p>
        <p>Used: {{used}} / {{limit}}</p>
        <p>To continue using this feature, consider upgrading your plan.</p>
        <div style="margin: 20px 0;">
          <a href="{{appUrl}}/pricing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Upgrade Now</a>
        </div>
        <p>Your limits will reset tomorrow, or you can upgrade to get higher limits.</p>
        <p>Best regards,<br>The Siraj Team</p>
      </div>
    `,
    text: `
      Usage Limit Reached
      
      You've reached your daily limit for {{feature}}.
      
      Used: {{used}} / {{limit}}
      
      To continue using this feature, consider upgrading your plan.
      
      Upgrade Now: {{appUrl}}/pricing
      
      Your limits will reset tomorrow, or you can upgrade to get higher limits.
      
      Best regards,
      The Siraj Team
    `,
  },
};

export async function sendEmail(emailData: EmailData): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // In development, write email to file
    await writeEmailToFile(emailData);
  } else {
    // In production, send actual email
    await sendActualEmail(emailData);
  }
}

async function writeEmailToFile(emailData: EmailData): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `email-${timestamp}-${emailData.to.replace(/[@.]/g, '-')}.eml`;
  const emailDir = path.join(process.cwd(), 'tmp', 'emails');
  
  // Ensure directory exists
  await fs.mkdir(emailDir, { recursive: true });
  
  const emailContent = `
To: ${emailData.to}
Subject: ${emailData.template.subject}
Content-Type: text/html; charset=UTF-8

${emailData.template.html}

---

Plain text version:
${emailData.template.text}
  `.trim();
  
  const filePath = path.join(emailDir, filename);
  await fs.writeFile(filePath, emailContent, 'utf8');
  
  console.log(`📧 Email written to: ${filePath}`);
}

async function sendActualEmail(emailData: EmailData): Promise<void> {
  // TODO: Integrate with email service provider (SendGrid, AWS SES, etc.)
  console.log('📧 Would send email:', {
    to: emailData.to,
    subject: emailData.template.subject,
  });
}

export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  
  // Replace placeholders with data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return rendered;
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const template = EMAIL_TEMPLATES.welcome;
  const renderedTemplate = {
    subject: renderTemplate(template.subject, { name: name || 'User' }),
    html: renderTemplate(template.html, { 
      name: name || 'User',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
    text: renderTemplate(template.text, { 
      name: name || 'User',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
  };
  
  await sendEmail({
    to: email,
    template: renderedTemplate,
  });
}

export async function sendInviteEmail(
  email: string, 
  orgName: string, 
  inviterName: string, 
  role: string, 
  inviteUrl: string,
  expiresAt: string
): Promise<void> {
  const template = EMAIL_TEMPLATES.invite;
  const renderedTemplate = {
    subject: renderTemplate(template.subject, { orgName }),
    html: renderTemplate(template.html, { 
      orgName,
      inviterName,
      role,
      inviteUrl,
      expiresAt,
    }),
    text: renderTemplate(template.text, { 
      orgName,
      inviterName,
      role,
      inviteUrl,
      expiresAt,
    }),
  };
  
  await sendEmail({
    to: email,
    template: renderedTemplate,
  });
}

export async function sendReceiptEmail(
  email: string,
  description: string,
  amount: number,
  currency: string,
  date: string,
  transactionId: string
): Promise<void> {
  const template = EMAIL_TEMPLATES.receipt;
  const renderedTemplate = {
    subject: template.subject,
    html: renderTemplate(template.html, { 
      description,
      amount,
      currency,
      date,
      transactionId,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
    text: renderTemplate(template.text, { 
      description,
      amount,
      currency,
      date,
      transactionId,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
  };
  
  await sendEmail({
    to: email,
    template: renderedTemplate,
  });
}

export async function sendUsageLimitEmail(
  email: string,
  feature: string,
  used: number,
  limit: number
): Promise<void> {
  const template = EMAIL_TEMPLATES.usageLimit;
  const renderedTemplate = {
    subject: renderTemplate(template.subject, { feature }),
    html: renderTemplate(template.html, { 
      feature,
      used,
      limit,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
    text: renderTemplate(template.text, { 
      feature,
      used,
      limit,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    }),
  };
  
  await sendEmail({
    to: email,
    template: renderedTemplate,
  });
}
