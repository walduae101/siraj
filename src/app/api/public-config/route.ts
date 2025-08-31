import { NextResponse } from "next/server";
import { loadPublicConfig } from "~/lib/config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await loadPublicConfig();
  if (!cfg.ok) {
    return NextResponse.json({ error: "Firebase configuration not available", missing: cfg.missing }, { status: 500 });
  }
  return NextResponse.json({ firebase: cfg.firebase, app: cfg.app, features: cfg.features }, { headers: { "cache-control": "no-store" } });
}
