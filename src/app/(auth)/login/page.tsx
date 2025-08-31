"use client";
import { useState } from "react";
import { signInWithGoogle } from "~/lib/firebase.client";

export default function Page() {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    try { 
      setBusy(true); 
      await signInWithGoogle(); 
      location.href = "/dashboard"; 
    }
    catch (e) { 
      console.error(e); 
      alert("Sign-in failed. See console."); 
    }
    finally { 
      setBusy(false); 
    }
  };
  return (
    <main className="grid min-h-svh place-items-center">
      <button onClick={onClick} disabled={busy} className="px-6 py-3 rounded-xl border">
        Continue with Google
      </button>
    </main>
  );
}

