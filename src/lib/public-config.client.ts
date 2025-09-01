export type PublicConfig = {
  firebase: {
    apiKey: string;
    projectId: string;
    authDomain: string;
    appId: string;
    messagingSenderId?: string;
    storageBucket?: string;
  };
  app?: Record<string, unknown>;
  features?: Record<string, unknown>;
};

async function fetchJSON(url: string) {
  const r = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j?.error ?? `HTTP ${r.status}`), { status: r.status, data: j });
  return j;
}

/** Load config with graceful fallbacks (local → proxy → remote direct). Caches on window. */
export async function getPublicConfig(): Promise<PublicConfig> {
  const w = window as any;
  if (w.__PUBLIC_CONFIG__) return w.__PUBLIC_CONFIG__;
  
  let lastError: Error | null = null;
  
  try {
    // Try local config first
    const j = await fetchJSON("/api/public-config");
    w.__PUBLIC_CONFIG__ = j; 
    return j;
  } catch (e) {
    lastError = e as Error;
    console.warn("Local config failed, trying proxy:", e);
    
    try {
      // Fallback to remote via dev-proxy (works only on localhost)
      const j = await fetchJSON("/api/dev-proxy/public-config");
      w.__PUBLIC_CONFIG__ = j; 
      return j;
    } catch (e2) {
      console.warn("Proxy config failed, trying remote direct:", e2);
      
      try {
        // Final fallback: try remote backend directly
        const j = await fetchJSON("https://siraj.life/api/public-config");
        w.__PUBLIC_CONFIG__ = j; 
        return j;
      } catch (e3) {
        console.error("All config sources failed:", { local: lastError, proxy: e2, remote: e3 });
        
        // Development mode: provide instructions for setting up remote backend
        if (process.env.NODE_ENV === "development") {
          console.warn(`
🔧 DEVELOPMENT MODE: Remote backend needs Firebase configuration

To set up the remote backend with real Firebase config:

1. Configure Google Secret Manager on the remote backend with these secrets:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID  
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_APP_ID
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

2. Ensure the remote backend has the /api/public-config endpoint implemented

3. Or use the mock config for local development (current fallback)
          `);
        }
        
        // Provide a user-friendly error
        const error = new Error("تعذر تحميل إعدادات التطبيق. يرجى المحاولة مرة أخرى لاحقاً.");
        error.cause = { local: lastError, proxy: e2, remote: e3 };
        throw error;
      }
    }
  }
}
