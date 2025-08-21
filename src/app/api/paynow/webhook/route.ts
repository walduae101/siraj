import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getConfig } from "~/server/config";
import { db } from "~/server/firebase/admin";
import { pointsService } from "~/server/services/points";
import { subscriptions } from "~/server/services/subscriptions";

// HMAC verification per PayNow docs (headers: paynow-signature, paynow-timestamp)
// PayNow uses base64 encoding for signatures
function verifySignature(
  reqBody: string,
  headers: Headers,
  webhookSecret: string,
): boolean {
  // PayNow uses lowercase header names
  const sig = headers.get("paynow-signature");
  const ts = headers.get("paynow-timestamp");

  if (!sig || !ts) {
    console.warn("[webhook] Missing headers:", {
      hasSignature: !!sig,
      hasTimestamp: !!ts,
      headers: Array.from(headers.keys()),
    });
    return false;
  }

  // Validate webhook secret exists
  if (!webhookSecret) {
    console.error("[webhook] Webhook secret is undefined!");
    return false;
  }

  // Validate request body
  if (!reqBody || typeof reqBody !== "string") {
    console.error("[webhook] Invalid request body:", typeof reqBody);
    return false;
  }

  // Construct payload exactly as PayNow docs specify: timestamp.rawBody
  const payload = `${ts}.${reqBody}`;
  
  try {
    // PayNow uses base64 encoding for the HMAC
    const mac = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("base64");

    console.log("[webhook] Signature verification:", {
      timestamp: ts,
      receivedSig: `${sig.substring(0, 10)}...`,
      computedMac: `${mac.substring(0, 10)}...`,
      payloadLength: payload.length,
    });

    // Ensure both signatures are the same length for timingSafeEqual
    if (mac.length !== sig.length) {
      console.warn("[webhook] Signature length mismatch:", {
        mac: mac.length,
        sig: sig.length,
      });
      return false;
    }

    // Compare base64 signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(mac, "base64"),
      Buffer.from(sig, "base64"),
    );
  } catch (error) {
    console.error("[webhook] HMAC creation or comparison failed:", error);
    return false;
  }
}

// Replay protection: reject events older than 5 minutes
// PayNow sends timestamp in milliseconds
function isValidTimestamp(timestamp: string): boolean {
  const eventTime = Number.parseInt(timestamp); // Already in milliseconds
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  if (Number.isNaN(eventTime)) {
    console.warn("[webhook] Invalid timestamp format:", timestamp);
    return false;
  }

  const age = now - eventTime;
  if (age > fiveMinutesMs) {
    console.warn("[webhook] Timestamp too old:", {
      age: age / 1000,
      maxAge: 300,
    });
    return false;
  }

  return true;
}

// Ensure user document exists before any wallet operations
async function ensureUserDocument(uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set(
      {
        uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: "active",
      },
      { merge: true },
    );
  }
}

// Map PayNow customer to Firebase user
async function resolveUser(customer: any): Promise<string | null> {
  // Primary: use customer metadata uid
  if (customer?.metadata?.uid) {
    return customer.metadata.uid;
  }

  // Secondary: look up by PayNow customer ID
  if (customer?.id) {
    const customerMapping = await db
      .collection("paynowCustomers")
      .doc(customer.id)
      .get();
    if (customerMapping.exists) {
      const uid = customerMapping.data()?.uid;
      if (uid) return uid;
    }
  }

  // Tertiary: fallback to email lookup in userMappings
  if (customer?.email) {
    const userMappings = await db
      .collection("userMappings")
      .where("email", "==", customer.email)
      .limit(1)
      .get();

    if (!userMappings.empty) {
      const uid = userMappings.docs[0]?.id;
      if (uid) {
        // Create the PayNow customer mapping for future efficiency
        if (customer.id) {
          await db.collection("paynowCustomers").doc(customer.id).set(
            {
              uid,
              email: customer.email,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            },
            { merge: true },
          );
        }
        return uid;
      }
    }
  }

  return null;
}

