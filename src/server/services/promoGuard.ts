import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { getConfig } from "~/server/config";

export interface PromoCode {
  id: string;
  codeHash: string; // Hashed version of the code
  salt: string; // Salt used for hashing
  points: number;
  usageLimit: number;
  usedBy: string[]; // Array of UIDs who have used this code
  expiresAt: Timestamp;
  minAccountAgeMinutes: number;
  maxPerUser: number;
  maxPerIpPerDay: number;
  createdAt: Timestamp;
  createdBy: string;
  active: boolean;
}

export interface PromoUsage {
  uid: string;
  promoId: string;
  usedAt: Timestamp;
  ip: string;
  userAgent?: string;
}

export interface PromoRedeemRequest {
  uid: string;
  promoCode: string;
  ip: string;
  userAgent?: string;
}

export interface PromoRedeemResult {
  success: boolean;
  points?: number;
  error?: string;
  promoId?: string;
  usageId?: string;
}

export class PromoGuardService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Hash a promo code with salt
   */
  private static hashCode(code: string, salt: string): string {
    return crypto.createHash("sha256").update(code + salt).digest("hex");
  }

  /**
   * Generate a random salt
   */
  private static generateSalt(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Create a new promo code
   */
  static async createPromoCode(
    code: string,
    points: number,
    options: {
      usageLimit?: number;
      expiresAt?: Date;
      minAccountAgeMinutes?: number;
      maxPerUser?: number;
      maxPerIpPerDay?: number;
      createdBy: string;
    }
  ): Promise<string> {
    const db = await this.getDb();
    const salt = this.generateSalt();
    const codeHash = this.hashCode(code, salt);

    const promoCode: Omit<PromoCode, "id"> = {
      codeHash,
      salt,
      points,
      usageLimit: options.usageLimit || 1,
      usedBy: [],
      expiresAt: Timestamp.fromDate(options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days default
      minAccountAgeMinutes: options.minAccountAgeMinutes || 0,
      maxPerUser: options.maxPerUser || 1,
      maxPerIpPerDay: options.maxPerIpPerDay || 3,
      createdAt: Timestamp.now(),
      createdBy: options.createdBy,
      active: true,
    };

    const promoRef = db.collection("promoCodes").doc();
    await promoRef.set(promoCode);

    // Log promo code creation
    console.log("[promo-guard] Promo code created", {
      component: "promo_guard",
      promo_id: promoRef.id,
      points,
      usage_limit: promoCode.usageLimit,
      expires_at: promoCode.expiresAt.toDate().toISOString(),
      created_by: options.createdBy,
    });

    return promoRef.id;
  }

  /**
   * Redeem a promo code
   */
  static async redeemPromoCode(request: PromoRedeemRequest): Promise<PromoRedeemResult> {
    const db = await this.getDb();
    const config = getConfig();

    try {
      // Find promo code by hash
      const promoSnapshot = await db
        .collection("promoCodes")
        .where("active", "==", true)
        .get();

      let promoCode: PromoCode | null = null;
      let promoId: string | null = null;

      // Check each promo code (in production, use a more efficient lookup)
      for (const doc of promoSnapshot.docs) {
        const data = doc.data() as PromoCode;
        const codeHash = this.hashCode(request.promoCode, data.salt);
        
        if (codeHash === data.codeHash) {
          promoCode = data;
          promoId = doc.id;
          break;
        }
      }

      if (!promoCode || !promoId) {
        return {
          success: false,
          error: "Invalid promo code",
        };
      }

      // Check if promo code is expired
      if (promoCode.expiresAt.toMillis() < Date.now()) {
        return {
          success: false,
          error: "Promo code has expired",
        };
      }

      // Check usage limit
      if (promoCode.usedBy.length >= promoCode.usageLimit) {
        return {
          success: false,
          error: "Promo code usage limit reached",
        };
      }

      // Check if user already used this code
      if (promoCode.usedBy.includes(request.uid)) {
        return {
          success: false,
          error: "You have already used this promo code",
        };
      }

      // Check account age requirement
      if (promoCode.minAccountAgeMinutes > 0) {
        const accountAge = await this.getAccountAge(request.uid);
        if (accountAge < promoCode.minAccountAgeMinutes) {
          return {
            success: false,
            error: `Account must be at least ${promoCode.minAccountAgeMinutes} minutes old`,
          };
        }
      }

      // Check per-user limit
      const userPromoCount = await this.getUserPromoCount(request.uid, promoId);
      if (userPromoCount >= promoCode.maxPerUser) {
        return {
          success: false,
          error: `Maximum ${promoCode.maxPerUser} uses per user reached`,
        };
      }

      // Check per-IP limit
      const ipPromoCount = await this.getIpPromoCount(request.ip, promoId);
      if (ipPromoCount >= promoCode.maxPerIpPerDay) {
        return {
          success: false,
          error: `Maximum ${promoCode.maxPerIpPerDay} uses per IP per day reached`,
        };
      }

      // All checks passed - redeem the code
      return await db.runTransaction(async (transaction) => {
        // Double-check usage limit in transaction
        const promoRef = db.collection("promoCodes").doc(promoId);
        const promoDoc = await transaction.get(promoRef);
        
        if (!promoDoc.exists) {
          throw new Error("Promo code not found");
        }

        const currentPromo = promoDoc.data() as PromoCode;
        
        if (currentPromo.usedBy.length >= currentPromo.usageLimit) {
          throw new Error("Usage limit reached");
        }

        if (currentPromo.usedBy.includes(request.uid)) {
          throw new Error("Already used by this user");
        }

        // Update promo code usage
        transaction.update(promoRef, {
          usedBy: [...currentPromo.usedBy, request.uid],
        });

        // Create usage record
        const usageRef = db.collection("promoUsages").doc();
        const usage: PromoUsage = {
          uid: request.uid,
          promoId,
          usedAt: Timestamp.now(),
          ip: request.ip,
          userAgent: request.userAgent,
        };
        transaction.set(usageRef, usage);

        // Log successful redemption
        console.log("[promo-guard] Promo code redeemed", {
          component: "promo_guard",
          promo_id: promoId,
          uid: request.uid,
          points: promoCode.points,
          ip: request.ip,
        });

        return {
          success: true,
          points: promoCode.points,
          promoId,
          usageId: usageRef.id,
        };
      });

    } catch (error) {
      console.error("[promo-guard] Error redeeming promo code", {
        component: "promo_guard",
        uid: request.uid,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: "Failed to redeem promo code",
      };
    }
  }

  /**
   * Get account age in minutes
   */
  private static async getAccountAge(uid: string): Promise<number> {
    const db = await this.getDb();
    
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return 0;
    }

    const data = userDoc.data();
    const createdAt = data?.createdAt;
    if (!createdAt) {
      return 0;
    }

    const now = Timestamp.now();
    const ageMs = now.toMillis() - createdAt.toMillis();
    return Math.floor(ageMs / (60 * 1000)); // Convert to minutes
  }

  /**
   * Get user's usage count for a specific promo code
   */
  private static async getUserPromoCount(uid: string, promoId: string): Promise<number> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("promoUsages")
      .where("uid", "==", uid)
      .where("promoId", "==", promoId)
      .get();

    return snapshot.docs.length;
  }

  /**
   * Get IP's usage count for a specific promo code in the last 24 hours
   */
  private static async getIpPromoCount(ip: string, promoId: string): Promise<number> {
    const db = await this.getDb();
    const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    
    const snapshot = await db
      .collection("promoUsages")
      .where("ip", "==", ip)
      .where("promoId", "==", promoId)
      .where("usedAt", ">=", oneDayAgo)
      .get();

    return snapshot.docs.length;
  }

  /**
   * Get promo code statistics
   */
  static async getPromoStatistics(): Promise<{
    totalCodes: number;
    activeCodes: number;
    totalRedemptions: number;
    topUsedCodes: Array<{ promoId: string; usageCount: number }>;
  }> {
    const db = await this.getDb();
    
    // Get total codes
    const totalCodesSnapshot = await db.collection("promoCodes").get();
    const activeCodesSnapshot = await db
      .collection("promoCodes")
      .where("active", "==", true)
      .get();

    // Get total redemptions
    const totalRedemptionsSnapshot = await db.collection("promoUsages").get();

    // Get top used codes
    const usageCounts: Record<string, number> = {};
    totalRedemptionsSnapshot.docs.forEach(doc => {
      const data = doc.data() as PromoUsage;
      usageCounts[data.promoId] = (usageCounts[data.promoId] || 0) + 1;
    });

    const topUsedCodes = Object.entries(usageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([promoId, usageCount]) => ({ promoId, usageCount }));

    return {
      totalCodes: totalCodesSnapshot.docs.length,
      activeCodes: activeCodesSnapshot.docs.length,
      totalRedemptions: totalRedemptionsSnapshot.docs.length,
      topUsedCodes,
    };
  }

  /**
   * Deactivate a promo code
   */
  static async deactivatePromoCode(promoId: string, deactivatedBy: string): Promise<void> {
    const db = await this.getDb();
    
    await db.collection("promoCodes").doc(promoId).update({
      active: false,
      deactivatedAt: Timestamp.now(),
      deactivatedBy,
    });

    console.log("[promo-guard] Promo code deactivated", {
      component: "promo_guard",
      promo_id: promoId,
      deactivated_by: deactivatedBy,
    });
  }

  /**
   * Get promo code usage history
   */
  static async getPromoUsageHistory(promoId: string): Promise<PromoUsage[]> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("promoUsages")
      .where("promoId", "==", promoId)
      .orderBy("usedAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
    } as PromoUsage));
  }
}
