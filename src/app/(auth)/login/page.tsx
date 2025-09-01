"use client";
import { getFirebaseAuth, signInWithGoogle } from "~/lib/firebase-auth";
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
        setReady(true);
      } catch (e) {
        console.error("Auth initialization error:", e);
        setErr("تعذر تهيئة تسجيل الدخول حالياً");
      }
    })();
  }, []);

  const onClick = async () => {
    try { 
      setBusy(true); 
      await signInWithGoogle(); 
      // For local development, this will use popup and we can redirect directly
      // For production, this will use redirect and handle the result
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        // Local development - redirect to dashboard after successful popup auth
        router.push("/dashboard");
      }
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
        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
          ? "سيتم فتح نافذة منبثقة لتسجيل الدخول."
          : "سنعيد توجيهك إلى Google لتسجيل الدخول."}
      </p>
    </main>
  );
}

