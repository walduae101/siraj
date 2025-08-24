"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "~/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

export default function TestAuthPage() {
  const [authState, setAuthState] = useState<any>({
    loading: true,
    user: null,
    token: null,
    error: null,
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthState({
            loading: false,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            },
            token: token.substring(0, 50) + "...",
            error: null,
          });
        } catch (error) {
          setAuthState({
            loading: false,
            user: null,
            token: null,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      } else {
        setAuthState({
          loading: false,
          user: null,
          token: null,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch("/api/test/auth");
      const data = await response.json();
      console.log("Test API response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Test API error:", error);
      alert("Error: " + (error instanceof Error ? error.message : "Unknown"));
    }
  };

  const testTrpcCall = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("No user logged in");
        return;
      }
      
      const token = await user.getIdToken();
      const response = await fetch(`/api/trpc/points.getWallet?input=${encodeURIComponent(JSON.stringify({json:{uid:user.uid}}))}`, {
        headers: {
          "authorization": `Bearer ${token}`,
        },
      });
      
      const data = await response.text();
      console.log("tRPC response:", data);
      alert(`Status: ${response.status}\nResponse: ${data.substring(0, 200)}...`);
    } catch (error) {
      console.error("tRPC error:", error);
      alert("Error: " + (error instanceof Error ? error.message : "Unknown"));
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Auth Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Auth State:</h2>
        <pre className="text-sm">{JSON.stringify(authState, null, 2)}</pre>
      </div>
      
      <div className="space-x-4">
        <button
          onClick={testApiCall}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test API Call
        </button>
        
        <button
          onClick={testTrpcCall}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test tRPC Call
        </button>
      </div>
    </div>
  );
}
