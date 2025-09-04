import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { inviteMember } from '~/server/orgs/service';
import { serverOnly } from '~/lib/server-only';

serverOnly();

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const invite = await inviteMember({
      orgId,
      email,
      role,
      invitedBy: user.uid,
    });

    return NextResponse.json({ invite });

  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
