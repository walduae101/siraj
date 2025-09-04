import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getDb } from '~/server/firebase/admin';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const invitesSnapshot = await db.collection('orgs')
      .doc(params.orgId)
      .collection('invites')
      .orderBy('invitedAt', 'desc')
      .get();

    const invites = invitesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ invites });

  } catch (error) {
    console.error('Get org invites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
