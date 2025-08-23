import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { WalletLedgerService } from "./walletLedger";
import { ProductCatalogService } from "./productCatalog";

export interface DataMigration {
  id: string;
  type: "webhook_replay" | "refund_reversal" | "chargeback_reversal";
  status: "pending" | "running" | "completed" | "failed";
  startDate: string;
  endDate: string;
  processedCount: number;
  errorCount: number;
  totalCount: number;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface BackfillOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dryRun?: boolean;
  maxEvents?: number;
}

export class BackfillService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Replay missing webhook events from a date range
   */
  static async replayWebhookEvents(options: BackfillOptions): Promise<{
    migrationId: string;
    processed: number;
    errors: number;
    total: number;
  }> {
    const db = await this.getDb();
    const migrationId = `webhook_replay_${Date.now()}`;

    // Create migration record
    const migration: Omit<DataMigration, "id"> = {
      type: "webhook_replay",
      status: "running",
      startDate: options.startDate,
      endDate: options.endDate,
      processedCount: 0,
      errorCount: 0,
      totalCount: 0,
      createdAt: Timestamp.now(),
      metadata: {
        dryRun: options.dryRun,
        maxEvents: options.maxEvents,
      },
    };

    const migrationRef = db.collection("dataMigrations").doc(migrationId);
    await migrationRef.set(migration);

    try {
      // Get webhook events in date range
      const startTimestamp = Timestamp.fromDate(new Date(options.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(options.endDate + "T23:59:59"));

      const eventsSnapshot = await db
        .collection("webhookEvents")
        .where("createdAt", ">=", startTimestamp)
        .where("createdAt", "<=", endTimestamp)
        .where("processedAt", "==", null) // Only unprocessed events
        .orderBy("createdAt", "asc")
        .limit(options.maxEvents || 1000)
        .get();

      const events = eventsSnapshot.docs;
      let processed = 0;
      let errors = 0;

      console.log("[backfill] Starting webhook replay", {
        component: "backfill",
        migration_id: migrationId,
        event_count: events.length,
        start_date: options.startDate,
        end_date: options.endDate,
        dry_run: options.dryRun,
      });

      for (const eventDoc of events) {
        try {
          const eventData = eventDoc.data();
          
          if (options.dryRun) {
            // Just mark as processed in dry run
            await eventDoc.ref.update({
              processedAt: Timestamp.now(),
              dryRunProcessed: true,
            });
            processed++;
          } else {
            // Process the webhook event
            await this.processWebhookEvent(eventData, eventDoc.id);
            processed++;
          }

          // Update migration progress
          await migrationRef.update({
            processedCount: processed,
            errorCount: errors,
            totalCount: events.length,
          });

        } catch (error) {
          errors++;
          console.error("[backfill] Error processing webhook event", {
            component: "backfill",
            migration_id: migrationId,
            event_id: eventDoc.id,
            error: error instanceof Error ? error.message : String(error),
          });

          // Update migration progress
          await migrationRef.update({
            errorCount: errors,
          });
        }
      }

      // Mark migration as completed
      await migrationRef.update({
        status: "completed",
        completedAt: Timestamp.now(),
        processedCount: processed,
        errorCount: errors,
        totalCount: events.length,
      });

      console.log("[backfill] Webhook replay completed", {
        component: "backfill",
        migration_id: migrationId,
        processed,
        errors,
        total: events.length,
      });

      return {
        migrationId,
        processed,
        errors,
        total: events.length,
      };

    } catch (error) {
      // Mark migration as failed
      await migrationRef.update({
        status: "failed",
        completedAt: Timestamp.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Process a single webhook event (similar to live webhook processing)
   */
  private static async processWebhookEvent(eventData: any, eventId: string): Promise<void> {
    const db = await this.getDb();

    // Check if already processed
    if (eventData.processedAt) {
      return;
    }

    // Process based on event type
    switch (eventData.eventType) {
      case "ON_ORDER_COMPLETED":
      case "ON_DELIVERY_ITEM_ADDED":
        await this.processPurchaseEvent(eventData, eventId);
        break;
      case "ON_REFUND":
        await this.processRefundEvent(eventData, eventId);
        break;
      case "ON_CHARGEBACK":
        await this.processChargebackEvent(eventData, eventId);
        break;
      default:
        console.warn("[backfill] Unknown event type", {
          component: "backfill",
          event_id: eventId,
          event_type: eventData.eventType,
        });
    }

    // Mark as processed
    await db.collection("webhookEvents").doc(eventId).update({
      processedAt: Timestamp.now(),
      backfilledAt: Timestamp.now(),
    });
  }

  /**
   * Process a purchase event
   */
  private static async processPurchaseEvent(eventData: any, eventId: string): Promise<void> {
    const { uid, productId, quantity = 1 } = eventData;

    if (!uid || !productId) {
      throw new Error("Missing uid or productId in purchase event");
    }

    // Get product from catalog
    const product = await ProductCatalogService.getProductByPayNowId(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const points = product.points * quantity;

    // Create ledger entry
    await WalletLedgerService.createLedgerEntry(
      uid,
      {
        amount: points,
        currency: "POINTS",
        kind: "purchase",
        status: "posted",
        source: {
          eventId,
          orderId: eventData.orderId,
          paynowCustomerId: eventData.customerId,
          productId: product.id,
          productVersion: product.version,
        },
      },
      "system:backfill"
    );

    console.log("[backfill] Processed purchase event", {
      component: "backfill",
      event_id: eventId,
      uid,
      product_id: productId,
      points,
      quantity,
    });
  }

  /**
   * Process a refund event
   */
  private static async processRefundEvent(eventData: any, eventId: string): Promise<void> {
    await this.processReversalEvent(eventData, eventId, "refund");
  }

  /**
   * Process a chargeback event
   */
  private static async processChargebackEvent(eventData: any, eventId: string): Promise<void> {
    await this.processReversalEvent(eventData, eventId, "chargeback");
  }

  /**
   * Process a reversal event (refund or chargeback)
   */
  private static async processReversalEvent(
    eventData: any,
    eventId: string,
    kind: "refund" | "chargeback"
  ): Promise<void> {
    const { uid, orderId } = eventData;

    if (!uid || !orderId) {
      throw new Error(`Missing uid or orderId in ${kind} event`);
    }

    // Find the original purchase ledger entry
    const originalEntry = await this.findOriginalPurchaseEntry(uid, orderId);
    if (!originalEntry) {
      throw new Error(`Original purchase entry not found for order: ${orderId}`);
    }

    // Create reversal entry
    await WalletLedgerService.createReversalEntry(
      uid,
      originalEntry.id,
      kind,
      "system:backfill",
      `Backfill ${kind} for order ${orderId}`
    );

    console.log("[backfill] Processed reversal event", {
      component: "backfill",
      event_id: eventId,
      uid,
      order_id: orderId,
      kind,
      original_ledger_id: originalEntry.id,
    });
  }

  /**
   * Find the original purchase ledger entry for an order
   */
  private static async findOriginalPurchaseEntry(
    uid: string,
    orderId: string
  ): Promise<any> {
    const db = await this.getDb();

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .where("source.orderId", "==", orderId)
      .where("kind", "==", "purchase")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data(),
    } as any;
  }

  /**
   * Create reversal entries for refunds/chargebacks from a date range
   */
  static async createReversalEntries(options: BackfillOptions): Promise<{
    migrationId: string;
    processed: number;
    errors: number;
    total: number;
  }> {
    const db = await this.getDb();
    const migrationId = `reversal_backfill_${Date.now()}`;

    // Create migration record
    const migration: Omit<DataMigration, "id"> = {
      type: "refund_reversal", // Will be updated based on actual events
      status: "running",
      startDate: options.startDate,
      endDate: options.endDate,
      processedCount: 0,
      errorCount: 0,
      totalCount: 0,
      createdAt: Timestamp.now(),
      metadata: {
        dryRun: options.dryRun,
        maxEvents: options.maxEvents,
      },
    };

    const migrationRef = db.collection("dataMigrations").doc(migrationId);
    await migrationRef.set(migration);

    try {
      // Get refund/chargeback events in date range
      const startTimestamp = Timestamp.fromDate(new Date(options.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(options.endDate + "T23:59:59"));

      const eventsSnapshot = await db
        .collection("webhookEvents")
        .where("createdAt", ">=", startTimestamp)
        .where("createdAt", "<=", endTimestamp)
        .where("eventType", "in", ["ON_REFUND", "ON_CHARGEBACK"])
        .where("processedAt", "==", null)
        .orderBy("createdAt", "asc")
        .limit(options.maxEvents || 1000)
        .get();

      const events = eventsSnapshot.docs;
      let processed = 0;
      let errors = 0;

      console.log("[backfill] Starting reversal backfill", {
        component: "backfill",
        migration_id: migrationId,
        event_count: events.length,
        start_date: options.startDate,
        end_date: options.endDate,
        dry_run: options.dryRun,
      });

      for (const eventDoc of events) {
        try {
          const eventData = eventDoc.data();
          
          if (options.dryRun) {
            // Just mark as processed in dry run
            await eventDoc.ref.update({
              processedAt: Timestamp.now(),
              dryRunProcessed: true,
            });
            processed++;
          } else {
            // Process the reversal event
            const kind = eventData.eventType === "ON_REFUND" ? "refund" : "chargeback";
            await this.processReversalEvent(eventData, eventDoc.id, kind);
            processed++;
          }

          // Update migration progress
          await migrationRef.update({
            processedCount: processed,
            errorCount: errors,
            totalCount: events.length,
          });

        } catch (error) {
          errors++;
          console.error("[backfill] Error processing reversal event", {
            component: "backfill",
            migration_id: migrationId,
            event_id: eventDoc.id,
            error: error instanceof Error ? error.message : String(error),
          });

          // Update migration progress
          await migrationRef.update({
            errorCount: errors,
          });
        }
      }

      // Mark migration as completed
      await migrationRef.update({
        status: "completed",
        completedAt: Timestamp.now(),
        processedCount: processed,
        errorCount: errors,
        totalCount: events.length,
      });

      console.log("[backfill] Reversal backfill completed", {
        component: "backfill",
        migration_id: migrationId,
        processed,
        errors,
        total: events.length,
      });

      return {
        migrationId,
        processed,
        errors,
        total: events.length,
      };

    } catch (error) {
      // Mark migration as failed
      await migrationRef.update({
        status: "failed",
        completedAt: Timestamp.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Get data migration records
   */
  static async getDataMigrations(
    type?: string,
    limit: number = 50
  ): Promise<DataMigration[]> {
    const db = await this.getDb();

    let query = db.collection("dataMigrations").orderBy("createdAt", "desc").limit(limit);

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as DataMigration));
  }
}