// Process webhook event (idempotent)
async function processWebhookEvent(
  eventId: string,
  eventType: string,
  eventData: any,
) {
  const webhookRef = db.collection("webhookEvents").doc(eventId);

  // Check if already processed (idempotency)
  const existing = await webhookRef.get();
  if (existing.exists) {
    console.log(`[webhook] Event ${eventId} already processed, skipping`);
    return { ok: true, status: "already_processed" };
  }

  // Mark as received
  await webhookRef.set({
    eventId,
    rawEventType: eventType,
    status: "received",
    receivedAt: Timestamp.now(),
    timestamp: new Date().toISOString(),
    payloadHash: crypto
      .createHash("sha256")
      .update(JSON.stringify(eventData))
      .digest("hex"),
  });

  let result = { ok: true, status: "processed", details: {} };

  try {
    // Handle different event types
    switch (eventType) {
      case "ON_ORDER_COMPLETED":
        result.details = await handleOrderCompleted(eventData);
        break;

      case "ON_DELIVERY_ITEM_ADDED":
        result.details = await handleDeliveryItemAdded(eventData);
        break;

      case "ON_SUBSCRIPTION_ACTIVATED":
        result.details = await handleSubscriptionActivated(eventData);
        break;

      case "ON_SUBSCRIPTION_RENEWED":
        result.details = await handleSubscriptionRenewed(eventData);
        break;

      case "ON_SUBSCRIPTION_CANCELED":
      case "ON_SUBSCRIPTION_EXPIRED":
        result.details = await handleSubscriptionEnded(eventData, eventType);
        break;

      default:
        result = {
          ok: true,
          status: "skipped",
          details: { reason: "unsupported_event_type" },
        };
        console.log(`[webhook] Unsupported event type: ${eventType}`);
    }

    // Mark as processed
    await webhookRef.update({
      status: result.status,
      processedAt: Timestamp.now(),
      result: result.details,
    });
  } catch (error) {
    console.error(`[webhook] Error processing event ${eventId}:`, error);
    await webhookRef.update({
      status: "failed",
      processedAt: Timestamp.now(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  return result;
}

// Handle order completion (one-time purchases)
async function handleOrderCompleted(data: any) {
  const order = data?.order;
  if (!order) return { credited: 0, reason: "no_order" };

  const uid = await resolveUser(order.customer);
  if (!uid) return { credited: 0, reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  const cfg = getConfig();
  let totalCredited = 0;
  const results = [];

  for (const line of order.lines ?? []) {
    const productId = String(line.product_id);
    const quantity = Number(line.quantity ?? 1);

    // Check if it's a points product
    const points = cfg.paynow.products[productId];
    if (points && quantity > 0) {
      const delta = Number(points) * quantity;

      await pointsService.credit({
        uid,
        kind: "paid",
        amount: delta,
        source: "paynow:webhook:order",
        actionId: `${order.pretty_id || order.id}_${productId}_${quantity}`,
      });

      // Add ledger entry
      await db
        .collection("users")
        .doc(uid)
        .collection("ledger")
        .add({
          delta: delta,
          type: "purchase",
          source: "paynow",
          orderId: order.pretty_id || order.id,
          productId,
          sku: productId,
          quantity,
          rawEventType: "ON_ORDER_COMPLETED",
          createdAt: Timestamp.now(),
        });

      totalCredited += delta;
      results.push({ productId, quantity, points: delta });
    }

    // Check if it's a subscription product
    const plan = subscriptions.getPlan(productId);
    if (plan) {
      await subscriptions.recordPurchase(
        uid,
        productId,
        order.pretty_id || order.id,
      );
      results.push({ productId, type: "subscription", plan: plan.name });
    }
  }

  return {
    credited: totalCredited,
    uid,
    orderId: order.pretty_id || order.id,
    items: results,
  };
}

// Handle delivery item added (alternative to order completion)
async function handleDeliveryItemAdded(data: any) {
  const order = data?.order;
  const item = data?.delivery_item;

  if (!order || !item) return { credited: 0, reason: "missing_data" };

  const uid = await resolveUser(order.customer);
  if (!uid) return { credited: 0, reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  const cfg = getConfig();
  const productId = String(item.product_id);
  const quantity = Number(item.quantity ?? 1);
  const points = cfg.paynow.products[productId];

  if (!points || quantity <= 0) {
    return { credited: 0, reason: "not_points_product" };
  }

  const delta = Number(points) * quantity;

  await pointsService.credit({
    uid,
    kind: "paid",
    amount: delta,
    source: "paynow:webhook:delivery",
    actionId: `${order.pretty_id || order.id}_delivery_${item.id}_${productId}`,
  });

  await db
    .collection("users")
    .doc(uid)
    .collection("ledger")
    .add({
      delta: delta,
      type: "purchase",
      source: "paynow",
      orderId: order.pretty_id || order.id,
      productId,
      sku: productId,
      quantity,
      rawEventType: "ON_DELIVERY_ITEM_ADDED",
      createdAt: Timestamp.now(),
    });

  return {
    credited: delta,
    uid,
    orderId: order.pretty_id || order.id,
    productId,
  };
}

// Handle subscription activation
async function handleSubscriptionActivated(data: any) {
  const subscription = data?.subscription;
  if (!subscription) return { reason: "no_subscription" };

  const uid = await resolveUser(subscription.customer);
  if (!uid) return { reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  // Record subscription purchase (this also credits first cycle)
  const result = await subscriptions.recordPurchase(
    uid,
    subscription.product_id,
    subscription.id,
  );

  return { uid, subscriptionId: subscription.id, result };
}

// Handle subscription renewal
async function handleSubscriptionRenewed(data: any) {
  const subscription = data?.subscription;
  if (!subscription) return { reason: "no_subscription" };

  const uid = await resolveUser(subscription.customer);
  if (!uid) return { reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  const plan = subscriptions.getPlan(subscription.product_id);
  if (!plan) return { reason: "unknown_plan" };

  const cfg = getConfig();

  // Credit renewal points
  await pointsService.credit({
    uid,
    kind: cfg.subscriptions.pointsKind,
    amount: plan.pointsPerCycle,
    source: `paynow:webhook:renewal:${plan.name}`,
    expiresAt:
      cfg.subscriptions.pointsKind === "promo"
        ? new Date(Date.now() + cfg.subscriptions.pointsExpireDays * 86400000)
        : undefined,
    actionId: `renewal_${subscription.id}_${Date.now()}`,
  });

  // Update subscription record
  const subRef = subscriptions.getSubRef(uid, subscription.id);
  await subRef.update({
    status: "active",
    updatedAt: Timestamp.now(),
    totalGranted: FieldValue.increment(plan.pointsPerCycle),
    nextCreditAt: Timestamp.fromDate(new Date(Date.now() + 30 * 86400000)), // +30 days
  });

  await db.collection("users").doc(uid).collection("ledger").add({
    delta: plan.pointsPerCycle,
    type: "subscription_renewal",
    source: "paynow",
    orderId: subscription.id,
    productId: subscription.product_id,
    sku: subscription.product_id,
    quantity: 1,
    rawEventType: "ON_SUBSCRIPTION_RENEWED",
    createdAt: Timestamp.now(),
  });

  return {
    uid,
    subscriptionId: subscription.id,
    credited: plan.pointsPerCycle,
  };
}

// Handle subscription cancellation/expiration
async function handleSubscriptionEnded(data: any, eventType: string) {
  const subscription = data?.subscription;
  if (!subscription) return { reason: "no_subscription" };

  const uid = await resolveUser(subscription.customer);
  if (!uid) return { reason: "no_user_mapping" };

  // Update subscription status
  const subRef = subscriptions.getSubRef(uid, subscription.id);
  const status =
    eventType === "ON_SUBSCRIPTION_CANCELED" ? "canceled" : "expired";

  await subRef.update({
    status,
    updatedAt: Timestamp.now(),
  });

  return { uid, subscriptionId: subscription.id, status };
}

export async function POST(req: NextRequest) {
  console.log("[webhook] Processing PayNow webhook");

  try {
    const raw = await req.text();
    console.log("[webhook] Raw body received, length:", raw.length);

    const cfg = getConfig();
    console.log(
      "[webhook] Config loaded, has webhook secret:",
      !!cfg.paynow.webhookSecret,
    );

    // Verify HMAC signature
    if (!verifySignature(raw, req.headers, cfg.paynow.webhookSecret)) {
      console.warn("[webhook] Invalid signature");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // Verify timestamp (replay protection)
    const timestamp = req.headers.get("paynow-timestamp");
    if (!timestamp || !isValidTimestamp(timestamp)) {
      console.warn("[webhook] Invalid or expired timestamp");
      return new NextResponse("Invalid timestamp", { status: 401 });
    }

    const evt = JSON.parse(raw);
    const eventId = evt?.id || `fallback_${Date.now()}_${Math.random()}`;
    const eventType = evt?.event_type || evt?.event; // PayNow uses event_type

    console.log("[webhook] Received event:", {
      eventId,
      eventType,
      hasData: !!evt?.data,
      keys: Object.keys(evt || {}),
    });

    if (!eventType) {
      console.warn("[webhook] Missing event type");
      return new NextResponse("Missing event type", { status: 400 });
    }

    // Return 200 immediately for fast ACK, then process
    // For production, consider using background tasks/queues
    const result = await processWebhookEvent(eventId, eventType, evt.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[webhook] Processing error:", error);
    console.error(
      "[webhook] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    // Return detailed error for debugging (remove in production)
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
