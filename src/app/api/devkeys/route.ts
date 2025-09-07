import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { apiKeyService } from '~/lib/apiKeys';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const keys = await apiKeyService.listKeys(user.uid);

    return NextResponse.json({ keys });

  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
