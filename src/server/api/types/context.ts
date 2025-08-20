export default interface Context {
  headers: Headers;
  resHeaders: Headers;
  payNowStorefrontHeaders: Record<string, string>;
  firebaseUser: any | null;
}
