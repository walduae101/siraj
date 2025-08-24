import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    console.log("[webhook-test] Received test webhook");
    console.log("[webhook-test] Headers:", headers);
    console.log("[webhook-test] Body:", body);

    return NextResponse.json({
      success: true,
      message: "Test webhook received",
      timestamp: new Date().toISOString(),
      headers: headers,
      body: body,
    });
  } catch (error) {
    console.error("[webhook-test] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook test endpoint is working",
    timestamp: new Date().toISOString(),
  });
}
