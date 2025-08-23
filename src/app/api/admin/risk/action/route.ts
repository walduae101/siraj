import { type NextRequest, NextResponse } from "next/server";
import { RiskManagementService } from "~/server/services/riskManagement";
import { WalletLedgerService } from "~/server/services/walletLedger";
import { getConfig } from "~/server/config";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();

  try {
    // Validate admin authentication (in production, implement proper admin auth)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { holdId, action, reason } = body;

    if (!holdId || !action || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: holdId, action, reason" },
        { status: 400 }
      );
    }

    if (!["release", "reverse", "ban"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'release', 'reverse', or 'ban'" },
        { status: 400 }
      );
    }

    // Get the risk hold
    const openHolds = await RiskManagementService.getOpenRiskHolds();
    const hold = openHolds.find(h => h.id === holdId);

    if (!hold) {
      return NextResponse.json(
        { error: "Risk hold not found or already resolved" },
        { status: 404 }
      );
    }

    let decision: "posted" | "reversed" = "posted";
    let actionReason = reason;

    switch (action) {
      case "release":
        decision = "posted";
        actionReason = `Admin release: ${reason}`;
        break;
      case "reverse":
        decision = "reversed";
        actionReason = `Admin reverse: ${reason}`;
        break;
      case "ban":
        decision = "reversed";
        actionReason = `Admin ban: ${reason}`;
        // In a real implementation, you would also ban the user here
        break;
    }

    // Resolve the risk hold
    await RiskManagementService.resolveRiskHold(
      holdId,
      decision,
      "admin",
      actionReason
    );

    // Update ledger entry status if we have a ledger entry ID
    // Note: In a real implementation, we'd need to store the ledger entry ID in the risk event
    // For now, we'll skip this step as the ledger entry status is managed separately

    console.log("[admin-risk] Risk hold action performed", {
      component: "admin_risk",
      risk_event_id: holdId,
      uid: hold.uid,
      action,
      decision,
      reason: actionReason,
    });

    return NextResponse.json({
      success: true,
      action,
      decision,
      reason: actionReason,
    });

  } catch (error) {
    console.error("[admin-risk] Error performing risk hold action", {
      component: "admin_risk",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to perform risk hold action" },
      { status: 500 }
    );
  }
}
