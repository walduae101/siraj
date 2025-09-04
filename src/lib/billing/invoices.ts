import { getDb } from '~/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';
import type { Invoice, InvoiceFilters } from '~/types/billing';

export class InvoiceService {
  private async getDb() {
    return await getDb();
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const db = await this.getDb();
    const now = Timestamp.now();
    const invoiceRef = db.collection('invoices').doc();
    
    const invoice: Invoice = {
      ...invoiceData,
      id: invoiceRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };

    await invoiceRef.set({
      ...invoice,
      issueDate: Timestamp.fromDate(invoice.issueDate),
      dueDate: Timestamp.fromDate(invoice.dueDate),
      paidDate: invoice.paidDate ? Timestamp.fromDate(invoice.paidDate) : null,
      createdAt: now,
      updatedAt: now,
    });

    return invoice;
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const db = await this.getDb();
    const doc = await db.collection('invoices').doc(invoiceId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return this.convertFirestoreToInvoice(data);
  }

  async listInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
    const db = await this.getDb();
    let query = db.collection('invoices').orderBy('createdAt', 'desc');

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.uid) {
      query = query.where('uid', '==', filters.uid);
    }

    if (filters.orgId) {
      query = query.where('orgId', '==', filters.orgId);
    }

    if (filters.dateFrom) {
      query = query.where('issueDate', '>=', Timestamp.fromDate(filters.dateFrom));
    }

    if (filters.dateTo) {
      query = query.where('issueDate', '<=', Timestamp.fromDate(filters.dateTo));
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.convertFirestoreToInvoice(doc.data()));
  }

  async updateInvoiceStatus(invoiceId: string, status: Invoice['status'], paidDate?: Date): Promise<void> {
    const db = await this.getDb();
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (paidDate) {
      updateData.paidDate = Timestamp.fromDate(paidDate);
    }

    await db.collection('invoices').doc(invoiceId).update(updateData);
  }

  async generateInvoiceNumber(): Promise<string> {
    const db = await this.getDb();
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;
    
    // Get the last invoice number for this year
    const snapshot = await db
      .collection('invoices')
      .where('invoiceNumber', '>=', prefix)
      .where('invoiceNumber', '<', `INV-${year + 1}`)
      .orderBy('invoiceNumber', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return `${prefix}-0001`;
    }

    const lastNumber = snapshot.docs[0].data().invoiceNumber;
    const lastSequence = parseInt(lastNumber.split('-')[2], 10);
    const nextSequence = (lastSequence + 1).toString().padStart(4, '0');
    
    return `${prefix}-${nextSequence}`;
  }

  private convertFirestoreToInvoice(data: any): Invoice {
    return {
      ...data,
      issueDate: data.issueDate?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      paidDate: data.paidDate?.toDate() || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }
}

export const invoiceService = new InvoiceService();
