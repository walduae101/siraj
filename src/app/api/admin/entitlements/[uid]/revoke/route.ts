import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getDb } from '~/server/firebase/admin';
import { appendAudit } from '~/server/audit/log';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // For now, allow all authenticated users to access admin features in dev
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      // In production, check admin role
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { uid } = await params;
    const db = await getDb();
    const entitlementRef = db.collection('entitlements').doc(uid);
    
    // Get current entitlement
    const entitlementDoc = await entitlementRef.get();
    if (!entitlementDoc.exists) {
      return NextResponse.json({ error: 'Entitlement not found' }, { status: 404 });
    }

    const entitlement = entitlementDoc.data();

    // Revoke entitlement
    await entitlementRef.update({
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy: user.uid,
    });

    // Log audit event
    await appendAudit({
      actorUid: user.uid,
      type: 'admin.revoke_entitlement',
      meta: {
        targetUid: uid,
        previousPlan: entitlement?.plan,
        previousStatus: entitlement?.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Entitlement revoked successfully',
    });

  } catch (error) {
    console.error('Revoke entitlement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
