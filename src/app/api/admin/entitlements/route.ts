import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getDb } from '~/server/firebase/admin';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    const db = await getDb();
    const entitlementsSnapshot = await db.collection('entitlements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const entitlements = await Promise.all(
      entitlementsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Try to get user info
        let userEmail, userName;
        try {
          const userDoc = await db.collection('users').doc(doc.id).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userEmail = userData?.email;
            userName = userData?.displayName || userData?.name;
          }
        } catch (error) {
          // User doc might not exist, continue without user info
        }

        return {
          id: doc.id,
          uid: doc.id,
          plan: data.plan,
          status: data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
          userEmail,
          userName,
        };
      })
    );

    return NextResponse.json({ entitlements });

  } catch (error) {
    console.error('Get entitlements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
