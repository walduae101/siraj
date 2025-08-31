// Dev bridge configuration for local frontend + remote backend
// Safe to commit - no secrets, only public URLs

// Remote backend base URL (production or staging)
export const REMOTE_BASE = 'https://siraj.life';

// Check if host is localhost/127.0.0.1
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0].toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

// Determine API base URL based on host
export function devProxyBase(host: string | null): string {
  return isLocalHost(host) ? '/api/_dev/remote' : '/api';
}
