import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "~/server/firebase/admin-lazy";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  sku: string; // PayNow SKU
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatePlanData {
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  sku: string;
  isActive?: boolean;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  price?: number;
  interval?: 'monthly' | 'yearly';
  features?: string[];
  sku?: string;
  isActive?: boolean;
}

// Plans Service
export class PlanService {
  async create(data: CreatePlanData): Promise<string> {
    const db = await getDb();
    const now = Timestamp.now();
    const plan: Omit<Plan, 'id'> = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('plans').add(plan);
    return docRef.id;
  }

  async getById(id: string): Promise<Plan | null> {
    const db = await getDb();
    const doc = await db.collection('plans').doc(id).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() } as Plan;
  }

  async getBySku(sku: string): Promise<Plan | null> {
    const db = await getDb();
    const snapshot = await db
      .collection('plans')
      .where('sku', '==', sku)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    if (!doc) return null;
    return { id: doc.id, ...doc.data() } as Plan;
  }

  async getAllActive(): Promise<Plan[]> {
    const db = await getDb();
    const snapshot = await db
      .collection('plans')
      .where('isActive', '==', true)
      .orderBy('price', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Plan);
  }

  async update(id: string, data: UpdatePlanData): Promise<void> {
    const db = await getDb();
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await db.collection('plans').doc(id).update(updateData);
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.collection('plans').doc(id).delete();
  }

  // Helper to get plan by name
  async getByName(name: string): Promise<Plan | null> {
    const db = await getDb();
    const snapshot = await db
      .collection('plans')
      .where('name', '==', name)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    if (!doc) return null;
    return { id: doc.id, ...doc.data() } as Plan;
  }
}

export const planService = new PlanService();
