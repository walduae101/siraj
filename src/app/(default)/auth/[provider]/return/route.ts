import { type NextRequest, NextResponse } from "next/server";
// Legacy path only redirects

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  // Legacy path no longer used; Firebase Google handled client-side
  // Use hardcoded URL to avoid env validation during build
  return NextResponse.redirect("https://siraj.life");
}
