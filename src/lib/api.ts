"use client";

import { isLocalhost } from '../config/dev-bridge';
import { auth } from './firebase.client';

// Get Firebase ID token for authenticated requests
export async function getIdToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(true);
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

// API fetch wrapper that uses dev proxy on localhost
export async function apiFetch(path: string, init: RequestInit = {}) {
  // Determine base URL based on current host
  const host = typeof window !== 'undefined' ? window.location.host : null;
  const base = isLocalhost(host) ? '/api/dev-proxy' : '/api';
  const url = `${base}/${path.replace(/^\//, '')}`;
  
  // Prepare headers
  const headers = new Headers(init.headers);
  
  // Add Authorization header if we have a Firebase user (client-side only)
  if (typeof window !== 'undefined') {
    const token = await getIdToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  // Make request with no-cache for dev instant reflect
  const response = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });
  
  return response;
}

// tRPC base path that uses dev proxy on localhost
export function trpcBasePath(): string {
  const host = typeof window !== 'undefined' ? window.location.host : null;
  const base = isLocalhost(host) ? '/api/dev-proxy' : '/api';
  return `${base}/trpc`;
}
