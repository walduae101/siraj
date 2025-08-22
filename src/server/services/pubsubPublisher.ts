import { PubSub } from "@google-cloud/pubsub";

// Initialize PubSub client with projectId
const pubsub = new PubSub({
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT || "walduae-project-20250809071906",
});

interface PublishEventOptions {
  eventId: string;
  eventType: string;
  orderId?: string;
  paynowCustomerId?: string;
  uid?: string;
  points?: number;
  data: Record<string, unknown>;
}

/**
 * Publishes a PayNow event to Pub/Sub for async processing
 * Uses ordering key to ensure serial processing per user
 */
export async function publishPaynowEvent(
  options: PublishEventOptions,
): Promise<string> {
  const { eventId, eventType, orderId, paynowCustomerId, uid, points, data } =
    options;

  // Determine ordering key - prefer uid, fallback to customer ID
  const orderingKey = uid || paynowCustomerId || "unknown";

  // Create message with minimal PII
  const message = {
    eventId,
    eventType,
    timestamp: new Date().toISOString(),
    data: {
      order: data.order
        ? {
            id: (data.order as Record<string, unknown>).id,
            prettyId: (data.order as Record<string, unknown>).pretty_id,
            customerId: ((data.order as Record<string, unknown>).customer as Record<string, unknown>)?.id,
            items: ((data.order as Record<string, unknown>).lines as Record<string, unknown>[])?.map((line: Record<string, unknown>) => ({
              productId: line.product_id,
              quantity: line.quantity,
              price: line.price,
            })),
          }
        : undefined,
    },
  };

  // Message attributes for filtering and routing
  const attributes: Record<string, string> = {
    event_id: eventId,
    event_type: eventType,
    ...(orderId && { order_id: orderId }),
    ...(paynowCustomerId && { paynow_customer_id: paynowCustomerId }),
    ...(uid && { uid }),
    ...(points && { points: points.toString() }),
    ordering_key: orderingKey,
  };

  const topic = pubsub.topic("paynow-events");

  // Publish with ordering key for serial processing
  const messageId = await topic.publishMessage({
    data: Buffer.from(JSON.stringify(message)),
    attributes,
    orderingKey,
  });

  console.log(
    `[pubsub] Published event ${eventId} with messageId ${messageId}`,
  );

  return messageId;
}

/**
 * Health check for Pub/Sub connectivity
 */
export async function checkPubSubHealth(): Promise<boolean> {
  try {
    const topic = pubsub.topic("paynow-events");
    const [exists] = await topic.exists();
    return exists;
  } catch (error) {
    console.error("[pubsub] Health check failed:", error);
    return false;
  }
}
