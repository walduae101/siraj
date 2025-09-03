"use client";

import {
  CircleNotchIcon,
  GoogleLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { getFirebaseAuth } from "~/lib/firebase.client";
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

      // Configure redirect behavior for custom domain
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Use redirect-based auth for custom domain handler
      await signInWithPopup(auth, provider);
      // The page will redirect and come back to /__/auth/handler
      // The auth handler will process the result and redirect to dashboard
    } catch (e) {
      console.error("Google auth failed", e);
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
              جارٍ التوجيه...
            </span>
          ) : (
            "متابعة باستخدام حساب جوجل"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

