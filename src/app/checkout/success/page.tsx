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
  const [manualCompleting, setManualCompleting] = useState(false);
  
  // Manual complete mutation
  const completeMutation = api.checkout.complete.useMutation({
    onSuccess: (data) => {
      console.log("[checkout/success] Manual complete success:", data);
      setCredited(true);
      // Force refresh the page to update wallet
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error) => {
      console.error("[checkout/success] Manual complete error:", error);
      alert(`Error: ${error.message}`);
    },
  });

  // Load Firebase config and get current user
  useEffect(() => {
    const loadFirebaseConfig = async () => {
      try {
        // Load Firebase config from runtime endpoint
        const response = await fetch("/api/config/firebase");
        if (response.ok) {
          const config = await response.json();
          console.log("[checkout/success] Loaded Firebase config:", config);
          
          // Set the Firebase config
          const { setFirebaseConfig } = await import("~/lib/firebase/client");
          setFirebaseConfig(config);
          
          // Now try to get auth
          const auth = getFirebaseAuth();
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid || null);
          });
          return () => unsubscribe();
        } else {
          console.error("[checkout/success] Failed to load Firebase config");
        }
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
            uid = urlParams.get('uid');
          }
          
          if (!uid) {
            console.log("[checkout/success] No user ID available for auto-processing");
            return;
          }
          
          console.log("[checkout/success] Auto-processing order for user:", uid);
          
          const response = await fetch('/api/paynow/process-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderId || checkoutId,
              userId: uid
            })
          });
          
          const result = await response.json();
          
          if (response.ok && result.credited > 0) {
            console.log("[checkout/success] Auto-processed order, credited:", result.credited);
            setCredited(true);
          } else {
            console.log("[checkout/success] Auto-process failed or no points credited:", result);
          }
        } catch (error) {
          console.error("[checkout/success] Auto-process error:", error);
        }
      }, 2000); // Wait 2 seconds for Firebase to initialize
    };
    
    autoProcessOrder();
  }, [orderId, checkoutId, userId]);

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
        
        {/* Manual complete button if webhook is delayed */}
        <div className="mt-8 p-4 border border-gray-200 rounded">
          <p className="text-sm text-gray-600 mb-2">
            Points not showing up? Click below to manually complete the order:
          </p>
          <button
            onClick={() => {
              setManualCompleting(true);
              completeMutation.mutate({ orderId: orderId || checkoutId });
            }}
            disabled={manualCompleting || completeMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
          >
            {manualCompleting ? "Processing..." : "Complete Order Manually"}
          </button>
          
          {/* Process Order button - works without Firebase auth */}
          <button
            onClick={async () => {
              setManualCompleting(true);
              try {
                // Get user ID from URL or prompt
                const urlParams = new URLSearchParams(window.location.search);
                const uid = urlParams.get('uid') || prompt('Enter your user ID:');
                
                if (!uid) {
                  alert('User ID required');
                  setManualCompleting(false);
                  return;
                }
                
                const response = await fetch('/api/paynow/process-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: orderId || checkoutId,
                    userId: uid
                  })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  alert(`Success! Credited ${result.credited} points.`);
                  setCredited(true);
                  setTimeout(() => window.location.reload(), 1000);
                } else {
                  alert(`Error: ${result.error}`);
                }
              } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setManualCompleting(false);
              }
            }}
            disabled={manualCompleting}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Process Order
          </button>
        </div>
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
