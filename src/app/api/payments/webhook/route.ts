import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getConfigSafely } from "~/server/api/trpc";
import { saveReceiptFromWebhook } from "~/server/services/receipts.service";

export const runtime = "nodejs"; // allow node crypto reliably
export const dynamic = "force-dynamic";
export const preferredRegion = ["us-central1", "europe-west1"];

function verifySignature(
  rawBody: Buffer,
  secret: string,
  signature: string | null,
) {
  if (!signature || !secret) return false;
  const h = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Accept hex or base64; normalize
  return (
    signature === h || signature === Buffer.from(h, "hex").toString("base64")
  );
}

export async function POST(req: NextRequest) {
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("x-paynow-signature");
    const secret = process.env.PAYNOW_WEBHOOK_SECRET || "";
    if (!verifySignature(raw, secret, sig)) {
      return new NextResponse(
        JSON.stringify({ ok: false, reason: "bad_sig" }),
        { status: 400 },
      );
    }

    const evt = JSON.parse(raw.toString("utf8")) as {
      id: string;
      type: string;
      data: any;
    };

    // Idempotent write (service should handle dedupe)
    await saveReceiptFromWebhook({ req, evt });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "handler_error" },
      { status: 200 },
    );
  }
}

export async function HEAD() {
  // Fast path for health probes
  return new NextResponse(null, { status: 204 });
}
