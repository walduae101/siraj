import { NextResponse } from "next/server";
import { getConfig } from "~/server/config";
import { subscriptions } from "~/server/services/subscriptions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Verify cron authentication
  const key = req.headers.get("x-cron-key");
  const cfg = getConfig();
  if (
    !key ||
    !cfg.subscriptions.cronSecret ||
    key !== cfg.subscriptions.cronSecret
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await subscriptions.creditAllDue(400);

    // Log result for monitoring
    console.log(
      `[cron.subscription-credit] Processed ${result.processed} subscriptions`,
    );

    return NextResponse.json({
      ok: result.ok,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron.subscription-credit] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
