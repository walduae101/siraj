"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFirebaseAuth, signInWithGoogle, handleRedirectResult } from "~/lib/firebase-auth";
import { onAuthStateChanged } from "firebase/auth";

export default function Page() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        const unsub = onAuthStateChanged(auth, (user) => {
          if (user) router.replace("/dashboard");
        });
        return () => unsub();
      } catch (e) {
        console.error("Auth setup failed:", e);
        setErr("Authentication setup failed");
      }
    };

    setupAuth();
  }, [router]);

  // Handle redirect result when user comes back from Google auth
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await handleRedirectResult();

        if (user) {
          // User authenticated successfully via redirect
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error("Redirect result error", e);
        setErr("Authentication failed");
      }
    };

    checkRedirectResult();
  }, [router]);

  async function login() {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
      // signInWithRedirect will redirect the user to Google, then back to this page
      // The useEffect above will handle the redirect result
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100dvh",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h1>Siraj Life — Sign in</h1>
        <p style={{ opacity: 0.7, margin: "0.5rem 0 1.25rem" }}>
          Continue with your Google account.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={busy}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: busy ? "not-allowed" : "pointer",
          }}
          aria-describedby="login-desc"
        >
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
        <p id="login-desc" style={{ opacity: 0.6, marginTop: "0.75rem" }}>
          We&apos;ll redirect you to a success page after sign-in.
        </p>
        {err && (
          <p role="alert" style={{ color: "crimson", marginTop: "0.75rem" }}>
            {err}
          </p>
        )}
      </div>
    </main>
  );
}

