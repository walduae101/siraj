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
  try {
    const j = await fetchJSON("/api/public-config");
    w.__PUBLIC_CONFIG__ = j; return j;
  } catch (_) {
    // Fallback to remote via dev-proxy (works only on localhost)
    try {
      const j = await fetchJSON("/api/dev-proxy/public-config");
      w.__PUBLIC_CONFIG__ = j; return j;
    } catch (e2) {
      throw e2;
    }
  }
}
