"use client";

import { isLocalhost } from "../../config/dev-bridge";

export function DevBanner() {
  if (typeof window === "undefined" || !isLocalhost(window.location.host)) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-xs font-mono">
      DEV ↔ REMOTE: {window.location.host}
    </div>
  );
}
