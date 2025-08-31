"use client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect } from "react";
import { WalletWidget } from "~/components/points/WalletWidget";
import { getFirebaseAuth, getFirestore } from "~/lib/firebase/client";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") || "";
  const checkoutId = params.get("checkout_id") || "";
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [credited, setCredited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load Firebase config and get current user
  useEffect(() => {
    const loadFirebaseConfig = async () => {
      try {
        // Get Firebase auth directly
        const auth = getFirebaseAuth();
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUserId(user?.uid || null);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("[checkout/success] Firebase auth error:", error);
        // Firebase might not be initialized properly, but we can still try to complete the order
      }
    };

    loadFirebaseConfig();
  }, []);

  // Auto-process order when page loads
  useEffect(() => {
    const autoProcessOrder = async () => {
      if (!orderId && !checkoutId) return;

      // Wait a bit for Firebase to initialize
      setTimeout(async () => {
        try {
          // Try to get user ID from Firebase first
          let uid = userId;

          // If no Firebase user, try to get from URL
          if (!uid) {
            const urlParams = new URLSearchParams(window.location.search);
            uid = urlParams.get("uid");
          }

          if (!uid) {
            console.log(
              "[checkout/success] No user ID available for auto-processing",
            );
            return;
          }

          console.log(
            "[checkout/success] Auto-processing order for user:",
            uid,
          );

          const response = await fetch("/api/paynow/process-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderId || checkoutId,
              userId: uid,
            }),
          });

          const result = await response.json();

          if (response.ok && result.credited > 0) {
            console.log(
              "[checkout/success] Auto-processed order, credited:",
              result.credited,
            );
            setCredited(true);
          } else {
            console.log(
              "[checkout/success] Auto-process failed or no points credited:",
              result,
            );
          }
        } catch (error) {
          console.error("[checkout/success] Auto-process error:", error);
        }
      }, 2000); // Wait 2 seconds for Firebase to initialize
    };

    autoProcessOrder();
  }, [orderId, checkoutId, userId]);

  // Watch wallet balance - simplified to avoid Firestore permission issues
  useEffect(() => {
    if (!userId) return;

    // Instead of watching Firestore directly, we'll rely on the auto-processing
    // to update the UI when points are credited
    console.log(
      "[checkout/success] User authenticated, auto-processing will handle balance updates",
    );
  }, [userId]);

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

        {/* Automatic processing indicator */}
        <div className="mt-8 rounded border border-gray-200 p-4">
          <p className="mb-2 text-gray-600 text-sm">
            Processing your order automatically...
          </p>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-blue-500 border-b-2" />
            <span className="text-gray-600 text-sm">
              Please wait while we credit your points...
            </span>
          </div>
        </div>
      </main>
    );
  }

  // Show success when points are credited
  return (
    <main className="container mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-semibold text-2xl">Purchase complete</h1>
      <p className="text-green-600">
        Your points have been credited successfully! Thank you for your
        purchase.
      </p>
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

