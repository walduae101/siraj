export type ReceiptStatus = 'success' | 'refunded' | 'failed';

export interface Receipt {
  id: string;              // e.g., RCP-20250830-0001
  amount: number;          // minor units or major (UI labels clarify)
  currency: string;        // e.g., "AED"
  status: ReceiptStatus;
  createdAt: string;       // ISO string
  description?: string;
}

export interface ReceiptSummary extends Receipt {
  // room for extra summary fields (none yet)
}
