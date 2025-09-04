import { getServerUser } from './getServerUser';
import { db } from '~/server/firebase/admin';
import { doc, getDoc } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Hardcoded admin UIDs for initial setup (replace with your admin UIDs)
const HARDCODED_ADMINS = [
  'admin_user_123', // Replace with actual admin UID
  'super_admin_456', // Replace with actual super admin UID
];

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  // Check hardcoded admins first (for initial setup)
  if (HARDCODED_ADMINS.includes(user.uid)) {
    return {
      uid: user.uid,
      email: user.email || '',
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Check Firebase custom claims
  const customClaims = user.customClaims || {};
  if (customClaims.role === 'admin' || customClaims.role === 'super_admin') {
    return {
      uid: user.uid,
      email: user.email || '',
      role: customClaims.role,
      permissions: customClaims.permissions || ['read', 'write'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Check admins collection in Firestore
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid) as any);
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data() as AdminUser;
      return adminData;
    }
  } catch (error) {
    console.warn('Failed to check admins collection:', error);
  }

  throw new Error('Admin access required');
}

export async function isAdmin(uid: string): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function hasAdminPermission(permission: string): Promise<boolean> {
  try {
    const admin = await requireAdmin();
    return admin.permissions.includes(permission) || admin.role === 'super_admin';
  } catch {
    return false;
  }
}

// Middleware helper for API routes
export function withAdminAuth<T extends any[]>(
  handler: (admin: AdminUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const admin = await requireAdmin();
      return await handler(admin, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin access required';
      return new Response(
        JSON.stringify({ error: message }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

// Helper for setting admin custom claims (run this once for each admin)
export async function setAdminClaims(uid: string, role: 'admin' | 'super_admin', permissions: string[] = ['read', 'write', 'admin']): Promise<void> {
  // This would typically be run in a Firebase Admin script
  // Example usage in a script:
  /*
  import { getAuth } from 'firebase-admin/auth';
  
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, {
    role,
    permissions,
    updatedAt: Date.now()
  });
  */
  console.log(`Set admin claims for ${uid}:`, { role, permissions });
}
