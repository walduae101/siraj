import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { getAuditLog } from '~/server/audit/log';
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const actorUid = searchParams.get('actorUid') || undefined;
    const orgId = searchParams.get('orgId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const entries = await getAuditLog({
      type: type as any,
      actorUid,
      orgId,
      limit,
    });

    return NextResponse.json({ entries });

  } catch (error) {
    console.error('Get audit log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
