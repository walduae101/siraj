import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let _inited = false;

export function admin() {
  if (!_inited) {
    initializeApp({ credential: applicationDefault() });
    _inited = true;
  }
  return { auth: getAuth(), db: getFirestore() };
}
