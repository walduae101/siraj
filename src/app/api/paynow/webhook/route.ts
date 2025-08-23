import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getConfig } from "~/server/config";
import { db } from "~/server/firebase/admin";
import { pointsService } from "~/server/services/points";
import { publishPaynowEvent } from "~/server/services/pubsubPublisher";
import { subscriptions } from "~/server/services/subscriptions";
import { ProductCatalogService } from "~/server/services/productCatalog";
import { WalletLedgerService } from "~/server/services/walletLedger";
import { withRateLimit } from "~/middleware/ratelimit";

// PayNow webhook types
interface PayNowCustomer {
  id?: string;
  email?: string;
  metadata?: {
    uid?: string;
  };
}

interface PayNowOrderLine {
  product_id: string;
  quantity?: number;
  price?: string;
}

interface PayNowOrder {
  id: string;
  pretty_id?: string;
  customer: PayNowCustomer;
  lines?: PayNowOrderLine[];
}

interface PayNowSubscription {
  id: string;
  product_id: string;
  customer: PayNowCustomer;
}

interface PayNowDeliveryItem {
  id: string;
  product_id: string;
  quantity?: number;
}

interface PayNowWebhookData {
  order?: PayNowOrder;
  subscription?: PayNowSubscription;
  delivery_item?: PayNowDeliveryItem;
}

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
async function resolveUser(customer: PayNowCustomer): Promise<string | null> {
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
  eventData: PayNowWebhookData,
) {
  const webhookRef = db.collection("webhookEvents").doc(eventId);

  // Check if already processed (idempotency)
  const existing = await webhookRef.get();
  if (existing.exists) {
    console.log(`[webhook] Event ${eventId} already processed, skipping`);
    return { ok: true, status: "already_processed" };
  }

  // Mark as received
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + 30 * 24 * 60 * 60 * 1000, // 30 days TTL
  );

  await webhookRef.set({
    eventId,
    rawEventType: eventType,
    status: "received",
    receivedAt: now,
    timestamp: new Date().toISOString(),
    payloadHash: crypto
      .createHash("sha256")
      .update(JSON.stringify(eventData))
      .digest("hex"),
    expiresAt, // TTL field - configure this in Firebase Console
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

      case "ON_REFUND":
        result.details = await handleRefund(eventData);
        break;

      case "ON_CHARGEBACK":
        result.details = await handleChargeback(eventData);
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
async function handleOrderCompleted(data: PayNowWebhookData) {
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

    // Resolve product using SoT with fallback
    let productPoints: number | null = null;
    let productSource = "unknown";
    let productVersion: number | undefined;
    let firestoreProductId: string | undefined;

    if (cfg.features.PRODUCT_SOT === "firestore") {
      // Try Firestore first
      const product = await ProductCatalogService.getProductByPayNowId(productId);
      if (product) {
        productPoints = product.points;
        productSource = "firestore";
        productVersion = product.version;
        firestoreProductId = product.id;
      } else {
        // Fallback to GSM
        const gsmProduct = ProductCatalogService.getProductFromGSM(productId);
        if (gsmProduct) {
          productPoints = gsmProduct.points;
          productSource = "gsm_fallback";
        }
      }
    } else {
      // Use GSM directly
      const gsmProduct = ProductCatalogService.getProductFromGSM(productId);
      if (gsmProduct) {
        productPoints = gsmProduct.points;
        productSource = "gsm";
      }
    }

    if (productPoints && quantity > 0) {
      const delta = productPoints * quantity;

      // Create ledger entry and update balance in single transaction
      const { ledgerId, newBalance } = await WalletLedgerService.createLedgerEntry(
        uid,
        {
          amount: delta,
          currency: "POINTS",
          kind: "purchase",
          source: {
            eventId: order.id,
            orderId: order.pretty_id || order.id,
            paynowCustomerId: order.customer?.id,
            productId: firestoreProductId,
            productVersion,
          },
        },
        "system:webhook"
      );

      // Log structured fields for observability
      console.log("[webhook] Order completed", {
        event_id: order.id,
        user_id: uid,
        order_id: order.pretty_id || order.id,
        product_id: productId,
        product_source: productSource,
        product_version: productVersion,
        ledger_id: ledgerId,
        balance_after: newBalance,
        points_credited: delta,
        quantity,
      });

      totalCredited += delta;
      results.push({ 
        productId, 
        quantity, 
        points: delta,
        productSource,
        ledgerId,
      });
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
async function handleDeliveryItemAdded(data: PayNowWebhookData) {
  const order = data?.order;
  const item = data?.delivery_item;

  if (!order || !item) return { credited: 0, reason: "missing_data" };

  const uid = await resolveUser(order.customer);
  if (!uid) return { credited: 0, reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  const cfg = getConfig();
  const productId = String(item.product_id);
  const quantity = Number(item.quantity ?? 1);

  // Resolve product using SoT with fallback
  let productPoints: number | null = null;
  let productSource = "unknown";
  let productVersion: number | undefined;
  let firestoreProductId: string | undefined;

  if (cfg.features.PRODUCT_SOT === "firestore") {
    // Try Firestore first
    const product = await ProductCatalogService.getProductByPayNowId(productId);
    if (product) {
      productPoints = product.points;
      productSource = "firestore";
      productVersion = product.version;
      firestoreProductId = product.id;
    } else {
      // Fallback to GSM
      const gsmProduct = ProductCatalogService.getProductFromGSM(productId);
      if (gsmProduct) {
        productPoints = gsmProduct.points;
        productSource = "gsm_fallback";
      }
    }
  } else {
    // Use GSM directly
    const gsmProduct = ProductCatalogService.getProductFromGSM(productId);
    if (gsmProduct) {
      productPoints = gsmProduct.points;
      productSource = "gsm";
    }
  }

  if (!productPoints || quantity <= 0) {
    return { credited: 0, reason: "not_points_product" };
  }

  const delta = productPoints * quantity;

  // Create ledger entry and update balance in single transaction
  const { ledgerId, newBalance } = await WalletLedgerService.createLedgerEntry(
    uid,
    {
      amount: delta,
      currency: "POINTS",
      kind: "purchase",
      source: {
        eventId: order.id,
        orderId: order.pretty_id || order.id,
        paynowCustomerId: order.customer?.id,
        productId: firestoreProductId,
        productVersion,
      },
    },
    "system:webhook"
  );

  // Log structured fields for observability
  console.log("[webhook] Delivery item added", {
    event_id: order.id,
    user_id: uid,
    order_id: order.pretty_id || order.id,
    product_id: productId,
    product_source: productSource,
    product_version: productVersion,
    ledger_id: ledgerId,
    balance_after: newBalance,
    points_credited: delta,
    quantity,
  });

  return {
    credited: delta,
    uid,
    orderId: order.pretty_id || order.id,
    productId,
    productSource,
    ledgerId,
  };
}

// Handle subscription activation
async function handleSubscriptionActivated(data: PayNowWebhookData) {
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
async function handleSubscriptionRenewed(data: PayNowWebhookData) {
  const subscription = data?.subscription;
  if (!subscription) return { reason: "no_subscription" };

  const uid = await resolveUser(subscription.customer);
  if (!uid) return { reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  // Record subscription renewal (this also credits the cycle)
  const result = await subscriptions.recordRenewal(
    uid,
    subscription.product_id,
    subscription.id,
  );

  return { uid, subscriptionId: subscription.id, result };
}

// Handle refund events
async function handleRefund(data: PayNowWebhookData) {
  const order = data?.order;
  if (!order) return { reason: "no_order" };

  const uid = await resolveUser(order.customer);
  if (!uid) return { reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  // Find the original ledger entry by order ID
  const db = await getDb();
  const ledgerSnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("wallet")
    .collection("ledger")
    .where("source.orderId", "==", order.pretty_id || order.id)
    .where("kind", "==", "purchase")
    .limit(1)
    .get();

  if (ledgerSnapshot.empty) {
    console.warn("[webhook] No original purchase found for refund", {
      order_id: order.pretty_id || order.id,
      user_id: uid,
    });
    return { reason: "no_original_purchase" };
  }

  const originalEntry = ledgerSnapshot.docs[0];
  const originalData = originalEntry.data();

  // Create reversal entry
  const { ledgerId, newBalance } = await WalletLedgerService.createReversalEntry(
    uid,
    originalEntry.id,
    "refund",
    "system:webhook",
    "PayNow refund processed"
  );

  // Check if balance would go negative
  const cfg = getConfig();
  const negativeBalance = newBalance < 0;
  
  if (negativeBalance && !cfg.features.ALLOW_NEGATIVE_BALANCE) {
    console.warn("[webhook] Refund would create negative balance", {
      user_id: uid,
      order_id: order.pretty_id || order.id,
      original_balance: originalData.balanceAfter,
      refund_amount: Math.abs(originalData.amount),
      new_balance: newBalance,
    });
  }

  // Log structured fields for observability
  console.log("[webhook] Refund processed", {
    event_id: order.id,
    user_id: uid,
    order_id: order.pretty_id || order.id,
    original_ledger_id: originalEntry.id,
    reversal_ledger_id: ledgerId,
    balance_after: newBalance,
    negative_balance: negativeBalance,
    refund_amount: Math.abs(originalData.amount),
  });

  return {
    uid,
    orderId: order.pretty_id || order.id,
    originalLedgerId: originalEntry.id,
    reversalLedgerId: ledgerId,
    refundAmount: Math.abs(originalData.amount),
    newBalance,
    negativeBalance,
  };
}

// Handle chargeback events
async function handleChargeback(data: PayNowWebhookData) {
  const order = data?.order;
  if (!order) return { reason: "no_order" };

  const uid = await resolveUser(order.customer);
  if (!uid) return { reason: "no_user_mapping" };

  await ensureUserDocument(uid);

  // Find the original ledger entry by order ID
  const db = await getDb();
  const ledgerSnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("wallet")
    .collection("ledger")
    .where("source.orderId", "==", order.pretty_id || order.id)
    .where("kind", "==", "purchase")
    .limit(1)
    .get();

  if (ledgerSnapshot.empty) {
    console.warn("[webhook] No original purchase found for chargeback", {
      order_id: order.pretty_id || order.id,
      user_id: uid,
    });
    return { reason: "no_original_purchase" };
  }

  const originalEntry = ledgerSnapshot.docs[0];
  const originalData = originalEntry.data();

  // Create reversal entry
  const { ledgerId, newBalance } = await WalletLedgerService.createReversalEntry(
    uid,
    originalEntry.id,
    "chargeback",
    "system:webhook",
    "PayNow chargeback processed"
  );

  // Check if balance would go negative
  const cfg = getConfig();
  const negativeBalance = newBalance < 0;
  
  if (negativeBalance && !cfg.features.ALLOW_NEGATIVE_BALANCE) {
    console.warn("[webhook] Chargeback would create negative balance", {
      user_id: uid,
      order_id: order.pretty_id || order.id,
      original_balance: originalData.balanceAfter,
      chargeback_amount: Math.abs(originalData.amount),
      new_balance: newBalance,
    });
  }

  // Log structured fields for observability
  console.log("[webhook] Chargeback processed", {
    event_id: order.id,
    user_id: uid,
    order_id: order.pretty_id || order.id,
    original_ledger_id: originalEntry.id,
    reversal_ledger_id: ledgerId,
    balance_after: newBalance,
    negative_balance: negativeBalance,
    chargeback_amount: Math.abs(originalData.amount),
  });

  return {
    uid,
    orderId: order.pretty_id || order.id,
    originalLedgerId: originalEntry.id,
    reversalLedgerId: ledgerId,
    chargebackAmount: Math.abs(originalData.amount),
    newBalance,
    negativeBalance,
  };
}

// Handle subscription cancellation/expiration
async function handleSubscriptionEnded(
  data: PayNowWebhookData,
  eventType: string,
) {
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

async function handleWebhook(req: NextRequest) {
  const startTime = Date.now();
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
    const eventId = evt?.id || `fallback_${Date.now()}_${crypto.randomUUID()}`;
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

    // Check webhook mode from config
    const webhookMode = cfg.features.webhookMode;

    if (webhookMode === "queue") {
      // Queue mode: Write to webhookEvents and publish to Pub/Sub
      const publishStartTime = Date.now();

      try {
        // Write minimal data to webhookEvents with status "queued"
        const now = Timestamp.now();
        const expiresAt = Timestamp.fromMillis(
          now.toMillis() + 30 * 24 * 60 * 60 * 1000, // 30 days TTL
        );

        await db
          .collection("webhookEvents")
          .doc(eventId)
          .set({
            eventId,
            rawEventType: eventType,
            status: "queued",
            receivedAt: now,
            timestamp: new Date().toISOString(),
            payloadHash: crypto
              .createHash("sha256")
              .update(JSON.stringify(evt.data))
              .digest("hex"),
            expiresAt,
            attempts: 0,
          });

        // Extract user ID for ordering key
        const order = evt?.data?.order;
        const subscription = evt?.data?.subscription;
        const customer = order?.customer || subscription?.customer;
        const uid = await resolveUser(customer);

        // Publish to Pub/Sub
        const messageId = await publishPaynowEvent({
          eventId,
          eventType,
          orderId: order?.pretty_id || order?.id || subscription?.id,
          paynowCustomerId: customer?.id,
          uid: uid || undefined,
          data: evt.data,
        });

        const publishMs = Date.now() - publishStartTime;
        const totalMs = Date.now() - startTime;

        console.log("[webhook] Event queued successfully", {
          event_id: eventId,
          event_type: eventType,
          message_id: messageId,
          status: "queued",
          publish_ms: publishMs,
          processing_ms: totalMs,
        });

        // Return 200 immediately for fast ACK
        return NextResponse.json({
          ok: true,
          status: "queued",
          messageId,
        });
      } catch (error) {
        const errorMs = Date.now() - startTime;
        console.error("[webhook] Failed to queue event", {
          event_id: eventId,
          event_type: eventType,
          error: error instanceof Error ? error.message : String(error),
          processing_ms: errorMs,
        });

        // Fall back to sync processing if queue fails
        const result = await processWebhookEvent(eventId, eventType, evt.data);
        return NextResponse.json(result);
      }
    } else {
      // Sync mode: Process immediately (existing behavior)
      const result = await processWebhookEvent(eventId, eventType, evt.data);
      return NextResponse.json(result);
    }
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

// Export with rate limiting
export const POST = withRateLimit(handleWebhook, "webhook", "webhook");
