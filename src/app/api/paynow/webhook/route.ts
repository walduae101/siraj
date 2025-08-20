import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "~/server/firebase/admin-lazy";
import { pointsService } from "~/server/services/points";
import { skuMap } from "~/server/services/skuMap";
import { subscriptions } from "~/server/services/subscriptions";

function verifySignature(raw: string, sig: string) {
  const secret = (process.env.PAYNOW_WEBHOOK_SECRET ?? "").trim();
  if (!secret) throw new Error("PAYNOW_WEBHOOK_SECRET missing");
  const h = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig));
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig =
    req.headers.get("paynow-signature") || req.headers.get("x-signature") || "";

  try {
    if (!verifySignature(raw, sig)) {
      return NextResponse.json(
        { ok: false, err: "bad signature" },
        { status: 400 },
      );
    }
    const evt = JSON.parse(raw); // shape per paynow docs
    // Expect evt.type like "order.completed", evt.data with { metadata.uid, items[], productId, ... }
    if (evt.type !== "order.completed") return NextResponse.json({ ok: true });

    const db = await getDb();

    const uid = evt?.data?.metadata?.uid as string | undefined;
    if (!uid)
      return NextResponse.json({ ok: false, err: "no uid" }, { status: 200 });

    // loop items and grant
    for (const item of evt.data.items ?? []) {
      const pid = String(item.productId);
      const sku = Object.entries(skuMap).find(
        ([, v]) => v.productId === pid,
      )?.[0];
      if (!sku) {
        // Check if this is a subscription product directly
        const plan = subscriptions.getPlan(pid);
        if (plan) {
          await subscriptions.recordPurchase(uid, pid, evt.data.id);
        }
        continue;
      }

      const skuData = skuMap[sku as keyof typeof skuMap];
      if (!skuData) continue;
      const grant = skuData.grant;

      if (grant.type === "points") {
        await pointsService.credit({
          uid,
          kind: "paid",
          amount: grant.amount * (item.quantity ?? 1),
          source: "paynow",
          actionId: `${evt.data.id}_${pid}_${item.quantity}`,
        });
      } else {
        // Check for subscription plan in new system first
        const plan = subscriptions.getPlan(pid);
        if (plan) {
          await subscriptions.recordPurchase(uid, pid, evt.data.id);
        } else {
          // Fall back to minimal subscription flag for legacy handling
          await db.runTransaction(async (tx) => {
            const prof = db.collection("profiles").doc(uid);
            tx.set(
              prof,
              {
                subscription: {
                  plan: grant.plan,
                  cycle: grant.cycle,
                  status: "active",
                  provider: "paynow",
                  orderId: evt.data.id,
                  at: new Date(),
                },
              },
              { merge: true },
            );
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[paynow.webhook]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
