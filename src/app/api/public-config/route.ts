import { NextResponse } from "next/server";
import { getServerConfig } from "../../../lib/config.server";

export async function GET() {
  const cfg = await getServerConfig();
  return NextResponse.json(cfg.public, { status: 200 });
}
