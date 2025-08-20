import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { pointsService } from "~/server/services/points";
import { subscriptions } from "~/server/services/subscriptions";
import { env } from "~/env-server";

const productPoints = JSON.parse(process.env.NEXT_PUBLIC_PAYNOW_POINTS_PRODUCT_POINTS_JSON ?? "{}") as Record<string, number>;

// HMAC verification per docs (headers: PayNow-Signature, PayNow-Timestamp)
function verify(reqBody: string, headers: Headers) {
  const sig = headers.get("PayNow-Signature");
  const ts  = headers.get("PayNow-Timestamp");
  if (!sig || !ts || !env.PAYNOW_WEBHOOK_SECRET) return false;
  const payload = `${ts}.${reqBody}`;
  const mac = crypto.createHmac("sha256", env.PAYNOW_WEBHOOK_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sig));
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  
  if (!verify(raw, req.headers)) {
    return new NextResponse("invalid signature", { status: 401 });
  }
  
  const evt = JSON.parse(raw);

  // We care about on_order_completed for top-ups
  if (evt?.event === "on_order_completed") {
    const order = evt?.data?.order;
    const pretty = order?.pretty_id;
    const uid = order?.customer?.metadata?.uid || order?.customer?.email; // how you linked customers → users
    if (!uid) return NextResponse.json({ ok: true, skipped: "no-uid" });

    let credited = 0;
    for (const line of order?.lines ?? []) {
      const pid = String(line.product_id);
      const qty = Number(line.quantity ?? 1);
      const pts = productPoints[pid];
      if (pts && qty > 0) {
        const delta = pts * qty;
        await pointsService.credit({
          uid,
          kind: "paid",
          amount: delta,
          source: "paynow:webhook",
          actionId: `${pretty}_${pid}_${qty}`,
        });
        credited += delta;
      }
      
      // Also check for subscription plans
      const plan = subscriptions.getPlan(pid);
      if (plan) {
        await subscriptions.recordPurchase(uid, pid, pretty || order?.id);
      }
    }
    return NextResponse.json({ ok: true, credited });
  }

  return NextResponse.json({ ok: true });
}
