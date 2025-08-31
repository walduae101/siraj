"use client";
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

let app = getApps().length ? getApps()[0] : initializeApp({ ...(await (await fetch('/api/public-config')).json()).firebase });

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const r = await signInWithPopup(auth, provider);
  const t = await r.user.getIdToken(true);
  await fetch('/api/auth/session-login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken: t })
  });
  return r.user;
}

export async function signOutAll() {
  await fetch('/api/auth/session-logout', { method: 'POST' });
  await signOut(auth);
}
