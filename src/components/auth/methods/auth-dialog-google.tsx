"use client";

import {
  CircleNotchIcon,
  GoogleLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  GoogleAuthProvider,
  getRedirectResult,
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
import { getFirebaseAuth } from "~/lib/firebase-auth";
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
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      // Use redirect-based auth to avoid COOP issues
      await signInWithRedirect(auth, provider);
      // The page will redirect and come back, so we don't need to handle the result here
    } catch (e) {
      console.error("Google auth failed", e);
      setLoading(false);
    }
  };

  // Handle redirect result when user comes back from Google auth
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const auth = await getFirebaseAuth();
        const result = await getRedirectResult(auth);

        if (result?.user) {
          const idToken = await result.user.getIdToken(true);
          await googleLogin.mutateAsync({ idToken });
          setOpen(false);
          router.push("/dashboard");
        }
      } catch (e) {
        console.error("Redirect result error", e);
      }
    };

    handleRedirectResult();
  }, [googleLogin, setOpen, router]); // Run once on component mount

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

