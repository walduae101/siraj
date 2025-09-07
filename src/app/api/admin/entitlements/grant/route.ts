import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getDb } from '~/server/firebase/admin';
import { appendAudit } from '~/server/audit/log';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, plan, duration } = body;

    if (!email || !plan || !duration) {
      return NextResponse.json({ error: 'Email, plan, and duration are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const targetUid = userDoc.id;

    // Create or update entitlement
    const entitlementRef = db.collection('entitlements').doc(targetUid);
    const expiresAt = new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000);

    await entitlementRef.set({
      plan,
      status: 'active',
      createdAt: new Date(),
      expiresAt,
      grantedBy: user.uid,
      grantedAt: new Date(),
    }, { merge: true });

    // Log audit event
    await appendAudit({
      actorUid: user.uid,
      type: 'admin.grant_entitlement',
      meta: {
        targetUid,
        targetEmail: email,
        plan,
        duration: parseInt(duration),
        expiresAt: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      entitlement: {
        uid: targetUid,
        email,
        plan,
        status: 'active',
        expiresAt: expiresAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Grant entitlement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
