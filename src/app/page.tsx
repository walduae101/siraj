"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import AuthCard from "~/components/auth/auth-card";

export default function Page() {
  const { user, loading } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    console.log("Auth state changed:", { user, loading });
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Debug logging
  console.log("Page render:", { user, loading });

  if (loading) {
    return (
      <main style={{display:"grid",placeItems:"center",minHeight:"100dvh",padding:"2rem"}}>
        <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
          <h1>Siraj Life</h1>
          <p style={{opacity:.7,margin:"0.5rem 0 1.25rem"}}>
            جارٍ التحميل... (Loading...)
          </p>
          <p style={{opacity:.5,margin:"0.5rem 0",fontSize:"0.8rem"}}>
            Debug: loading={loading.toString()}, user={user ? "exists" : "null"}
          </p>
        </div>
      </main>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <main style={{display:"grid",placeItems:"center",minHeight:"100dvh",padding:"2rem"}}>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <h1>Siraj Life — تسجيل الدخول</h1>
        <p style={{opacity:.7,margin:"0.5rem 0 1.25rem"}}>
          استخدم حساب جوجل الخاص بك لتسجيل الدخول إلى سراج
        </p>
        <div style={{marginTop:"2rem"}}>
          <AuthCard />
        </div>
      </div>
    </main>
  );
}
