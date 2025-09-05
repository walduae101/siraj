import { getDb } from '~/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';

export interface SupportTicket {
  ticketId: string;
  uid?: string | null;
  email: string;
  subject: string;
  description: string;
  severity: 'low' | 'med' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  source: 'web' | 'api';
  createdAt: Date;
  updatedAt: Date;
  assigneeUid?: string | null;
  lastMessageAt?: Date;
  messagesCount: number;
  tags: string[];
}

export interface SupportMessage {
  messageId: string;
  from: 'user' | 'admin';
  text: string;
  createdAt: Date;
  attachments?: string[];
}

export interface CreateTicketPayload {
  uid?: string | null;
  email: string;
  subject: string;
  description: string;
  severity: 'low' | 'med' | 'high' | 'urgent';
  source?: 'web' | 'api';
}

export interface ListTicketsOptions {
  status?: string;
  limitSize?: number;
  assigneeUid?: string;
  severity?: string;
}

export async function createTicket(payload: CreateTicketPayload): Promise<{ ticketId: string }> {
  const db = await getDb();
  const ticketId = crypto.randomUUID();
  const now = Timestamp.now();
  
  const ticketData = {
    ticketId,
    uid: payload.uid || null,
    email: payload.email,
    subject: payload.subject,
    description: payload.description,
    severity: payload.severity,
    status: 'open' as const,
    source: payload.source || 'web',
    createdAt: now,
    updatedAt: now,
    assigneeUid: null,
    lastMessageAt: now,
    messagesCount: 0,
    tags: [],
  };

  const ref = db.collection('supportTickets').doc(ticketId);
  await ref.set(ticketData);

  return { ticketId };
}

export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  const db = await getDb();
  const doc = await db.collection('supportTickets').doc(ticketId).get();
  
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    ticketId: data.ticketId,
    uid: data.uid,
    email: data.email,
    subject: data.subject,
    description: data.description,
    severity: data.severity,
    status: data.status,
    source: data.source,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    assigneeUid: data.assigneeUid,
    lastMessageAt: data.lastMessageAt?.toDate(),
    messagesCount: data.messagesCount || 0,
    tags: data.tags || [],
  };
}

export async function updateTicketStatus(
  ticketId: string, 
  status: SupportTicket['status'], 
  assigneeUid?: string | null
): Promise<void> {
  const db = await getDb();
  const ref = db.collection('supportTickets').doc(ticketId);
  
  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (assigneeUid !== undefined) {
    updateData.assigneeUid = assigneeUid;
  }

  await ref.update(updateData);
}

export async function listTickets(opts: ListTicketsOptions = {}): Promise<SupportTicket[]> {
  const db = await getDb();
  let query = db.collection('supportTickets')
    .orderBy('createdAt', 'desc')
    .limit(opts.limitSize || 100);

  // Apply filters
  if (opts.status) {
    query = query.where('status', '==', opts.status);
  }
  if (opts.assigneeUid) {
    query = query.where('assigneeUid', '==', opts.assigneeUid);
  }
  if (opts.severity) {
    query = query.where('severity', '==', opts.severity);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ticketId: data.ticketId,
      uid: data.uid,
      email: data.email,
      subject: data.subject,
      description: data.description,
      severity: data.severity,
      status: data.status,
      source: data.source,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      assigneeUid: data.assigneeUid,
      lastMessageAt: data.lastMessageAt?.toDate(),
      messagesCount: data.messagesCount || 0,
      tags: data.tags || [],
    };
  });
}

export async function addMessage(
  ticketId: string,
  message: {
    from: 'user' | 'admin';
    text: string;
    attachments?: string[];
  }
): Promise<{ messageId: string }> {
  const db = await getDb();
  const messageId = crypto.randomUUID();
  const now = Timestamp.now();

  // Add message to subcollection
  const messageRef = db.collection('supportTickets').doc(ticketId).collection('messages').doc(messageId);
  await messageRef.set({
    messageId,
    from: message.from,
    text: message.text,
    createdAt: now,
    attachments: message.attachments || [],
  });

  // Update ticket metadata
  const ticketRef = db.collection('supportTickets').doc(ticketId);
  await ticketRef.update({
    lastMessageAt: now,
    messagesCount: db.FieldValue.increment(1),
    updatedAt: now,
  });

  return { messageId };
}

export async function getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const db = await getDb();
  const snapshot = await db.collection('supportTickets')
    .doc(ticketId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      messageId: data.messageId,
      from: data.from,
      text: data.text,
      createdAt: data.createdAt?.toDate() || new Date(),
      attachments: data.attachments || [],
    };
  });
}

export async function addTag(ticketId: string, tag: string): Promise<void> {
  const db = await getDb();
  const ref = db.collection('supportTickets').doc(ticketId);
  await ref.update({
    tags: db.FieldValue.arrayUnion(tag),
    updatedAt: Timestamp.now(),
  });
}

export async function removeTag(ticketId: string, tag: string): Promise<void> {
  const db = await getDb();
  const ref = db.collection('supportTickets').doc(ticketId);
  await ref.update({
    tags: db.FieldValue.arrayRemove(tag),
    updatedAt: Timestamp.now(),
  });
}
