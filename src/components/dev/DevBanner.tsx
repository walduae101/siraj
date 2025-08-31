"use client";

import { isLocalhost } from "../../config/dev-bridge";
import { setRemoteMode } from "../../lib/api";

export function DevBanner() {
  if (typeof window === "undefined" || !isLocalhost(window.location.host)) {
    return null;
  }

  const handleToggleRemote = (on: boolean) => {
    setRemoteMode(on);
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-xs font-mono flex items-center justify-center gap-2">
      <span>DEV ↔ REMOTE: {window.location.host}</span>
      <button 
        onClick={() => handleToggleRemote(true)}
        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Remote ON
      </button>
      <button 
        onClick={() => handleToggleRemote(false)}
        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Remote OFF
      </button>
    </div>
  );
}
