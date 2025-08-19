import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env-combined";
// Legacy path only redirects

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  // Legacy path no longer used; Firebase Google handled client-side
  return NextResponse.redirect(env.NEXT_PUBLIC_WEBSITE_URL);
}
