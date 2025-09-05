"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFirebaseAuth, signInWithGoogle, getGoogleSignInRedirectResult } from "~/lib/firebase.client";

export default function Page() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await getFirebaseAuth(); // ensures runtime config + client init
        
        // Check for redirect result (user coming back from Google auth)
        const result = await getGoogleSignInRedirectResult();
        if (result?.user) {
          console.log("User signed in:", result.user.email);
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        console.error("Auth setup failed:", e);
        setErr("Authentication setup failed");
      }
    };

    setupAuth();
  }, [router]);

  async function login() {
    console.log("Login button clicked");
    setBusy(true);
    setErr(null);
    try {
      console.log("Calling signInWithGoogle...");
      const user = await signInWithGoogle();
      if (user) {
        console.log("signInWithGoogle completed for user:", user.email);
        // signInWithPopup completed successfully
        console.log("Sign-in completed successfully");
        // Redirect to dashboard after successful popup auth
        router.replace("/dashboard");
      } else {
        setErr("Sign-in failed - no user returned");
        setBusy(false);
      }
    } catch (e: unknown) {
      console.error("Login error:", e);
      
      if (e instanceof Error && e.message.includes('Redirecting')) {
        // User is being redirected to Google for authentication
        setErr("جاري التوجيه إلى Google للمصادقة. يرجى إكمال عملية تسجيل الدخول.");
        // Don't set busy to false - let the redirect happen
        return;
      }
      
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
          {busy ? "Redirecting…" : "Continue with Google"}
        </button>
        <p id="login-desc" style={{ opacity: 0.6, marginTop: "0.75rem" }}>
          You'll be redirected to Google for authentication.
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

