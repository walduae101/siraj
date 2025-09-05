import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { createTicket } from '~/server/support/service';
import { sendSupportAutoReply } from '~/emails/support';
import { emitCrm } from '~/server/crm/hooks';
import { trackFeatureUsed } from '~/lib/analytics';

export const runtime = 'nodejs';

export interface CreateSupportRequest {
  email: string;
  subject: string;
  description: string;
  severity?: 'low' | 'med' | 'high' | 'urgent';
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (optional - support can be submitted anonymously)
    const user = await getServerUser().catch(() => null);

    // Parse request body
    let body: CreateSupportRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.email || !body.subject || !body.description) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Missing required fields',
          details: {
            email: !body.email ? 'Email is required' : null,
            subject: !body.subject ? 'Subject is required' : null,
            description: !body.description ? 'Description is required' : null,
          }
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'med', 'high', 'urgent'];
    const severity = body.severity || 'low';
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Validate input lengths
    if (body.subject.length > 200) {
      return NextResponse.json(
        { ok: false, error: 'Subject must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (body.description.length > 5000) {
      return NextResponse.json(
        { ok: false, error: 'Description must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Create support ticket
    const { ticketId } = await createTicket({
      uid: user?.uid || null,
      email: body.email.trim(),
      subject: body.subject.trim(),
      description: body.description.trim(),
      severity: severity as 'low' | 'med' | 'high' | 'urgent',
      source: 'web',
    });

    // Send auto-reply email
    try {
      await sendSupportAutoReply({
        to: body.email,
        ticketId,
        subject: body.subject,
        severity: severity as 'low' | 'med' | 'high' | 'urgent',
      });
    } catch (emailError) {
      console.error('Failed to send support auto-reply:', emailError);
      // Don't fail the request if email fails
    }

    // Emit CRM event
    try {
      await emitCrm({
        type: 'support.ticket_created',
        uid: user?.uid || 'anonymous',
        meta: {
          ticketId,
          email: body.email,
          severity,
          subject: body.subject,
        },
      });
    } catch (crmError) {
      console.error('Failed to emit CRM event:', crmError);
      // Don't fail the request if CRM fails
    }

    // Track analytics
    try {
      trackFeatureUsed('support_ticket_created', user?.uid || 'anonymous', {
        severity,
        hasUser: !!user,
        subjectLength: body.subject.length,
        descriptionLength: body.description.length,
      });
    } catch (analyticsError) {
      console.error('Failed to track analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json(
      {
        ok: true,
        ticketId,
        message: 'Support request created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { ok: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
