import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { invoiceService } from '~/lib/billing/invoices';
import { generateInvoicePDF } from '~/lib/pdf/playwright-invoice';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has access to this invoice
    if (invoice.uid !== user.uid) {
      // TODO: Check if user is admin or has org access
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Generate PDF using Playwright
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Invoice PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
