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
  
  // Check if we're in local development mode
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔧 Local development mode detected, using local Firebase config");
    }
    
    // Force fresh config load for localhost (no caching)
    try {
      // Import local config dynamically to avoid SSR issues
      const { getLocalDevConfig } = await import('./config.local');
      if (process.env.NODE_ENV !== 'production') {
        console.log("🔧 getLocalDevConfig function imported:", typeof getLocalDevConfig);
      }
      
      const localConfig = getLocalDevConfig();
      if (process.env.NODE_ENV !== 'production') {
        console.log("🔧 Local config loaded:", localConfig);
        console.log("🔧 Local config auth domain:", localConfig.firebase?.authDomain);
        console.log("🔧 Local config type:", typeof localConfig);
        console.log("🔧 Local config keys:", Object.keys(localConfig));
      }
      
      // Update cache
      w.__PUBLIC_CONFIG__ = localConfig;
      if (process.env.NODE_ENV !== 'production') {
        console.log("🔧 Config cached on window:", w.__PUBLIC_CONFIG__);
        console.log("🔧 Cached config auth domain:", w.__PUBLIC_CONFIG__.firebase?.authDomain);
      }
      return localConfig;
    } catch (error) {
      console.error("❌ Failed to load local config:", error);
      
      // Fallback: try to fetch from API instead
      if (process.env.NODE_ENV !== 'production') {
        console.log("🔄 Falling back to API config...");
      }
      try {
        const apiConfig = await fetchJSON("/api/public-config");
        if (process.env.NODE_ENV !== 'production') {
          console.log("🔧 API config loaded as fallback:", apiConfig);
          console.log("🔧 API config auth domain:", apiConfig.firebase?.authDomain);
        }
        w.__PUBLIC_CONFIG__ = apiConfig;
        return apiConfig;
      } catch (apiError) {
        console.error("❌ API fallback also failed:", apiError);
        throw error; // Throw original error
      }
    }
  }
  
  // For non-localhost, use cached config if available
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

1. Configure Google Secret Manager on the remote backend with Firebase secrets
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
