export default interface Context {
  headers: Headers;
  resHeaders: Headers;
  payNowStorefrontHeaders: Record<string, string>;
  firebaseUser: { uid: string; email?: string; [key: string]: unknown } | null;
  cfg: {
    features: {
      paynow: { enabled: boolean };
    };
    [key: string]: unknown;
  };
}
