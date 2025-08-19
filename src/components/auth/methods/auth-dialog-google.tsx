"use client";

import {
  CircleNotchIcon,
  GoogleLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { getFirebaseAuth } from "~/lib/firebase/client";
import { api } from "~/trpc/react";

export default function AuthDialogGoogle({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const utils = api.useUtils();
  const googleLogin = api.paynow.googleLogin.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.paynow.getAuth.invalidate(),
        utils.paynow.getCart.invalidate(),
      ]);
      setOpen(false);
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    },
    onError(err) {
      console.error("googleLogin error", err);
    },
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      // Prefer popup; fallback to redirect if popup blocked
      const result = await signInWithPopup(auth, provider).catch(async (e) => {
        if (e?.message?.toLowerCase()?.includes("popup")) {
          await signInWithRedirect(auth, provider);
          return await getRedirectResult(auth); // will be non-null after redirect
        }
        throw e;
      });

      if (!result?.user) throw new Error("No Firebase user");
      const idToken = await result.user.getIdToken(/* forceRefresh */ true);
      await googleLogin.mutateAsync({ idToken });
      // Success: refresh UI or route
      window.location.href = "/";
    } catch (e) {
      console.error("Google auth failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل الدخول عبر جوجل</DialogTitle>
          <DialogDescription id="auth-desc">
            استخدم حساب جوجل الخاص بك لتسجيل الدخول إلى سراج
          </DialogDescription>
        </DialogHeader>

        <Button onClick={handleGoogleSignIn} disabled={loading} size="lg">
          <GoogleLogoIcon />
          {loading ? (
            <span className="flex items-center gap-2">
              <CircleNotchIcon className="animate-spin" />
              جارٍ تسجيل الدخول...
            </span>
          ) : (
            "متابعة باستخدام حساب جوجل"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
