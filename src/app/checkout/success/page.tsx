"use client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect } from "react";
import { WalletWidget } from "~/components/points/WalletWidget";
import { getFirebaseAuth, getFirestore } from "~/lib/firebase/client";
import { api } from "~/trpc/react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") || "";
  const checkoutId = params.get("checkout_id") || "";
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [credited, setCredited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Watch wallet balance
  useEffect(() => {
    if (!userId) return;

    const db = getFirestore();
    const walletRef = doc(db, "users", userId, "wallet", "points");

    let isFirstSnapshot = true;
    const unsubscribe = onSnapshot(
      walletRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const balance = snapshot.data()?.paidBalance || 0;

          if (isFirstSnapshot) {
            setInitialBalance(balance);
            isFirstSnapshot = false;
          }

          setCurrentBalance(balance);

          // Check if balance increased
          if (initialBalance !== null && balance > initialBalance) {
            setCredited(true);
          }
        }
      },
      (error) => {
        console.error("[checkout/success] Firestore error:", error);
        // If permission denied, wait a bit and retry
        if (error.code === "permission-denied") {
          console.log("[checkout/success] Waiting for auth to stabilize...");
          // Don't throw, just wait for auth to stabilize
        }
      },
    );

    return () => unsubscribe();
  }, [userId, initialBalance]);

  // Show loading while webhook processes
  if (!credited) {
    return (
      <main className="container mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="font-semibold text-2xl">Purchase complete</h1>
        <p>Processing your payment...</p>
        <div className="h-4 animate-pulse rounded bg-gray-200" />
        <p className="text-gray-500 text-sm">
          Your points will appear shortly. Order: {orderId || checkoutId}
        </p>
      </main>
    );
  }

  // Show success when points are credited
  const pointsCredited =
    currentBalance !== null && initialBalance !== null
      ? currentBalance - initialBalance
      : 0;

  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Purchase complete</h1>
      {pointsCredited > 0 && (
        <p className="text-green-600">
          Your wallet has been updated with {pointsCredited} points. Thank you!
        </p>
      )}
      <WalletWidget />
      <a href="/account/points" className="mt-4 inline-block underline">
        View full history
      </a>
    </main>
  );
}

export default function Success() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-2xl space-y-6 p-6">
          <h1 className="font-semibold text-2xl">Purchase complete</h1>
          <p>Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
