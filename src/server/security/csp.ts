const SELF = "'self'";
const DATA = "data:";
const BLOB = "blob:";

// External origins needed (adjust as you add/remove vendors)
const GOOGLE_ACCOUNTS = "https://accounts.google.com";
const GOOGLE_APIS     = "https://*.googleapis.com";
const GOOGLE_STATIC   = "https://*.gstatic.com";
const FIREBASEAPP     = "https://*.firebaseapp.com";
const FIREBASEIO      = "https://*.firebaseio.com";
const FIREBASE_INSTALL= "https://firebaseinstallations.googleapis.com";
const SECURETOKEN     = "https://securetoken.googleapis.com";
const PAYNOW          = "https://*.paynow.*"; // adjust real domain as needed

export function buildCsp({ nonce, isDev }: { nonce: string; isDev: boolean }) {
  const SCRIPT_SRC = [
    SELF,
    `'nonce-${nonce}'`,
    GOOGLE_ACCOUNTS, GOOGLE_APIS, GOOGLE_STATIC,
    FIREBASEAPP, FIREBASEIO, SECURETOKEN, FIREBASE_INSTALL,
    PAYNOW,
    // Dev concessions (HMR, overlay)
    isDev ? "'unsafe-eval'" : null,
    isDev ? "'unsafe-inline'" : null,
    // Optional: strict-dynamic trusts nonce-bearing loader scripts
    // NOTE: keeps hosts but modern browsers rely on nonce dyn loading
    "'strict-dynamic'"
  ].filter(Boolean).join(" ");

  const STYLE_SRC = [
    SELF,
    GOOGLE_STATIC,
    // Dev overlays sometimes need inline styles; drop in prod if not used.
    isDev ? "'unsafe-inline'" : null,
  ].filter(Boolean).join(" ");

  const CONNECT_SRC = [
    SELF,
    GOOGLE_ACCOUNTS, GOOGLE_APIS, GOOGLE_STATIC,
    FIREBASEAPP, FIREBASEIO, SECURETOKEN, FIREBASE_INSTALL,
    PAYNOW,
    isDev ? "ws://localhost:3000" : null,
    isDev ? "http://localhost:3000" : null,
  ].filter(Boolean).join(" ");

  const IMG_SRC   = [SELF, DATA, BLOB, GOOGLE_STATIC, GOOGLE_ACCOUNTS, GOOGLE_APIS].join(" ");
  const FONT_SRC  = [SELF, DATA, GOOGLE_STATIC].join(" ");
  const FRAME_SRC = [GOOGLE_ACCOUNTS].join(" ");

  const DIRECTIVES = [
    `default-src ${SELF}`,
    `script-src ${SCRIPT_SRC}`,
    `style-src ${STYLE_SRC}`,
    `connect-src ${CONNECT_SRC}`,
    `img-src ${IMG_SRC}`,
    `font-src ${FONT_SRC}`,
    `frame-src ${FRAME_SRC}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri ${SELF}`,
  ];

  return DIRECTIVES.join("; ");
}
