import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[webhook-debug] Webhook received");

    const raw = await req.text();
    console.log("[webhook-debug] Raw body length:", raw.length);

    const headers = {
      signature: req.headers.get("PayNow-Signature"),
      timestamp: req.headers.get("PayNow-Timestamp"),
      contentType: req.headers.get("Content-Type"),
    };
    console.log("[webhook-debug] Headers:", headers);

    let evt: any;
    try {
      evt = JSON.parse(raw);
      console.log("[webhook-debug] Event parsed:", {
        id: evt?.id,
        event: evt?.event,
        hasData: !!evt?.data,
      });
    } catch (parseError) {
      console.error("[webhook-debug] JSON parse error:", parseError);
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    // Test config loading
    try {
      const { getConfig } = await import("~/server/config");
      const cfg = getConfig();
      console.log(
        "[webhook-debug] Config loaded successfully, has webhook secret:",
        !!cfg.paynow.webhookSecret,
      );
    } catch (configError) {
      console.error("[webhook-debug] Config loading failed:", configError);
      return NextResponse.json({
        ok: false,
        error: "Config loading failed",
        details:
          configError instanceof Error
            ? configError.message
            : String(configError),
      });
    }

    // Test database connection
    try {
      const { db } = await import("~/server/firebase/admin");
      const testDoc = await db.collection("webhookEvents").limit(1).get();
      console.log(
        "[webhook-debug] Database connection successful, test query returned:",
        testDoc.size,
        "docs",
      );
    } catch (dbError) {
      console.error("[webhook-debug] Database connection failed:", dbError);
      return NextResponse.json({
        ok: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    console.log("[webhook-debug] All systems operational, returning success");

    return NextResponse.json({
      ok: true,
      debug: {
        eventId: evt?.id,
        eventType: evt?.event,
        timestamp: new Date().toISOString(),
        message: "Debug webhook handler successful",
      },
    });
  } catch (error) {
    console.error("[webhook-debug] Unexpected error:", error);
    console.error(
      "[webhook-debug] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
