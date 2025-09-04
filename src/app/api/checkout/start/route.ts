import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { planService } from "~/server/models/plans";
import { getConfig } from "~/server/config";

export const runtime = 'nodejs';

interface CheckoutStartRequest {
  sku: string;
  qty: number;
  orgId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutStartRequest = await request.json();
    const { sku, qty = 1, orgId } = body;

    if (!sku || qty < 1) {
      return NextResponse.json(
        { error: 'Invalid request: sku and qty are required' },
        { status: 400 }
      );
    }

    // Validate SKU against plans
    const plan = await planService.getBySku(sku);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid SKU' },
        { status: 400 }
      );
    }

    // Create checkout record
    const db = await getDb();
    const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const checkoutData = {
      id: checkoutId,
      sku,
      qty,
      orgId,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      total: plan.price * qty,
      status: 'started',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('checkouts').doc(checkoutId).set(checkoutData);

    // Get PayNow configuration
    const config = await getConfig();
    const isSandbox = config.features.ENVIRONMENT === 'test';

    if (isSandbox) {
      // In sandbox, redirect to a stub checkout page
      return NextResponse.json({
        success: true,
        checkoutId,
        redirectUrl: `/checkout/stub/${checkoutId}`,
        message: 'Sandbox mode - using stub checkout'
      });
    } else {
      // In production, redirect to PayNow hosted page
      // TODO: Implement PayNow checkout URL generation
      const paynowUrl = `https://paynow.com/checkout/${checkoutId}`;
      
      return NextResponse.json({
        success: true,
        checkoutId,
        redirectUrl: paynowUrl,
        message: 'Redirecting to PayNow'
      });
    }

  } catch (error) {
    console.error('Checkout start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
