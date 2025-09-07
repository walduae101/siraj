export default interface Context {
  headers: Headers;
  resHeaders: Headers;
  payNowStorefrontHeaders: Record<string, string>;
  firebaseUser: { uid: string; email?: string; [key: string]: unknown } | null;
  adminUser: { uid: string; email?: string; [key: string]: unknown } | null;
  user?: { uid: string; email?: string; [key: string]: unknown };
  userId?: string;
  cfg: {
    features: {
      paynow: { enabled: boolean; methods: string[] };
      receipts: { persist: boolean };
    };
  };
  req?: Request;
  reqId: string;
}
