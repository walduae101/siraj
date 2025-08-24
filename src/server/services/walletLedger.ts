import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";

export interface LedgerEntry {
  id: string;
  amount: number; // positive=credit, negative=debit
  balanceAfter: number; // computed in transaction
  currency: string; // "POINTS"
  kind:
    | "purchase"
    | "subscription_renewal"
    | "refund"
    | "chargeback"
    | "admin_adjustment"
    | "promo_credit"
    | "reconcile_adjustment";
  status: "posted" | "hold" | "reversed"; // PHASE 5: Risk holds
  source: {
    eventId?: string; // PayNow event id
    orderId?: string;
    paynowCustomerId?: string;
    productId?: string; // Firestore products id
    productVersion?: number;
    reversalOf?: string; // ledgerId of original entry (for refunds/chargebacks)
    reason?: string; // required for admin_adjustment
    riskEventId?: string; // PHASE 5: Link to risk event
  };
  createdAt: Timestamp;
  createdBy: string; // "system:webhook" | "admin:<uid>"
}

export interface WalletBalance {
  paidBalance: number;
  promoBalance: number;
  promoLots: Array<{
    id: string;
    amountRemaining: number;
    expiresAt: Timestamp;
    source: string;
  }>;
  updatedAt: Timestamp;
  v: number;
}

