import { type NextRequest, NextResponse } from "next/server";
import { BackfillService } from "~/server/services/backfill";

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
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      type = "webhook_replay",
      startDate,
      endDate,
      dryRun = false,
      maxEvents = 1000,
    } = body;

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 },
      );
    }

    console.log("[backfill-job] Starting backfill operation", {
      component: "backfill-job",
      type,
      start_date: startDate,
      end_date: endDate,
      dry_run: dryRun,
      max_events: maxEvents,
      timestamp: new Date().toISOString(),
    });

    let results: any;

    // Run appropriate backfill operation
    switch (type) {
      case "webhook_replay":
        results = await BackfillService.replayWebhookEvents({
          startDate,
          endDate,
          dryRun,
          maxEvents,
        });
        break;

      case "reversal_backfill":
        results = await BackfillService.createReversalEntries({
          startDate,
          endDate,
          dryRun,
          maxEvents,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown backfill type: ${type}` },
          { status: 400 },
        );
    }

    // Emit metrics
    console.log("[metrics] backfill_processed_events", {
      component: "backfill-job",
      type,
      processed: results.processed,
      errors: results.errors,
      total: results.total,
      dry_run: dryRun,
      start_date: startDate,
      end_date: endDate,
    });

    // Emit error rate metric if there are errors
    if (results.errors > 0) {
      const errorRate = (results.errors / results.total) * 100;
      console.log("[metrics] backfill_error_rate", {
        component: "backfill-job",
        type,
        error_rate: errorRate,
        errors: results.errors,
        total: results.total,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[backfill-job] Backfill operation failed", {
      component: "backfill-job",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Backfill operation failed",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
