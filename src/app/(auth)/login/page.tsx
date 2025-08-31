"use client";
import { getFirebaseAuth, signInWithGoogle } from "~/lib/firebase.client";
import { useEffect, useState } from "react";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getFirebaseAuth(); // ensures runtime config + client init
        setReady(true);
      } catch (e) {
        setErr("تعذر تهيئة تسجيل الدخول حالياً");
      }
    })();
  }, []);

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
        متابعة باستخدام Google
      </button>
      <p id="login-desc" className="mt-2 text-sm opacity-60">
        سنعيد توجيهك بعد تسجيل الدخول.
      </p>
    </main>
  );
}