export class WalletLedgerService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Create a ledger entry and update wallet balance in a single transaction
   */
  static async createLedgerEntry(
    uid: string,
    entry: Omit<LedgerEntry, "id" | "balanceAfter" | "createdAt" | "createdBy">,
    createdBy: string,
  ): Promise<{ ledgerId: string; newBalance: number }> {
    const db = await WalletLedgerService.getDb();

    return await db.runTransaction(async (transaction) => {
      // Get current wallet balance
      const walletRef = db
        .collection("users")
        .doc(uid)
        .collection("wallet")
        .doc("points");
      const walletDoc = await transaction.get(walletRef);

      let currentBalance = 0;
      if (walletDoc.exists) {
        const walletData = walletDoc.data() as WalletBalance;
        currentBalance = walletData.paidBalance;
      }

      // Calculate new balance (only if status is "posted")
      const newBalance =
        entry.status === "posted"
          ? currentBalance + entry.amount
          : currentBalance;

      // Update wallet balance (only if status is "posted")
      if (entry.status === "posted") {
        const walletUpdate: Partial<WalletBalance> = {
          paidBalance: newBalance,
          updatedAt: Timestamp.now(),
        };

        if (!walletDoc.exists) {
          (walletUpdate as any).createdAt = Timestamp.now();
          (walletUpdate as any).promoBalance = 0;
          (walletUpdate as any).promoLots = [];
          (walletUpdate as any).v = 1;
        }

        transaction.set(walletRef, walletUpdate, { merge: true });
      }

      // Create ledger entry
      const ledgerRef = db
        .collection("users")
        .doc(uid)
        .collection("ledger")
        .doc();
      const ledgerEntry: LedgerEntry = {
        id: ledgerRef.id,
        ...entry,
        balanceAfter: newBalance,
        createdAt: Timestamp.now(),
        createdBy,
      };

      transaction.set(ledgerRef, ledgerEntry);

      return {
        ledgerId: ledgerRef.id,
        newBalance,
      };
    });
  }

  /**
   * Update ledger entry status (for risk holds)
   */
  static async updateLedgerEntryStatus(
    uid: string,
    ledgerId: string,
    newStatus: "posted" | "hold" | "reversed",
  ): Promise<void> {
    const db = await WalletLedgerService.getDb();

    return await db.runTransaction(async (transaction) => {
      // Get the ledger entry
      const ledgerRef = db
        .collection("users")
        .doc(uid)
        .collection("ledger")
        .doc(ledgerId);
      const ledgerDoc = await transaction.get(ledgerRef);

      if (!ledgerDoc.exists) {
        throw new Error(`Ledger entry ${ledgerId} not found`);
      }

      const ledgerData = ledgerDoc.data() as LedgerEntry;
      const oldStatus = ledgerData.status;

      // Update ledger entry status
      transaction.update(ledgerRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      // If changing from hold to posted, update wallet balance
      if (oldStatus === "hold" && newStatus === "posted") {
        const walletRef = db
          .collection("users")
          .doc(uid)
          .collection("wallet")
          .doc("points");
        const walletDoc = await transaction.get(walletRef);

        let currentBalance = 0;
        if (walletDoc.exists) {
          const walletData = walletDoc.data() as WalletBalance;
          currentBalance = walletData.paidBalance;
        }

        const newBalance = currentBalance + ledgerData.amount;

        transaction.update(walletRef, {
          paidBalance: newBalance,
          updatedAt: Timestamp.now(),
        });

        // Update balanceAfter in ledger entry
        transaction.update(ledgerRef, {
          balanceAfter: newBalance,
        });
      }

      // If changing from posted to reversed, update wallet balance
      if (oldStatus === "posted" && newStatus === "reversed") {
        const walletRef = db
          .collection("users")
          .doc(uid)
          .collection("wallet")
          .doc("points");
        const walletDoc = await transaction.get(walletRef);

        if (walletDoc.exists) {
          const walletData = walletDoc.data() as WalletBalance;
          const newBalance = walletData.paidBalance - ledgerData.amount;

          transaction.update(walletRef, {
            paidBalance: newBalance,
            updatedAt: Timestamp.now(),
          });

          // Update balanceAfter in ledger entry
          transaction.update(ledgerRef, {
            balanceAfter: newBalance,
          });
        }
      }
    });
  }

  /**
   * Get ledger entries for a user (paginated)
   */
  static async getLedgerEntries(
    uid: string,
    options: {
      limit?: number;
      startAfter?: string;
    } = {},
  ): Promise<{ entries: LedgerEntry[]; hasMore: boolean }> {
    const db = await WalletLedgerService.getDb();
    const { limit = 50, startAfter } = options;

    let query = db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .orderBy("createdAt", "desc")
      .limit(limit + 1); // +1 to check if there are more

    if (startAfter) {
      const startAfterDoc = await db
        .collection("users")
        .doc(uid)
        .collection("ledger")
        .doc(startAfter)
        .get();

      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const entries = snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LedgerEntry,
    );

    const hasMore = entries.length > limit;
    if (hasMore) {
      entries.pop(); // Remove the extra item
    }

    return { entries, hasMore };
  }

  /**
   * Get ledger entry by ID
   */
  static async getLedgerEntry(
    uid: string,
    ledgerId: string,
  ): Promise<LedgerEntry | null> {
    const db = await WalletLedgerService.getDb();

    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(ledgerId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as LedgerEntry;
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(uid: string): Promise<WalletBalance | null> {
    const db = await WalletLedgerService.getDb();

    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("wallet")
      .doc("points")
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      ...doc.data(),
    } as WalletBalance;
  }

  /**
   * Create a reversal entry (for refunds/chargebacks)
   */
  static async createReversalEntry(
    uid: string,
    originalLedgerId: string,
    kind: "refund" | "chargeback",
    createdBy: string,
    reason?: string,
  ): Promise<{ ledgerId: string; newBalance: number }> {
    const db = await WalletLedgerService.getDb();

    // Get the original entry
    const originalEntry = await WalletLedgerService.getLedgerEntry(
      uid,
      originalLedgerId,
    );
    if (!originalEntry) {
      throw new Error(`Original ledger entry not found: ${originalLedgerId}`);
    }

    // Create reversal entry
    const reversalEntry: Omit<
      LedgerEntry,
      "id" | "balanceAfter" | "createdAt" | "createdBy"
    > = {
      amount: -originalEntry.amount, // Reverse the amount
      currency: originalEntry.currency,
      kind,
      status: "posted",
      source: {
        ...originalEntry.source,
        reversalOf: originalLedgerId,
        reason,
      },
    };

    return await WalletLedgerService.createLedgerEntry(
      uid,
      reversalEntry,
      createdBy,
    );
  }

  /**
   * Create admin adjustment entry
   */
  static async createAdminAdjustment(
    uid: string,
    amount: number,
    reason: string,
    adminUid: string,
  ): Promise<{ ledgerId: string; newBalance: number }> {
    const entry: Omit<
      LedgerEntry,
      "id" | "balanceAfter" | "createdAt" | "createdBy"
    > = {
      amount,
      currency: "POINTS",
      kind: "admin_adjustment",
      status: "posted",
      source: {
        reason,
      },
    };

    return await WalletLedgerService.createLedgerEntry(
      uid,
      entry,
      `admin:${adminUid}`,
    );
  }

  /**
   * Get entries that have been reversed
   */
  static async getReversedEntries(uid: string): Promise<LedgerEntry[]> {
    const db = await WalletLedgerService.getDb();

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .where("source.reversalOf", "!=", null)
      .orderBy("source.reversalOf")
      .get();

    return snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LedgerEntry,
    );
  }

  /**
   * Get entries that are reversals of a specific entry
   */
  static async getReversalsOfEntry(
    uid: string,
    originalLedgerId: string,
  ): Promise<LedgerEntry[]> {
    const db = await WalletLedgerService.getDb();

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .where("source.reversalOf", "==", originalLedgerId)
      .get();

    return snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LedgerEntry,
    );
  }
}
