import { type NextRequest, NextResponse } from "next/server";
import { PromoGuardService } from "~/server/services/promoGuard";
import { WalletLedgerService } from "~/server/services/walletLedger";
import { RiskManagementService } from "~/server/services/riskManagement";
import { withRateLimit } from "~/middleware/ratelimit";
import { getConfig } from "~/server/config";

async function handlePromoRedeem(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();

  try {
    const body = await request.json();
    const { promoCode } = body;

    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Get user ID from auth (in real implementation, decode JWT)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For demo purposes, extract UID from token
    const token = authHeader.substring(7);
    const uid = Buffer.from(token).toString("base64").substring(0, 16);

    // Get IP address
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent");

    // Attempt to redeem promo code
    const redeemResult = await PromoGuardService.redeemPromoCode({
      uid,
      promoCode,
      ip,
      userAgent,
    });

    if (!redeemResult.success) {
      return NextResponse.json(
        { error: redeemResult.error },
        { status: 400 }
      );
    }

    // Check velocity rules for the promo credit
    const velocityResult = await RiskManagementService.checkVelocity({
      uid,
      amount: redeemResult.points!,
      eventType: "promo_redeem",
      source: "promo_guard",
      ip,
    });

    // Create risk event
    const riskEventId = await RiskManagementService.createRiskEvent(
      uid,
      "promo_redeem",
      velocityResult,
      {
        amount: redeemResult.points,
        source: "promo_guard",
        ip,
        promoId: redeemResult.promoId,
      }
    );

    // Create ledger entry
    const ledgerEntry = await WalletLedgerService.createLedgerEntry({
      uid,
      kind: "promo_credit",
      amount: redeemResult.points!,
      source: {
        type: "promo_guard",
        promoId: redeemResult.promoId!,
        usageId: redeemResult.usageId!,
        riskEventId,
      },
      status: velocityResult.decision,
    });

    // Log successful promo redemption
    console.log("[promo-redeem] Promo code redeemed successfully", {
      component: "promo_redeem",
      uid,
      promo_id: redeemResult.promoId,
      points: redeemResult.points,
      risk_score: velocityResult.riskScore,
      decision: velocityResult.decision,
      ledger_id: ledgerEntry.id,
      ip,
    });

    return NextResponse.json({
      success: true,
      points: redeemResult.points,
      status: velocityResult.decision,
      message: velocityResult.decision === "hold" 
        ? "Promo code redeemed but credit is under review"
        : "Promo code redeemed successfully",
    });

  } catch (error) {
    console.error("[promo-redeem] Error processing promo redemption", {
      component: "promo_redeem",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to process promo code" },
      { status: 500 }
    );
  }
}

// Export rate-limited version
export const POST = withRateLimit(handlePromoRedeem, "promo", "promo");
