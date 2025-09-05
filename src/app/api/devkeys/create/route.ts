import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { apiKeyService } from '~/lib/apiKeys';
import { emitApiKeyCreated } from '~/server/crm/hooks';
import { trackApiKeyCreated } from '~/lib/analytics';
import type { ApiKeyCreateRequest } from '~/types/apiKeys';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: ApiKeyCreateRequest = await request.json();
    const { name, expiresAt, permissions } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'API key name must be less than 100 characters' }, { status: 400 });
    }

    // Parse expiresAt if provided
    let expiresDate: Date | undefined;
    if (expiresAt) {
      expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
      }
      if (expiresDate <= new Date()) {
        return NextResponse.json({ error: 'Expiration date must be in the future' }, { status: 400 });
      }
    }

    const result = await apiKeyService.generateKey(user.uid, {
      name: name.trim(),
      expiresAt: expiresDate,
      permissions,
    });

    // Emit CRM and analytics events
    await emitApiKeyCreated(user.uid, result.id);
    trackApiKeyCreated(user.uid, result.id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
