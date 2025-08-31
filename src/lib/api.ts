"use client";

import { devProxyBase } from "../config/dev-bridge";

function isAbsolute(u: string) { try { new URL(u); return true; } catch { return false; } }

function remoteToggleOn(host?: string | null) {
  const isLocal = !!host && (host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]"));
  if (!isLocal) return false;
  try { 
    const v = typeof window !== "undefined" ? window.localStorage.getItem("siraj.dev.remote") : null; 
    if (v === null) return true; 
    return v === "1"; 
  } catch { 
    return true; 
  }
}

async function getIdToken(): Promise<string | null> {
  try { 
    const { auth } = await import("./firebase.client"); 
    return auth?.currentUser ? await auth.currentUser.getIdToken(true) : null; 
  } catch { 
    return null; 
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const useProxy = remoteToggleOn(host);
  const base = useProxy ? devProxyBase(host) : "/api";
  const url = isAbsolute(path) ? path : `${base}/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(init.headers || {});
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (typeof window !== "undefined") { 
    const t = await getIdToken(); 
    if (t) headers.set("authorization", `Bearer ${t}`); 
  }
  return fetch(url, { ...init, headers, cache: "no-store" });
}

// (Optional) expose a helper to flip the toggle in dev banner
export function setRemoteMode(on: boolean) { 
  try { 
    if (typeof window !== "undefined") localStorage.setItem("siraj.dev.remote", on ? "1" : "0"); 
  } catch {} 
}

// tRPC base path that uses dev proxy on localhost
export function trpcBasePath(): string {
  const host = typeof window !== 'undefined' ? window.location.host : null;
  const useProxy = remoteToggleOn(host);
  const base = useProxy ? devProxyBase(host) : '/api';
  return `${base}/trpc`;
}
