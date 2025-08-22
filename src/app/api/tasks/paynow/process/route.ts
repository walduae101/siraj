import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getConfig, getProductId, getSubscriptionPlan } from "~/server/config";
import { db } from "~/server/firebase/admin";
import { pointsService } from "~/server/services/points";
import { subscriptions } from "~/server/services/subscriptions";
import { skuMap } from "~/server/services/skuMap";

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

    structuredLog("INFO", "Worker received message", {
      event_id: eventId,
      event_type: eventType,
      message_id: message.messageId,
      attributes,
    });

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
      let processingResult: any;

      if (eventType === "order.paid" || eventType === "ON_ORDER_COMPLETED") {
        processingResult = await processOrderEvent(
          eventData,
          attributes,
          transaction,
          eventId,
        );
      } else if (eventType.startsWith("subscription.")) {
        processingResult = await processSubscriptionEvent(
          eventData,
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
      });
    } else {
      structuredLog("INFO", "Worker processed event successfully", {
        event_id: eventId,
        event_type: eventType,
        uid: attributes.uid,
        points: result.result?.pointsCredited,
        processing_ms: processingMs,
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
  const order = (eventData as any)?.order;
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

  for (const item of order.items || order.lines || []) {
    const productId = item.productId || item.product_id;
    const quantity = item.quantity || 1;

    // Map product to points
    const points = await getPointsForProduct(productId);
    if (!points) {
      throw new Error(`Unknown product: ${productId}`);
    }

    const pointsToCredit = points * quantity;

    // Credit points using transaction
    await pointsService.creditPointsInTransaction(transaction, uid, pointsToCredit, {
      source: "paynow",
      eventId: attributes.event_id || eventId,
      orderId: order.id,
      productId,
      quantity,
      unitPrice: item.price,
    });

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
    orderId: order.id,
    items: processedItems,
  };
}

// Process subscription events
async function processSubscriptionEvent(
  eventData: any,
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
      subscription,
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
  const plan = getSubscriptionPlan(productId);
  if (plan) {
    return plan.pointsPerCycle;
  }

  // Then check regular products via SKU mapping
  const sku = Object.entries(getConfig().paynow.products).find(
    ([_, id]) => id === productId,
  )?.[0];

  if (sku) {
    return (skuMap as any)[sku] || null;
  }

  return null;
}
