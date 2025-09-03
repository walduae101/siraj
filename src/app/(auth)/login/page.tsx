"use client";
import { getFirebaseAuth, signInWithGoogle, getGoogleSignInRedirectResult, completeServerSession } from "~/lib/firebase.client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await getFirebaseAuth(); // ensures runtime config + client init
        
        // Check for redirect result (user coming back from Google auth)
        const result = await getGoogleSignInRedirectResult();
        if (result?.user) {
          console.log("User signed in:", result.user.email);
          router.push("/dashboard");
          return;
        }
        
        setReady(true);
      } catch (e) {
        console.error("Auth initialization error:", e);
        setErr("تعذر تهيئة تسجيل الدخول حالياً");
      }
    };

    setupAuth();
  }, [router]);

    const onClick = async () => {
    try { 
      setBusy(true); 
      setErr(null);
      const user = await signInWithGoogle(); // Remove redirectTo to prevent premature redirect
      
      if (user) {
        // Create server session cookie
        await completeServerSession();
        console.log("Sign-in completed successfully for user:", user.email);
        // Redirect to dashboard after successful popup auth and cookie creation
        router.push("/dashboard");
      } else {
        setErr("فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
     }
     catch (e) { 
       console.error("Sign-in error:", e); 
       
       if (e instanceof Error && e.message.includes('Redirecting')) {
         // User is being redirected to Google for authentication
         setErr("جاري التوجيه إلى Google للمصادقة. يرجى المحاولة مرة أخرى.");
         // Don't set busy to false - let the redirect happen
         return;
       }
       
       setErr("فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.");
     }
     finally { 
       setBusy(false); 
     }
   };

  if (err) return <p className="text-red-500 text-center mt-6">{err}</p>;
  if (!ready) return <p className="text-center mt-6 opacity-70">…جارٍ التهيئة</p>;

  return (
    <main className="grid place-items-center min-h-[60vh]">
      <button
        onClick={onClick}
        disabled={busy}
        className="w-full max-w-sm px-4 py-3 rounded-xl border border-neutral-300"
        aria-describedby="login-desc"
      >
        {busy ? "جاري التوجيه…" : "متابعة باستخدام Google"}
      </button>
      <p id="login-desc" className="mt-2 text-sm opacity-60">
        سنعيد توجيهك إلى Google لتسجيل الدخول.
      </p>
    </main>
  );
}

