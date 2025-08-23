import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";
import { getConfig } from "~/server/config";

export interface Product {
  id: string;
  title: string;
  type: "one_time" | "subscription";
  points: number;
  priceUSD: number;
  paynowProductId: string;
  active: boolean;
  version: number;
  effectiveFrom?: Timestamp;
  effectiveTo?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  metadata?: Record<string, unknown>;
}

export interface Promotion {
  id: string;
  code: string;
  discountPercent?: number;
  bonusPoints?: number;
  appliesTo: string[] | "*";
  active: boolean;
  usageLimit: number;
  usageCount: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  terms: string;
}

export class ProductCatalogService {
  private static async getDb() {
    return getDb();
  }

  /**
   * Get product by PayNow product ID (latest active version)
   */
  static async getProductByPayNowId(paynowProductId: string): Promise<Product | null> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("products")
      .where("paynowProductId", "==", paynowProductId)
      .where("active", "==", true)
      .orderBy("version", "desc")
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
    } as Product;
  }

  /**
   * Get product by internal ID
   */
  static async getProductById(productId: string): Promise<Product | null> {
    const db = await this.getDb();
    
    const doc = await db.collection("products").doc(productId).get();
    
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  }

  /**
   * Get all active products
   */
  static async getActiveProducts(): Promise<Product[]> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("products")
      .where("active", "==", true)
      .orderBy("effectiveFrom", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  }

  /**
   * Create or update a product
   */
  static async upsertProduct(
    productData: Omit<Product, "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> & { id?: string },
    userId: string
  ): Promise<Product> {
    const db = await this.getDb();
    const now = Timestamp.now();

    // If updating existing product, increment version
    if (productData.id) {
      const existing = await this.getProductById(productData.id);
      if (existing) {
        productData.version = existing.version + 1;
      }
    }

    const { id: _, ...productDataWithoutId } = productData;
    const productDoc = {
      ...productDataWithoutId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const docRef = await db.collection("products").add(productDoc);
    
    return {
      id: docRef.id,
      ...productDoc,
    } as Product;
  }

  /**
   * Get promotion by code
   */
  static async getPromotionByCode(code: string): Promise<Promotion | null> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("promotions")
      .where("code", "==", code.toUpperCase())
      .where("active", "==", true)
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
    } as Promotion;
  }

  /**
   * Get all active promotions
   */
  static async getActivePromotions(): Promise<Promotion[]> {
    const db = await this.getDb();
    
    const snapshot = await db
      .collection("promotions")
      .where("active", "==", true)
      .orderBy("startsAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Promotion));
  }

  /**
   * Create or update a promotion
   */
  static async upsertPromotion(
    promotionData: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<Promotion> {
    const db = await this.getDb();
    const now = Timestamp.now();

    const promotionDoc = {
      ...promotionData,
      code: promotionData.code.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("promotions").add(promotionDoc);
    
    return {
      id: docRef.id,
      ...promotionDoc,
    } as Promotion;
  }

  /**
   * Fallback to GSM product mapping (for backward compatibility)
   */
  static getProductFromGSM(paynowProductId: string): { points: number; source: "gsm" } | null {
    const cfg = getConfig();
    const points = cfg.paynow.products[paynowProductId];
    
    if (points) {
      return {
        points: Number(points),
        source: "gsm" as const,
      };
    }
    
    return null;
  }
}
