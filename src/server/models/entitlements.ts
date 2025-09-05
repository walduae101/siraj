import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";

export type EntitlementType = 'SUBSCRIPTION' | 'POINTS';
export type EntitlementStatus = 'active' | 'canceled' | 'past_due';
export type EntitlementSource = 'purchase' | 'grant' | 'promo';

export interface Entitlement {
  id: string;
  type: EntitlementType;
  planId?: string;            // for SUBSCRIPTION
  status?: EntitlementStatus; // for SUBSCRIPTION
  points?: number;            // for POINTS
  source: EntitlementSource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;      // subscriptions
  ttl?: Timestamp;            // housekeeping
  txnRef?: string;            // PayNow ref
  orgId?: string;             // if purchased for org
  userId?: string;            // if purchased for user
}

export interface CreateEntitlementData {
  type: EntitlementType;
  planId?: string;
  status?: EntitlementStatus;
  points?: number;
  source: EntitlementSource;
  expiresAt?: Timestamp;
  txnRef?: string;
  orgId?: string;
  userId?: string;
}

export interface UpdateEntitlementData {
  status?: EntitlementStatus;
  points?: number;
  expiresAt?: Timestamp;
  ttl?: Timestamp;
}

// CRUD Operations
export class EntitlementService {
  async create(data: CreateEntitlementData): Promise<string> {
    const db = await getDb();
    const now = Timestamp.now();
    const entitlement: Omit<Entitlement, 'id'> = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('entitlements').add(entitlement);
    return docRef.id;
  }

  async getById(id: string): Promise<Entitlement | null> {
    const db = await getDb();
    const doc = await db.collection('entitlements').doc(id).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() } as Entitlement;
  }

  async getByUser(userId: string): Promise<Entitlement[]> {
    const db = await getDb();
    const snapshot = await db
      .collection('entitlements')
      .where('userId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Entitlement);
  }

  async getByOrg(orgId: string): Promise<Entitlement[]> {
    const db = await getDb();
    const snapshot = await db
      .collection('entitlements')
      .where('orgId', '==', orgId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Entitlement);
  }

  async update(id: string, data: UpdateEntitlementData): Promise<void> {
    const db = await getDb();
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await db.collection('entitlements').doc(id).update(updateData);
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.collection('entitlements').doc(id).delete();
  }

  // Helper to get effective plan for user/org
  async getEffectivePlan(userId?: string, orgId?: string): Promise<Entitlement | null> {
    if (orgId) {
      // Check org entitlements first
      const orgEntitlements = await this.getByOrg(orgId);
      const activeOrgSub = orgEntitlements.find(e => 
        e.type === 'SUBSCRIPTION' && e.status === 'active' && e.expiresAt && e.expiresAt.toDate() > new Date()
      );
      if (activeOrgSub) return activeOrgSub;
    }

    if (userId) {
      // Fall back to user entitlements
      const userEntitlements = await this.getByUser(userId);
      const activeUserSub = userEntitlements.find(e => 
        e.type === 'SUBSCRIPTION' && e.status === 'active' && e.expiresAt && e.expiresAt.toDate() > new Date()
      );
      if (activeUserSub) return activeUserSub;
    }

    return null;
  }

  // Helper to get current points balance
  async getPointsBalance(userId?: string, orgId?: string): Promise<number> {
    let totalPoints = 0;
    
    if (orgId) {
      const orgEntitlements = await this.getByOrg(orgId);
      totalPoints += orgEntitlements
        .filter(e => e.type === 'POINTS' && e.points)
        .reduce((sum, e) => sum + (e.points || 0), 0);
    }

    if (userId) {
      const userEntitlements = await this.getByUser(userId);
      totalPoints += userEntitlements
        .filter(e => e.type === 'POINTS' && e.points)
        .reduce((sum, e) => sum + (e.points || 0), 0);
    }

    return totalPoints;
  }
}

export const entitlementService = new EntitlementService();
