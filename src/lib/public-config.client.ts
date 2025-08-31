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

/** Load config with graceful fallbacks (local → proxy). Caches on window. */
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
      console.error("Both local and proxy config failed:", e2);
      
      // Provide a user-friendly error
      const error = new Error("تعذر تحميل إعدادات التطبيق. يرجى المحاولة مرة أخرى لاحقاً.");
      error.cause = { local: lastError, proxy: e2 };
      throw error;
    }
  }
}
