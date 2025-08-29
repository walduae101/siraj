// /src/app/api/csp-report/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // We don't log the full report in prod to avoid noise; adjust as needed.
  try {
    const body = await req.json();
    console.log(
      "CSP report (sample):",
      body?.["csp-report"]?.["violated-directive"],
    );
  } catch {
    // ignore parse errors
  }
  return NextResponse.json({ ok: true });
}
