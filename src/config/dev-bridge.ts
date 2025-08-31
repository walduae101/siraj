export const REMOTE_BASE = "https://siraj.life";
export const REMOTE_PREFIX = "/api";

export function isLocalhost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return h.startsWith("localhost") || h.startsWith("127.0.0.1");
}

export function buildUpstreamUrl(pathname: string, search: string = ""): string {
  const clean = pathname.replace(/^\/+/, "");
  const base = new URL(REMOTE_PREFIX.replace(/\/+$/, "/") + clean, REMOTE_BASE);
  if (search) {
    const s = search.startsWith("?") ? search : `?${search}`;
    return new URL(s, base).toString();
  }
  return base.toString();
}
