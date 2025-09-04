export interface Invoice {
  id: string;
  uid: string;
  orgId?: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Customer details
  customer: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Invoice details
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Line items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  taxRate: number; // VAT rate (e.g., 0.05 for 5%)
  taxAmount: number;
  total: number;
  
  // Currency
  currency: string;
  
  // Payment details
  paymentMethod?: string;
  paymentReference?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string; // e.g., 'subscription', 'points', 'addon'
}

export interface DunningEmail {
  id: string;
  uid: string;
  invoiceId: string;
  type: 'payment_failed' | 'payment_overdue' | 'final_notice';
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceFilters {
  status?: Invoice['status'];
  uid?: string;
  orgId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}
