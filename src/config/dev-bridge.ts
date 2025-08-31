// Dev bridge config (authoritative upstream from repo docs)
export const REMOTE_BASE = 'https://siraj.life';
export const REMOTE_PREFIX = '/api';

// Host check
export function isLocalhost(host?: string | null) {
  if (!host) return false;
  const h = host.toLowerCase();
  return h.startsWith('localhost') || h.startsWith('127.0.0.1');
}

// Build absolute upstream URL from a local path + search
export function buildUpstreamUrl(pathname: string, search: string) {
  const cleanPath = String(pathname || '').replace(/^\/+/, '');        // no leading slashes
  const prefix = REMOTE_PREFIX.replace(/\/+$/, '');                     // no trailing slash
  const rel = `${prefix}/${cleanPath}${search || ''}`;
  const url = new URL(rel, REMOTE_BASE);                                 // ABSOLUTE URL
  return url.toString();
}
