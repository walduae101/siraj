import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { invoiceService } from '~/lib/billing/invoices';

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
    const status = searchParams.get('status') as any;
    const uid = searchParams.get('uid');
    const orgId = searchParams.get('orgId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const filters = {
      status,
      uid: uid || undefined,
      orgId: orgId || undefined,
      limit,
      offset,
    };

    const invoices = await invoiceService.listInvoices(filters);

    return NextResponse.json({ invoices });

  } catch (error) {
    console.error('Get admin invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
