import { getDb } from "~/server/firebase/admin";

export interface UsageCount {
  [feature: string]: number;
}

export interface UsageRecord {
  features: UsageCount;
  lastUpdated: Date;
}

export interface UsageLimit {
  [feature: string]: number;
}

// Plan limits table (seeded in code for now)
const PLAN_LIMITS: Record<string, UsageLimit> = {
  free: {
    'ai.generate': 10,
    'export.csv': 5,
    'export.pdf': 2,
    'api.calls': 100,
  },
  pro: {
    'ai.generate': 1000,
    'export.csv': 100,
    'export.pdf': 50,
    'api.calls': 10000,
  },
  org: {
    'ai.generate': 10000,
    'export.csv': 1000,
    'export.pdf': 500,
    'api.calls': 100000,
  },
};

export function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function bumpUsage(params: {
  uid?: string;
  orgId?: string;
  feature: string;
  by?: number;
}): Promise<void> {
  const { uid, orgId, feature, by = 1 } = params;
  
  if (!uid && !orgId) {
    throw new Error('Either uid or orgId must be provided');
  }

  const db = await getDb();
  const day = getTodayKey();
  const entityId = uid || orgId!;
  const entityType = uid ? 'users' : 'orgs';
  
  const docRef = db.collection('usage').doc(day).collection(entityType).doc(entityId);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    
    if (doc.exists) {
      const data = doc.data() as UsageRecord;
      const currentCount = data.features[feature] || 0;
      
      transaction.update(docRef, {
        [`features.${feature}`]: currentCount + by,
        lastUpdated: new Date(),
      });
    } else {
      transaction.set(docRef, {
        features: { [feature]: by },
        lastUpdated: new Date(),
      });
    }
  });
}

export async function getUsage(params: {
  uid?: string;
  orgId?: string;
  day?: string;
}): Promise<UsageRecord | null> {
  const { uid, orgId, day = getTodayKey() } = params;
  
  if (!uid && !orgId) {
    throw new Error('Either uid or orgId must be provided');
  }

  const db = await getDb();
  const entityId = uid || orgId!;
  const entityType = uid ? 'users' : 'orgs';
  
  const docRef = db.collection('usage').doc(day).collection(entityType).doc(entityId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as UsageRecord;
}

export function getLimitFor(plan: string, feature: string): number {
  return PLAN_LIMITS[plan]?.[feature] || 0;
}

export function getRemainingUsage(
  used: number,
  plan: string,
  feature: string
): number {
  const limit = getLimitFor(plan, feature);
  return Math.max(0, limit - used);
}

export function isLimitExceeded(
  used: number,
  plan: string,
  feature: string
): boolean {
  const limit = getLimitFor(plan, feature);
  return used >= limit;
}