import { type NextRequest, NextResponse } from "next/server";
import { getConfig } from "~/server/config";
import { RiskManagementService } from "~/server/services/riskManagement";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();

  try {
    // Validate admin authentication (in production, implement proper admin auth)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get open risk holds
    const openHolds = await RiskManagementService.getOpenRiskHolds();

    // Get risk statistics
    const stats = await RiskManagementService.getRiskStatistics();

    console.log("[admin-risk] Risk holds fetched", {
      component: "admin_risk",
      open_holds_count: openHolds.length,
      total_holds: stats.totalHolds,
      avg_risk_score: stats.avgRiskScore,
    });

    return NextResponse.json({
      holds: openHolds,
      statistics: stats,
    });
  } catch (error) {
    console.error("[admin-risk] Error fetching risk holds", {
      component: "admin_risk",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to fetch risk holds" },
      { status: 500 },
    );
  }
}
