import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { apiKeyService } from '~/lib/apiKeys';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    await apiKeyService.revokeKey(user.uid, keyId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
