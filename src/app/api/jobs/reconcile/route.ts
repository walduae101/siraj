import { type NextRequest, NextResponse } from "next/server";
import { ReconciliationService } from "~/server/services/reconciliation";

// Simple OIDC validation (in production, use proper JWT validation)
function validateOIDC(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  // In production, validate the JWT token properly
  // For now, just check if it's a service account token
  const token = authHeader.substring(7);
  return token.length > 100; // Basic check for JWT token
}

export async function POST(request: NextRequest) {
  try {
    // Validate OIDC authentication
    if (!validateOIDC(request)) {
      return NextResponse.json(
        { error: "Unauthorized - OIDC token required" },
        { status: 401 }
      );
    }

    // Get date from request body or use today
    const body = await request.json().catch(() => ({}));
    const date = body.date || new Date().toISOString().split("T")[0];

    console.log("[reconcile-job] Starting daily reconciliation", {
      component: "reconcile-job",
      date,
      timestamp: new Date().toISOString(),
    });

    // Run reconciliation for all users
    const results = await ReconciliationService.reconcileAllUsers(date);

    // Emit metrics
    console.log("[metrics] reconciliation_daily", {
      component: "reconcile-job",
      date,
      total_users: results.total,
      clean_users: results.clean,
      adjusted_users: results.adjusted,
      error_users: results.errors,
      total_delta: results.totalDelta,
    });

    // Emit specific metrics for alerts
    if (results.adjusted > 0) {
      console.log("[metrics] wallet_invariant_violations", {
        component: "reconcile-job",
        count: results.adjusted,
        date,
      });
    }

    if (results.totalDelta > 0) {
      console.log("[metrics] reconciliation_adjustment_amount", {
        component: "reconcile-job",
        amount: results.totalDelta,
        date,
      });
    }

    return NextResponse.json({
      success: true,
      date,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[reconcile-job] Reconciliation failed", {
      component: "reconcile-job",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Reconciliation failed",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
