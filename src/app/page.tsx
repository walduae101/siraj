"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "~/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Page() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (user) router.replace("/dashboard");
    });
    return () => unsub();
  }, [router]);

  async function login() {
    setBusy(true);
    setErr(null);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      // Try popup first
      await signInWithPopup(auth, provider).catch(async (e) => {
        // Fallback to redirect if popup blocked
        if (String(e?.message ?? "").toLowerCase().includes("popup")) {
          await signInWithRedirect(auth, provider);
          // control will resume on / after redirect; handle below
          return;
        }
        throw e;
      });

      // If we are back from redirect, get result (no-op if popup succeeded)
      await getRedirectResult(auth);

      // If we got here with a signed-in user, router effect above will move us
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main style={{display:"grid",placeItems:"center",minHeight:"100dvh",padding:"2rem"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <h1>Siraj Life — Sign in</h1>
        <p style={{opacity:.7,margin:"0.5rem 0 1.25rem"}}>
          Continue with your Google account.
        </p>
        <button
          onClick={login}
          disabled={busy}
          style={{
            width:"100%",padding:"0.75rem 1rem",fontSize:"1rem",
            borderRadius:12,border:"1px solid #ddd",cursor: busy?"not-allowed":"pointer"
          }}
          aria-describedby="login-desc"
        >
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        <p id="login-desc" style={{opacity:.6,marginTop:"0.75rem"}}>
          We&apos;ll redirect you to a success page after sign-in.
        </p>
        {err && <p role="alert" style={{color:"crimson",marginTop:"0.75rem"}}>{err}</p>}
      </div>
    </main>
  );
}
