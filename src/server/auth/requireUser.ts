import { cookies, headers } from 'next/headers';
import { admin } from '../firebase/admin';

export type UserSession = {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

export async function requireUser(): Promise<UserSession> {
  const { auth } = admin();
  const h = await headers();
  const authz = h.get('authorization');
  const bearer = authz?.toLowerCase().startsWith('bearer ') ? authz.slice(7) : null;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebase-session')?.value;

  try {
    if (sessionCookie) {
      const d = await auth.verifySessionCookie(sessionCookie, true);
      return {
        uid: d.uid,
        email: d.email ?? null,
        name: (d as any).name ?? null,
        picture: (d as any).picture ?? null
      };
    }
    if (bearer) {
      const d = await auth.verifyIdToken(bearer, true);
      return {
        uid: d.uid,
        email: d.email ?? null,
        name: (d as any).name ?? null,
        picture: (d as any).picture ?? null
      };
    }
  } catch {}

  throw new Error('unauthorized');
}
