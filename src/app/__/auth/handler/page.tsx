"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "~/lib/firebase.client";
import { getRedirectResult } from "firebase/auth";

export default function FirebaseAuthHandler() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");
  const router = useRouter();

  useEffect(() => {
    const handleAuthResult = async () => {
      try {
        console.log("Auth handler: Starting to process redirect result...");
        const auth = await getFirebaseAuth();
        console.log("Auth handler: Firebase auth initialized");
        
        const result = await getRedirectResult(auth);
        console.log("Auth handler: Redirect result:", result);

        if (result?.user) {
          console.log("Auth handler: User authenticated:", result.user.email);
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          
          // Redirect to dashboard after successful authentication
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          console.log("Auth handler: No authentication result found");
          setStatus("error");
          setMessage("No authentication result found. Please try again.");
          
          // Redirect back to login page
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Auth handler error:", error);
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
        
        // Redirect back to login page
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    };

    handleAuthResult();
  }, [router]);

  return (
    <main className="grid place-items-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          {status === "loading" && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === "success" && (
            <div className="text-green-600 text-2xl">✓</div>
          )}
          {status === "error" && (
            <div className="text-red-600 text-2xl">✗</div>
          )}
        </div>
        <h1 className="text-xl font-semibold mb-2">
          {status === "loading" && "Processing Authentication"}
          {status === "success" && "Authentication Successful"}
          {status === "error" && "Authentication Failed"}
        </h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </main>
  );
}
