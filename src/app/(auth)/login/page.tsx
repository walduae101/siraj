"use client";
import { getFirebaseAuth, signInWithGoogle, handleRedirectResult } from "~/lib/firebase-auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await getFirebaseAuth(); // ensures runtime config + client init
        
        // Check for redirect result (user coming back from Google auth)
        const user = await handleRedirectResult();
        if (user) {
          console.log("User signed in:", user.email);
          router.push("/dashboard");
          return;
        }
        
        setReady(true);
      } catch (e) {
        console.error("Auth initialization error:", e);
        setErr("تعذر تهيئة تسجيل الدخول حالياً");
      }
    })();
  }, [router]);

  const onClick = async () => {
    try { 
      setBusy(true); 
      await signInWithGoogle(); 
      // signInWithRedirect will redirect the user to Google, then back to this page
      // The useEffect above will handle the redirect result
    }
    catch (e) { 
      console.error("Sign-in error:", e); 
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
        {busy ? "جاري التوجيه..." : "متابعة باستخدام Google"}
      </button>
      <p id="login-desc" className="mt-2 text-sm opacity-60">
        سنعيد توجيهك إلى Google لتسجيل الدخول.
      </p>
    </main>
  );
}

