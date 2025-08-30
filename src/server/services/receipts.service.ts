export type Receipt = { id: string; total: number; currency: string; issuedAt: string };

export async function listReceipts(userId: string, page = 1, pageSize = 20): Promise<Receipt[]> {
  // TODO: Replace with datastore; keep deterministic demo for now
  return Array.from({ length: pageSize }).map((_, i) => ({
    id: `${userId}-${page}-${i}`,
    total: 99.5 + i,
    currency: "AED",
    issuedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}
