import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getConfig, getProductId, getSubscriptionPlan } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { pointsService } from "~/server/services/points";
import { skuMap } from "~/server/services/skuMap";
import { subscriptions } from "~/server/services/subscriptions";

// Import bootstrap for HTTP keep-alive
import "~/server/bootstrap";

// Structured logging helper
function structuredLog(
  severity: "INFO" | "WARNING" | "ERROR",
  message: string,
  metadata: Record<string, unknown>,
) {
  const logEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    component: "paynow_worker",
    ...metadata,
  };

  if (severity === "ERROR") {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// Verify OIDC token from Pub/Sub push
function verifyPubSubToken(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  // In production, verify the OIDC token properly
  // For now, we'll check basic presence
  // TODO: Implement proper OIDC verification
  return true;
}

// Parse Pub/Sub push message
interface PubSubMessage {
  message: {
    attributes: Record<string, string>;
    data: string; // base64 encoded
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify this is a legitimate Pub/Sub push
    if (!verifyPubSubToken(req)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse Pub/Sub message
    const body: PubSubMessage = await req.json();
    const { message } = body;

    if (!message) {
      return new NextResponse("Invalid message format", { status: 400 });
    }

    // Decode message data
    const messageData = JSON.parse(
      Buffer.from(message.data, "base64").toString(),
    );

    const eventId = messageData.eventId;
    const eventType = messageData.eventType;
    const attributes = message.attributes || {};

    // PHASE 7: Schema compatibility check
    const config = await getConfig();

    const messageVersion = messageData.version || 1;
    const minCompatible = config.features.eventSchema.minCompatible;

    if (messageVersion < minCompatible) {
      structuredLog(
        "WARNING",
        "Incompatible schema version - dropping message",
        {
          event_id: eventId,
          message_version: messageVersion.toString(),
          min_compatible: minCompatible.toString(),
          verdict: "drop_incompatible",
          pipeline: "queue",
          region: process.env.REGION || "us-central1",
        },
      );

      // Return 2xx to acknowledge and prevent retries
      return new NextResponse("Incompatible schema version", { status: 200 });
    }

    const deliveryAttempt = Number.parseInt(
      attributes.delivery_attempt || "1",
      10,
    );
    const nextRetryMs = deliveryAttempt < 5 ? 2 ** deliveryAttempt * 1000 : 0;

    structuredLog("INFO", "Worker received message", {
      event_id: eventId,
      event_type: eventType,
      message_id: message.messageId,
      attributes,
      pipeline: "queue",
      ordering_key: attributes.ordering_key,
      delivery_attempt: deliveryAttempt.toString(),
      next_retry_ms: nextRetryMs,
      max_attempts: "5",
      region: process.env.REGION || "us-central1",
      message_version: messageVersion.toString(),
      schema_compatible: (messageVersion >= minCompatible).toString(),
    });

    // PHASE 7: Check idempotency before processing
    const db = await getDb();
    const webhookRef = db.collection("webhookEvents").doc(eventId);
    const existing = await webhookRef.get();

    if (existing.exists) {
      structuredLog("INFO", "Event already processed - skipping", {
        event_id: eventId,
        pipeline: "queue",
        duplicate: "true",
        region: process.env.REGION || "us-central1",
        delivery_attempt: deliveryAttempt.toString(),
      });

      // Return 2xx to acknowledge and prevent retries
      return new NextResponse("Event already processed", { status: 200 });
    }

    // Process the event
    const result = await processPaynowEvent(
      eventId,
      eventType,
      messageData.data,
      attributes,
      startTime,
    );

    if (result.success) {
      // Return 2xx for successful processing
      return new NextResponse("OK", { status: 200 });
    }
    if (result.terminal) {
      // Return 2xx for terminal failures (don't retry)
      structuredLog("WARNING", "Terminal failure - not retrying", {
        event_id: eventId,
        reason: result.reason,
      });
      return new NextResponse("Terminal failure", { status: 200 });
    }
    // Return 5xx for transient failures (retry)
    const retryDeliveryAttempt = Number.parseInt(
      attributes.delivery_attempt || "1",
      10,
    );
    const retryNextRetryMs =
      retryDeliveryAttempt < 5 ? 2 ** retryDeliveryAttempt * 1000 : 0;

    structuredLog("WARNING", "Transient failure - will retry", {
      event_id: eventId,
      reason: result.reason,
      delivery_attempt: retryDeliveryAttempt.toString(),
      next_retry_ms: retryNextRetryMs,
      max_attempts: "5",
    });

    return new NextResponse(result.reason || "Processing failed", {
      status: 500,
    });
  } catch (error) {
    const processingMs = Date.now() - startTime;

    structuredLog("ERROR", "Worker error", {
      error: error instanceof Error ? error.message : String(error),
      processing_ms: processingMs,
    });

    // Return 500 for Pub/Sub to retry
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Process a PayNow event from the queue
async function processPaynowEvent(
  eventId: string,
  eventType: string,
  eventData: unknown,
  attributes: Record<string, string>,
  startTime: number,
): Promise<{ success: boolean; terminal?: boolean; reason?: string }> {
  const db = await getDb();
  const webhookRef = db.collection("webhookEvents").doc(eventId);

  try {
    // Transaction to ensure idempotency
    const result = await db.runTransaction(async (transaction) => {
      const webhookDoc = await transaction.get(webhookRef);

      if (!webhookDoc.exists) {
        // Event doesn't exist - this shouldn't happen
        throw new Error(`Webhook event ${eventId} not found`);
      }

      const webhookData = webhookDoc.data();
      if (!webhookData) {
        throw new Error(`No data for webhook event ${eventId}`);
      }

      // Check if already processed
      if (webhookData.status === "processed") {
        return {
          success: true,
          alreadyProcessed: true,
        };
      }

      // Increment attempts
      const attempts = (webhookData.attempts || 0) + 1;

      // Process based on event type
      let processingResult: Record<string, unknown>;

      if (eventType === "order.paid" || eventType === "ON_ORDER_COMPLETED") {
        processingResult = await processOrderEvent(
          eventData,
          attributes,
          transaction,
          eventId,
        );
      } else if (eventType.startsWith("subscription.")) {
        processingResult = await processSubscriptionEvent(
          eventData as Record<string, unknown>,
          eventType,
          attributes,
          transaction,
        );
      } else {
        // Unknown event type - terminal failure
        transaction.update(webhookRef, {
          status: "failed_terminal",
          failureReason: `Unknown event type: ${eventType}`,
          attempts,
          processedAt: Timestamp.now(),
        });

        return {
          success: false,
          terminal: true,
          reason: `Unknown event type: ${eventType}`,
        };
      }

      // Update webhook status
      transaction.update(webhookRef, {
        status: "processed",
        attempts,
        processedAt: Timestamp.now(),
        result: processingResult,
      });

      return {
        success: true,
        result: processingResult,
      };
    });

    const processingMs = Date.now() - startTime;

    if (result.alreadyProcessed) {
      structuredLog("INFO", "Event already processed - idempotent skip", {
        event_id: eventId,
        event_type: eventType,
        idempotent: true,
        processing_ms: processingMs,
        pipeline: "queue",
        ordering_key: attributes.ordering_key,
        delivery_attempt: attributes.delivery_attempt || "1",
      });
    } else {
      structuredLog("INFO", "Worker processed event successfully", {
        event_id: eventId,
        event_type: eventType,
        uid: attributes.uid,
        points: result.result?.pointsCredited,
        processing_ms: processingMs,
        pipeline: "queue",
        ordering_key: attributes.ordering_key,
        delivery_attempt: attributes.delivery_attempt || "1",
      });
    }

    return { success: true };
  } catch (error) {
    const processingMs = Date.now() - startTime;

    structuredLog("ERROR", "Worker processing failed", {
      event_id: eventId,
      event_type: eventType,
      error: error instanceof Error ? error.message : String(error),
      processing_ms: processingMs,
    });

    // Check if this is a terminal error
    const isTerminal =
      error instanceof Error &&
      (error.message.includes("Unknown product") ||
        error.message.includes("User not found") ||
        error.message.includes("Invalid"));

    return {
      success: false,
      terminal: isTerminal,
      reason: error instanceof Error ? error.message : "Processing failed",
    };
  }
}

// Process order events
async function processOrderEvent(
  eventData: unknown,
  attributes: Record<string, string>,
  transaction: FirebaseFirestore.Transaction,
  eventId: string,
) {
  const order = (eventData as Record<string, unknown>)?.order;
  if (!order) {
    throw new Error("Missing order data");
  }

  const uid = attributes.uid;
  if (!uid) {
    throw new Error("User not found for customer");
  }

  // Process each line item
  let totalPointsCredited = 0;
  const processedItems = [];

  for (const item of ((order as Record<string, unknown>).items as Record<
    string,
    unknown
  >[]) ||
    ((order as Record<string, unknown>).lines as Record<string, unknown>[]) ||
    []) {
    const productId = (item.productId as string) || (item.product_id as string);
    const quantity = Number(item.quantity) || 1;

    // Map product to points
    const points = await getPointsForProduct(productId);
    if (!points) {
      throw new Error(`Unknown product: ${productId}`);
    }

    const pointsToCredit = points * quantity;

    // Credit points using transaction
    await pointsService.creditPointsInTransaction(
      transaction,
      uid,
      pointsToCredit,
      {
        source: "paynow",
        eventId: attributes.event_id || eventId,
        orderId: (order as Record<string, unknown>).id as string,
        productId,
        quantity,
        unitPrice: item.price as string | undefined,
      },
    );

    totalPointsCredited += pointsToCredit;
    processedItems.push({
      productId,
      quantity,
      points: pointsToCredit,
    });
  }

  return {
    pointsCredited: totalPointsCredited,
    uid,
    orderId: (order as Record<string, unknown>).id as string,
    items: processedItems,
  };
}

// Process subscription events
async function processSubscriptionEvent(
  eventData: Record<string, unknown>,
  eventType: string,
  attributes: Record<string, string>,
  transaction: FirebaseFirestore.Transaction,
) {
  const subscription = eventData.subscription;
  if (!subscription) {
    throw new Error("Missing subscription data");
  }

  const uid = attributes.uid;
  if (!uid) {
    throw new Error("User not found for subscription");
  }

  // Handle subscription events
  if (
    eventType === "subscription.created" ||
    eventType === "subscription.renewed"
  ) {
    const result = await subscriptions.handleWebhookInTransaction(
      transaction,
      eventType,
      subscription as Record<string, unknown>,
      uid,
    );

    return {
      subscription: true,
      ...result,
    };
  }

  return {
    subscription: true,
    eventType,
    skipped: true,
  };
}

// Get points for a product ID
async function getPointsForProduct(productId: string): Promise<number | null> {
  // First check subscription plans
  const plan = await getSubscriptionPlan(productId);
  if (plan) {
    return plan.pointsPerCycle;
  }

  // Then check regular products via SKU mapping
  const config = await getConfig();
  const sku = Object.entries(config.paynow.products).find(
    ([_, id]) => id === productId,
  )?.[0];

  if (sku) {
    return (skuMap as unknown as Record<string, number>)[sku] || null;
  }

  return null;
}
