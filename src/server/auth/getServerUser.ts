import 'server-only';
import { cookies } from 'next/headers';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function admin() {
  if (!getApps().length) initializeApp({ credential: applicationDefault() });
  return { auth: getAuth() };
}

export async function getServerUser() {
  const session = cookies().get('firebase-session')?.value;
  if (!session) return null;
  const { auth } = admin();
  try {
    const decoded = await auth.verifySessionCookie(session, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded as any).name ?? null,
      picture: (decoded as any).picture ?? null,
    };
  } catch {
    return null;
  }
}
