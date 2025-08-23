import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";

export interface ReconciliationReport {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD format
  walletBefore: number;
  walletAfter: number;
  ledgerSum: number;
  delta: number;
  ledgerCount: number;
  status: "clean" | "adjusted" | "error";
  error?: string;
  createdAt: Timestamp;
  checksum: string;
}

export interface ReconciliationAdjustment {
  amount: number; // The delta to apply
  reason: string;
  source: "recon";
  reportId: string;
}

export class ReconciliationService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Compute the invariant: wallet.points === sum(ledger.amount)
   */
  static async computeWalletInvariant(uid: string): Promise<{
    walletBalance: number;
    ledgerSum: number;
    ledgerCount: number;
    delta: number;
  }> {
    const db = await this.getDb();

    // Get current wallet balance
    const walletDoc = await db
      .collection("users")
      .doc(uid)
      .collection("wallet")
      .doc("points")
      .get();

    const walletBalance = walletDoc.exists
      ? walletDoc.data()?.paidBalance || 0
      : 0;

    // Sum all ledger entries
    const ledgerSnapshot = await db
      .collectionGroup("ledger")
      .where("__name__", ">=", `users/${uid}/ledger/`)
      .where("__name__", "<", `users/${uid}/ledger/\uf8ff`)
      .get();

    let ledgerSum = 0;
    let ledgerCount = 0;

    for (const doc of ledgerSnapshot.docs) {
      const data = doc.data();
      if (data.amount !== undefined) {
        ledgerSum += data.amount;
        ledgerCount++;
      }
    }

    const delta = walletBalance - ledgerSum;

    return {
      walletBalance,
      ledgerSum,
      ledgerCount,
      delta,
    };
  }

  /**
   * Reconcile a single user's wallet and create adjustment if needed
   */
  static async reconcileUser(
    uid: string,
    date: string,
  ): Promise<ReconciliationReport> {
    const db = await this.getDb();
    const reportId = `${date}_${uid}`;

    try {
      // Compute invariant
      const invariant = await this.computeWalletInvariant(uid);
      const { walletBalance, ledgerSum, ledgerCount, delta } = invariant;

      // Determine status
      const status = Math.abs(delta) < 0.01 ? "clean" : "adjusted";

      // If there's a significant delta, create adjustment
      if (Math.abs(delta) >= 0.01) {
        await this.createReconciliationAdjustment(uid, -delta, reportId);
      }

      // Create reconciliation report
      const report: Omit<ReconciliationReport, "id"> = {
        uid,
        date,
        walletBefore: walletBalance,
        walletAfter: walletBalance + (status === "adjusted" ? -delta : 0),
        ledgerSum,
        delta,
        ledgerCount,
        status,
        createdAt: Timestamp.now(),
        checksum: this.computeChecksum(invariant),
      };

      const reportRef = db
        .collection("reconciliationReports")
        .doc(date)
        .collection("users")
        .doc(uid);

      await reportRef.set(report);

      // Log structured event
      console.log("[reconciliation] User reconciled", {
        component: "recon",
        uid,
        delta,
        wallet_before: walletBalance,
        wallet_after: report.walletAfter,
        ledger_count: ledgerCount,
        report_id: reportId,
        status,
      });

      return {
        id: reportId,
        ...report,
      };
    } catch (error) {
      const errorReport: Omit<ReconciliationReport, "id"> = {
        uid,
        date,
        walletBefore: 0,
        walletAfter: 0,
        ledgerSum: 0,
        delta: 0,
        ledgerCount: 0,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        createdAt: Timestamp.now(),
        checksum: "",
      };

      // Log error
      console.error("[reconciliation] Error reconciling user", {
        component: "recon",
        uid,
        report_id: reportId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        id: reportId,
        ...errorReport,
      };
    }
  }

  /**
   * Create a reconciliation adjustment entry
   */
  private static async createReconciliationAdjustment(
    uid: string,
    delta: number,
    reportId: string,
  ): Promise<void> {
    const db = await this.getDb();

    await db.runTransaction(async (transaction) => {
      // Get current wallet
      const walletRef = db
        .collection("users")
        .doc(uid)
        .collection("wallet")
        .doc("points");

      const walletDoc = await transaction.get(walletRef);
      const currentBalance = walletDoc.exists
        ? walletDoc.data()?.paidBalance || 0
        : 0;

      const newBalance = currentBalance + delta;

      // Update wallet
      const walletUpdate: any = {
        paidBalance: newBalance,
        updatedAt: Timestamp.now(),
      };

      if (!walletDoc.exists) {
        walletUpdate.createdAt = Timestamp.now();
        walletUpdate.promoBalance = 0;
        walletUpdate.promoLots = [];
        walletUpdate.v = 1;
      }

      transaction.set(walletRef, walletUpdate, { merge: true });

      // Create ledger entry
      const ledgerRef = db
        .collection("users")
        .doc(uid)
        .collection("ledger")
        .doc();

      const ledgerEntry = {
        id: ledgerRef.id,
        amount: delta,
        balanceAfter: newBalance,
        currency: "POINTS",
        kind: "reconcile_adjustment" as const,
        status: "posted" as const,
        source: {
          reason: `Reconciliation adjustment: ${delta > 0 ? "credit" : "debit"} ${Math.abs(delta)} points`,
          reportId,
        },
        createdAt: Timestamp.now(),
        createdBy: "system:reconciliation",
      };

      transaction.set(ledgerRef, ledgerEntry);
    });
  }

  /**
   * Reconcile all users (for daily job)
   */
  static async reconcileAllUsers(date: string): Promise<{
    total: number;
    clean: number;
    adjusted: number;
    errors: number;
    totalDelta: number;
  }> {
    const db = await this.getDb();

    // Get all users with wallets
    const walletSnapshot = await db
      .collectionGroup("wallet")
      .where("__name__", "==", "points")
      .get();

    const results = {
      total: 0,
      clean: 0,
      adjusted: 0,
      errors: 0,
      totalDelta: 0,
    };

    for (const doc of walletSnapshot.docs) {
      const uid = doc.ref.parent.parent?.id;
      if (!uid) continue;

      results.total++;
      const report = await this.reconcileUser(uid, date);

      switch (report.status) {
        case "clean":
          results.clean++;
          break;
        case "adjusted":
          results.adjusted++;
          results.totalDelta += Math.abs(report.delta);
          break;
        case "error":
          results.errors++;
          break;
      }
    }

    // Log summary
    console.log("[reconciliation] Daily reconciliation complete", {
      component: "recon",
      date,
      total_users: results.total,
      clean_users: results.clean,
      adjusted_users: results.adjusted,
      error_users: results.errors,
      total_delta: results.totalDelta,
    });

    return results;
  }

  /**
   * Get reconciliation reports for a date range
   */
  static async getReconciliationReports(
    startDate: string,
    endDate: string,
  ): Promise<ReconciliationReport[]> {
    const db = await this.getDb();
    const reports: ReconciliationReport[] = [];

    // Iterate through date range
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0]!;

      const snapshot = await db
        .collection("reconciliationReports")
        .doc(dateStr)
        .collection("users")
        .get();

      for (const doc of snapshot.docs) {
        reports.push({
          id: doc.id,
          ...doc.data(),
        } as ReconciliationReport);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reports;
  }

  /**
   * Compute checksum for reconciliation data
   */
  private static computeChecksum(data: {
    walletBalance: number;
    ledgerSum: number;
    ledgerCount: number;
    delta: number;
  }): string {
    const str = `${data.walletBalance}|${data.ledgerSum}|${data.ledgerCount}|${data.delta}`;
    // Simple hash for integrity checking
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
