import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsEvent } from '~/server/analytics/schema';
import { sendToVendors } from '~/server/analytics/vendors';
import { redactAnalyticsPayload, redactLogMessage } from '~/lib/redact';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let evt: AnalyticsEvent;
    try {
      evt = await request.json();
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!evt?.type) {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // Privacy: block if DNT or no consent (adjust policy for your app)
    if (evt.dnt === true || evt.consent === false) {
      return NextResponse.json(
        { ok: true, skipped: 'privacy' },
        { status: 202 }
      );
    }

    // Enrich event with server context
    const enrichedEvent: AnalyticsEvent = {
      ...evt,
      ts: evt.ts || Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          '127.0.0.1',
      referrer: request.headers.get('referer') || undefined,
    };

    // Send to vendors (errors are non-fatal)
    const results = await sendToVendors(enrichedEvent);

    // Log in development (with redaction)
    if (process.env.NODE_ENV !== 'production') {
      const redactedEvent = redactAnalyticsPayload({
        type: enrichedEvent.type,
        uid: enrichedEvent.uid,
        keyId: enrichedEvent.keyId,
        meta: enrichedEvent.meta,
      });
      
      const redactedResults = redactAnalyticsPayload({
        mixpanel: {
          ok: results.mixpanel.ok,
          status: results.mixpanel.status,
          skipped: results.mixpanel.skipped,
        },
        ga4: {
          ok: results.ga4.ok,
          status: results.ga4.status,
          skipped: results.ga4.skipped,
        },
      });
      
      console.log('[ANALYTICS/SERVER]', {
        event: redactedEvent,
        results: redactedResults,
      });
    }

    return NextResponse.json(
      { 
        ok: true, 
        results: {
          mixpanel: {
            ok: results.mixpanel.ok,
            skipped: results.mixpanel.skipped,
          },
          ga4: {
            ok: results.ga4.ok,
            skipped: results.ga4.skipped,
          },
        }
      },
      { status: 202 }
    );

  } catch (error) {
    console.error('Analytics tracking error:', error);
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
