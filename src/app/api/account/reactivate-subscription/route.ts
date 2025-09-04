import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getDb } from '~/server/firebase/admin-lazy';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const entitlementRef = db.collection('entitlements').doc(user.uid);
    
    // Get current entitlement
    const entitlementDoc = await entitlementRef.get();
    if (!entitlementDoc.exists) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const entitlement = entitlementDoc.data();
    if (entitlement?.status !== 'canceled') {
      return NextResponse.json({ error: 'Subscription is not canceled' }, { status: 400 });
    }

    // Reactivate subscription
    await entitlementRef.update({
      status: 'active',
      reactivatedAt: new Date(),
      // TODO: Set actual period end date based on billing cycle
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // TODO: Integrate with payment provider (Stripe, etc.) to reactivate subscription
    // For now, just mark as active in our database

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
