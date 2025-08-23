import { type NextRequest, NextResponse } from "next/server";
import { RiskManagementService } from "~/server/services/riskManagement";
import { WalletLedgerService } from "~/server/services/walletLedger";
import { getConfig } from "~/server/config";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();

  try {
    // Validate OIDC token (in production, implement proper OIDC validation)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get open risk holds
    const openHolds = await RiskManagementService.getOpenRiskHolds();
    
    console.log("[risk-evaluate] Starting risk evaluation", {
      component: "risk_evaluate",
      open_holds_count: openHolds.length,
    });

    let processedCount = 0;
    let releasedCount = 0;
    let reversedCount = 0;

    // Process each open hold
    for (const hold of openHolds) {
      try {
        // Re-evaluate risk score
        const velocityResult = await RiskManagementService.checkVelocity({
          uid: hold.uid,
          amount: hold.metadata.amount || 0,
          eventType: hold.eventType,
          source: hold.metadata.source || "unknown",
          customerId: hold.metadata.customerId,
          ip: hold.metadata.ip,
        });

        let decision: "posted" | "reversed" = "posted";
        let reason = "Auto-released after re-evaluation";

        // Decision logic:
        // - If risk score is still high (>70), reverse
        // - If risk score is moderate (30-70), keep on hold for manual review
        // - If risk score is low (<30), release
        if (velocityResult.riskScore > 70) {
          decision = "reversed";
          reason = "High risk score maintained";
        } else if (velocityResult.riskScore >= 30) {
          // Keep on hold for manual review
          continue;
        }

        // Resolve the risk hold
        await RiskManagementService.resolveRiskHold(
          hold.id,
          decision,
          "system",
          reason
        );

        // Update ledger entry status if we have a ledger entry ID
        // Note: In a real implementation, we'd need to store the ledger entry ID in the risk event
        // For now, we'll skip this step as the ledger entry status is managed separately

        processedCount++;
        if (decision === "posted") {
          releasedCount++;
        } else {
          reversedCount++;
        }

        console.log("[risk-evaluate] Risk hold processed", {
          component: "risk_evaluate",
          risk_event_id: hold.id,
          uid: hold.uid,
          original_risk_score: hold.riskScore,
          new_risk_score: velocityResult.riskScore,
          decision,
          reason,
        });

      } catch (error) {
        console.error("[risk-evaluate] Error processing risk hold", {
          component: "risk_evaluate",
          risk_event_id: hold.id,
          uid: hold.uid,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Get updated statistics
    const stats = await RiskManagementService.getRiskStatistics();

    console.log("[risk-evaluate] Risk evaluation completed", {
      component: "risk_evaluate",
      processed_count: processedCount,
      released_count: releasedCount,
      reversed_count: reversedCount,
      remaining_open_holds: stats.openHolds,
      avg_risk_score: stats.avgRiskScore,
    });

    return NextResponse.json({
      success: true,
      processed: processedCount,
      released: releasedCount,
      reversed: reversedCount,
      remainingOpenHolds: stats.openHolds,
      avgRiskScore: stats.avgRiskScore,
    });

  } catch (error) {
    console.error("[risk-evaluate] Error in risk evaluation job", {
      component: "risk_evaluate",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to evaluate risk holds" },
      { status: 500 }
    );
  }
}
