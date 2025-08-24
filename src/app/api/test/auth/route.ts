import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get auth header
  const authHeader = req.headers.get("authorization");

  return NextResponse.json({
    hasAuthHeader: !!authHeader,
    authHeaderType: authHeader ? authHeader.split(" ")[0] : null,
    authHeaderLength: authHeader ? authHeader.length : 0,
    timestamp: new Date().toISOString(),
  });
}
