import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { setOrgSeats } from '~/server/orgs/service';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { seats } = body;

    if (!seats || seats < 1) {
      return NextResponse.json({ error: 'Valid seats count is required' }, { status: 400 });
    }

    await setOrgSeats({
      orgId: params.orgId,
      seats,
      updatedBy: user.uid,
    });

    return NextResponse.json({ success: true, seats });

  } catch (error) {
    console.error('Update org seats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
