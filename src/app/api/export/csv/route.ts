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
    await withUsage({ uid: user.uid, feature: 'export.csv' });

    const body = await request.json();
    const { data, filename } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Data array is required' }, { status: 400 });
    }

    // TODO: Generate actual CSV content
    // For now, return a mock CSV
    const csvContent = data.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');

    const headers = Object.keys(data[0] || {});
    const csvWithHeaders = [headers.join(','), csvContent].join('\n');

    return new NextResponse(csvWithHeaders, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename || 'export.csv'}"`,
      },
    });

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

    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
