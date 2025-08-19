import { type NextRequest, NextResponse } from "next/server";
// Legacy path only redirects

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  // Deprecated legacy providers; Google handled client-side
  return NextResponse.redirect("/");
}
