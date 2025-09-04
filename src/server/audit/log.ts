import { getDb } from "~/server/firebase/admin";

export interface AuditEntry {
  id: string;
  actorUid: string;
  orgId?: string;
  type: AuditType;
  meta: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'purchase.success'
  | 'purchase.failed'
  | 'entitlement.cancel'
  | 'entitlement.reactivate'
  | 'entitlement.expire'
  | 'org.create'
  | 'org.update'
  | 'org.delete'
  | 'org.invite.sent'
  | 'org.invite.accepted'
  | 'org.invite.declined'
  | 'org.member.joined'
  | 'org.member.removed'
  | 'org.member.role_changed'
  | 'org.seats.updated'
  | 'usage.limit.hit'
  | 'usage.limit.warning'
  | 'admin.grant_entitlement'
  | 'admin.revoke_entitlement'
  | 'admin.manual_action';

export async function appendAudit(params: {
  actorUid: string;
  orgId?: string;
  type: AuditType;
  meta: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuditEntry> {
  const { actorUid, orgId, type, meta, ipAddress, userAgent } = params;
  const db = await getDb();
  
  const auditRef = db.collection('audit').doc();
  const auditEntry: AuditEntry = {
    id: auditRef.id,
    actorUid,
    orgId,
    type,
    meta,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  };

  await auditRef.set(auditEntry);
  
  // TODO: Trigger email notifications based on audit type
  await triggerNotificationIfNeeded(auditEntry);
  
  return auditEntry;
}

export async function getAuditLog(params: {
  orgId?: string;
  actorUid?: string;
  type?: AuditType;
  limit?: number;
  startAfter?: string;
}): Promise<AuditEntry[]> {
  const { orgId, actorUid, type, limit = 100, startAfter } = params;
  const db = await getDb();
  
  let query = db.collection('audit').orderBy('timestamp', 'desc');
  
  if (orgId) {
    query = query.where('orgId', '==', orgId);
  }
  
  if (actorUid) {
    query = query.where('actorUid', '==', actorUid);
  }
  
  if (type) {
    query = query.where('type', '==', type);
  }
  
  if (startAfter) {
    const startAfterDoc = await db.collection('audit').doc(startAfter).get();
    if (startAfterDoc.exists) {
      query = query.startAfter(startAfterDoc);
    }
  }
  
  const snapshot = await query.limit(limit).get();
  return snapshot.docs.map(doc => doc.data() as AuditEntry);
}

async function triggerNotificationIfNeeded(entry: AuditEntry): Promise<void> {
  // TODO: Implement email notifications based on audit type
  const notificationTypes: Record<AuditType, boolean> = {
    'auth.login': false,
    'auth.logout': false,
    'auth.signup': true, // Welcome email
    'purchase.success': true, // Receipt email
    'purchase.failed': true, // Failure notification
    'entitlement.cancel': true, // Cancellation confirmation
    'entitlement.reactivate': true, // Reactivation confirmation
    'entitlement.expire': true, // Expiration warning
    'org.create': false,
    'org.update': false,
    'org.delete': true, // Deletion confirmation
    'org.invite.sent': true, // Invite email
    'org.invite.accepted': false,
    'org.invite.declined': false,
    'org.member.joined': true, // Welcome to org email
    'org.member.removed': true, // Removal notification
    'org.member.role_changed': true, // Role change notification
    'org.seats.updated': false,
    'usage.limit.hit': true, // Limit exceeded notification
    'usage.limit.warning': true, // Warning notification
    'admin.grant_entitlement': true, // Entitlement granted
    'admin.revoke_entitlement': true, // Entitlement revoked
    'admin.manual_action': false,
  };

  if (notificationTypes[entry.type]) {
    // TODO: Queue email notification
    console.log(`Should send notification for audit type: ${entry.type}`, entry);
  }
}

// Helper functions for common audit events
export async function logAuthLogin(uid: string, ipAddress?: string, userAgent?: string) {
  return appendAudit({
    actorUid: uid,
    type: 'auth.login',
    meta: {},
    ipAddress,
    userAgent,
  });
}

export async function logPurchaseSuccess(uid: string, purchaseData: any) {
  return appendAudit({
    actorUid: uid,
    type: 'purchase.success',
    meta: purchaseData,
  });
}

export async function logOrgInviteSent(orgId: string, invitedBy: string, email: string, role: string) {
  return appendAudit({
    actorUid: invitedBy,
    orgId,
    type: 'org.invite.sent',
    meta: { email, role },
  });
}

export async function logUsageLimitHit(uid: string, feature: string, used: number, limit: number) {
  return appendAudit({
    actorUid: uid,
    type: 'usage.limit.hit',
    meta: { feature, used, limit },
  });
}
