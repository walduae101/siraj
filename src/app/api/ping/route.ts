import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '~/middleware/apiKey';
import { rateLimitService } from '~/lib/rateLimit';
import { getDb } from '~/server/firebase/admin-lazy';
import { emitFirstApiCall } from '~/server/crm/hooks';
import { trackApiCallSuccess } from '~/lib/analytics';
import type { ApiKeyRequest } from '~/middleware/apiKey';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return withApiKeyAuth(request, async (req: ApiKeyRequest, auth) => {
    try {
      // Get user's plan for rate limiting
      const db = await getDb();
      const entitlementDoc = await db.collection('entitlements').doc(auth.uid).get();
      const plan = entitlementDoc.exists ? entitlementDoc.data()?.plan || 'free' : 'free';

      // Check rate limits
      const rateLimitResult = await rateLimitService.checkAndConsume(
        auth.keyId,
        'ping',
        plan
      );

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimitResult.retryAfter,
            resetTime: rateLimitResult.resetTime.toISOString(),
          },
          {
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
            },
          }
        );
      }

      // Emit CRM and analytics events for first API call
      await emitFirstApiCall(auth.uid, 'ping');
      trackApiCallSuccess(auth.uid, 'ping', auth.keyId);

      return NextResponse.json({
        ok: true,
        keyId: auth.keyId,
        uid: auth.uid,
        plan,
        timestamp: new Date().toISOString(),
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.toISOString(),
        },
      });

    } catch (error) {
      console.error('Ping endpoint error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
