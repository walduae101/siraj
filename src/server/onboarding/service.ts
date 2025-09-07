import { getDb } from '~/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';

export type ChecklistItem = 'create_api_key' | 'call_ping' | 'upgrade_plan' | 'invite_member' | 'enable_2fa';
export type Checklist = Record<ChecklistItem, { done: boolean; ts?: Date }>;

const DEFAULT: Checklist = {
  create_api_key: { done: false },
  call_ping: { done: false },
  upgrade_plan: { done: false },
  invite_member: { done: false },
  enable_2fa: { done: false },
};

export interface OnboardingData {
  items: Checklist;
  startedAt: Date;
  completedAt?: Date;
  locale?: string;
}

export async function getChecklist(uid: string): Promise<OnboardingData> {
  const db = await getDb();
  const ref = db.collection('users').doc(uid).collection('meta').doc('onboarding');
  const snap = await ref.get();
  
  if (!snap.exists) {
    const now = Timestamp.now();
    const initialData = {
      items: DEFAULT,
      startedAt: now,
      locale: 'en',
    };
    
    await ref.set(initialData);
    
    return {
      items: DEFAULT,
      startedAt: now.toDate(),
      locale: 'en',
    };
  }
  
  const data = snap.data()!;
  return {
    items: data.items || DEFAULT,
    startedAt: data.startedAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate(),
    locale: data.locale || 'en',
  };
}

export async function setItemDone(uid: string, key: ChecklistItem): Promise<void> {
  const db = await getDb();
  const ref = db.collection('users').doc(uid).collection('meta').doc('onboarding');
  const now = Timestamp.now();
  
  await ref.update({
    [`items.${key}`]: {
      done: true,
      ts: now,
    },
  });
}

export async function maybeComplete(uid: string): Promise<boolean> {
  const db = await getDb();
  const ref = db.collection('users').doc(uid).collection('meta').doc('onboarding');
  const snap = await ref.get();
  
  if (!snap.exists) {
    return false;
  }
  
  const data = snap.data()!;
  const items = data.items || DEFAULT;
  const allDone = Object.values(items).every((item: any) => item?.done);
  
  if (allDone && !data.completedAt) {
    await ref.update({
      completedAt: Timestamp.now(),
    });
  }
  
  return allDone;
}

export async function updateLocale(uid: string, locale: string): Promise<void> {
  const db = await getDb();
  const ref = db.collection('users').doc(uid).collection('meta').doc('onboarding');
  
  await ref.update({
    locale,
  });
}

export async function resetOnboarding(uid: string): Promise<void> {
  const db = await getDb();
  const ref = db.collection('users').doc(uid).collection('meta').doc('onboarding');
  const now = Timestamp.now();
  
  await ref.set({
    items: DEFAULT,
    startedAt: now,
    locale: 'en',
  });
}
