import { NextRequest, NextResponse } from 'next/server';
import { withUsage, isUsageLimitError } from '~/server/usage/withUsage';
import { getServerUser } from '~/server/auth/getServerUser';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check usage limits before processing
    await withUsage({ uid: user.uid, feature: 'ai.generate' });

    const body = await request.json();
    const { prompt, type = 'text' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // TODO: Integrate with actual AI service (OpenAI, Anthropic, etc.)
    // For now, return a mock response
    const mockResponse = {
      id: `ai_${Date.now()}`,
      type,
      prompt,
      result: `AI-generated content for: "${prompt}"`,
      timestamp: new Date().toISOString(),
      usage: {
        tokens: Math.floor(Math.random() * 1000) + 100,
        cost: 0.01,
      },
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    if (isUsageLimitError(error)) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        code: error.code,
        feature: error.feature,
        used: error.used,
        limit: error.limit,
        remaining: error.remaining,
        upgradeUrl: error.upgradeUrl,
      }, { status: 402 });
    }

    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
