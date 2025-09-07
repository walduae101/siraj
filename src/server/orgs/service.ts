import { db } from "~/server/firebase/admin";

export interface Organization {
  id: string;
  name: string;
  ownerUid: string;
  seats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgMember {
  uid: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  invitedAt: Date;
  joinedAt?: Date;
  invitedBy: string;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

export async function createOrg(params: {
  name: string;
  ownerUid: string;
  seats: number;
}): Promise<Organization> {
  const { name, ownerUid, seats } = params;
  const firestore = await db();
  
  const orgRef = firestore.collection('orgs').doc();
  const org: Organization = {
    id: orgRef.id,
    name,
    ownerUid,
    seats,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await firestore.runTransaction(async (transaction) => {
    // Create organization
    transaction.set(orgRef, org);
    
    // Add owner as first member
    const memberRef = orgRef.collection('members').doc(ownerUid);
    const member: OrgMember = {
      uid: ownerUid,
      role: 'OWNER',
      invitedAt: new Date(),
      joinedAt: new Date(),
      invitedBy: ownerUid,
    };
    transaction.set(memberRef, member);
  });

  return org;
}

export async function getOrg(orgId: string): Promise<Organization | null> {
  const firestore = await db();
  const orgDoc = await firestore.collection('orgs').doc(orgId).get();
  
  if (!orgDoc.exists) {
    return null;
  }
  
  return orgDoc.data() as Organization;
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const firestore = await db();
  const membersSnapshot = await firestore.collection('orgs').doc(orgId).collection('members').get();
  
  return membersSnapshot.docs.map(doc => doc.data() as OrgMember);
}

export async function inviteMember(params: {
  orgId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  invitedBy: string;
}): Promise<OrgInvite> {
  const { orgId, email, role, invitedBy } = params;
  const firestore = await db();
  
  // Generate invite token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const inviteRef = firestore.collection('orgs').doc(orgId).collection('invites').doc();
  const invite: OrgInvite = {
    id: inviteRef.id,
    orgId,
    email,
    role,
    token,
    invitedBy,
    invitedAt: new Date(),
    expiresAt,
    status: 'pending',
  };

  await inviteRef.set(invite);
  
  // TODO: Send email invitation
  console.log(`Invite link: /i/${token}`);
  
  return invite;
}

export async function acceptInvite(params: {
  token: string;
  uid: string;
}): Promise<{ org: Organization; member: OrgMember }> {
  const { token, uid } = params;
  const firestore = await db();
  
  // Find invite by token
  const invitesSnapshot = await firestore.collectionGroup('invites')
    .where('token', '==', token)
    .where('status', '==', 'pending')
    .limit(1)
    .get();
  
  if (invitesSnapshot.empty) {
    throw new Error('Invalid or expired invite');
  }
  
  const inviteDoc = invitesSnapshot.docs[0];
  const invite = inviteDoc.data() as OrgInvite;
  
  if (new Date() > invite.expiresAt) {
    throw new Error('Invite has expired');
  }
  
  const orgId = invite.orgId;
  
  await firestore.runTransaction(async (transaction) => {
    // Mark invite as accepted
    transaction.update(inviteDoc.ref, { status: 'accepted' });
    
    // Add user as member
    const memberRef = firestore.collection('orgs').doc(orgId).collection('members').doc(uid);
    const member: OrgMember = {
      uid,
      role: invite.role,
      invitedAt: invite.invitedAt,
      joinedAt: new Date(),
      invitedBy: invite.invitedBy,
    };
    transaction.set(memberRef, member);
  });
  
  const org = await getOrg(orgId);
  if (!org) {
    throw new Error('Organization not found');
  }
  
  return { org, member: { uid, role: invite.role, invitedAt: invite.invitedAt, joinedAt: new Date(), invitedBy: invite.invitedBy } };
}

export async function setMemberRole(params: {
  orgId: string;
  uid: string;
  role: 'ADMIN' | 'MEMBER';
  updatedBy: string;
}): Promise<void> {
  const { orgId, uid, role, updatedBy } = params;
  const firestore = await db();
  
  const memberRef = firestore.collection('orgs').doc(orgId).collection('members').doc(uid);
  await memberRef.update({
    role,
    updatedAt: new Date(),
    updatedBy,
  });
}

export async function setOrgSeats(params: {
  orgId: string;
  seats: number;
  updatedBy: string;
}): Promise<void> {
  const { orgId, seats, updatedBy } = params;
  const firestore = await db();
  
  const orgRef = firestore.collection('orgs').doc(orgId);
  await orgRef.update({
    seats,
    updatedAt: new Date(),
    updatedBy,
  });
}

export async function removeMember(params: {
  orgId: string;
  uid: string;
  removedBy: string;
}): Promise<void> {
  const { orgId, uid, removedBy } = params;
  const firestore = await db();
  
  const memberRef = firestore.collection('orgs').doc(orgId).collection('members').doc(uid);
  await memberRef.delete();
  
  // TODO: Log audit event
}

export async function getUserOrgs(uid: string): Promise<Organization[]> {
  const firestore = await db();
  const membersSnapshot = await firestore.collectionGroup('members')
    .where('uid', '==', uid)
    .get();
  
  const orgIds = membersSnapshot.docs.map(doc => doc.ref.parent.parent?.id).filter(Boolean);
  
  if (orgIds.length === 0) {
    return [];
  }
  
  const orgsSnapshot = await firestore.collection('orgs')
    .where('__name__', 'in', orgIds)
    .get();
  
  return orgsSnapshot.docs.map(doc => doc.data() as Organization);
}
