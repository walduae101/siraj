import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { createOrg } from '~/server/orgs/service';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, seats } = body;

    if (!name || !seats) {
      return NextResponse.json({ error: 'Name and seats are required' }, { status: 400 });
    }

    if (seats < 2) {
      return NextResponse.json({ error: 'Minimum 2 seats required' }, { status: 400 });
    }

    const org = await createOrg({
      name,
      ownerUid: user.uid,
      seats,
    });

    return NextResponse.json({ org });

  } catch (error) {
    console.error('Create org error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
