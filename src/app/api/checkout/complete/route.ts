import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { planService } from "~/server/models/plans";
import { entitlementService } from "~/server/models/entitlements";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json(
        { error: 'Missing reference parameter' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get checkout record
    const checkoutDoc = await db.collection('checkouts').doc(ref).get();
    if (!checkoutDoc.exists) {
      return NextResponse.json(
        { error: 'Checkout not found' },
        { status: 404 }
      );
    }

    const checkout = checkoutDoc.data();
    
    if (!checkout) {
      return NextResponse.json(
        { error: 'Checkout data not found' },
        { status: 400 }
      );
    }
    
    // Check if already completed
    if (checkout.status === 'completed') {
      return NextResponse.json({
        ok: true,
        entitlementId: checkout.entitlementId,
        message: 'Checkout already completed'
      });
    }

    // Get plan details
    const plan = await planService.getById(checkout.planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 400 }
      );
    }

    // TODO: In production, verify payment with PayNow API
    // For now, we'll assume payment is successful in sandbox mode
    
    // Create entitlement
    let entitlementId: string;
    
    if (plan.price === 0) {
      // Free plan - create points entitlement
      entitlementId = await entitlementService.create({
        type: 'POINTS',
        points: 1000, // Free tier gets 1000 points
        source: 'grant',
        userId: checkout.userId,
        orgId: checkout.orgId,
      });
    } else {
      // Paid plan - create subscription entitlement
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
      
      entitlementId = await entitlementService.create({
        type: 'SUBSCRIPTION',
        planId: plan.id,
        status: 'active',
        source: 'purchase',
        expiresAt: Timestamp.fromDate(expiresAt),
        txnRef: ref,
        userId: checkout.userId,
        orgId: checkout.orgId,
      });
    }

    // Update checkout status
    await db.collection('checkouts').doc(ref).update({
      status: 'completed',
      entitlementId,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // TODO: Append to audit log
    // TODO: Send confirmation email
    // TODO: Update usage metrics

    return NextResponse.json({
      ok: true,
      entitlementId,
      message: 'Checkout completed successfully'
    });

  } catch (error) {
    console.error('Checkout complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
