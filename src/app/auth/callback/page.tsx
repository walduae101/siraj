"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GoogleAuthCallbackContent() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing authentication...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Google OAuth callback received");
        
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
          console.error("Google OAuth error:", error);
          setStatus("error");
          setMessage("Authentication failed");
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: error
            }, window.location.origin);
          }
          
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }
        
        if (code) {
          console.log("Authorization code received:", code);
          setStatus("success");
          setMessage("Authentication successful! Closing...");
          
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              code: code
            }, window.location.origin);
          }
          
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          console.error("No authorization code received");
          setStatus("error");
          setMessage("No authorization code received");
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: 'No authorization code received'
            }, window.location.origin);
          }
          
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (error) {
        console.error("Callback processing error:", error);
        setStatus("error");
        setMessage("Processing error");
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Processing error'
          }, window.location.origin);
        }
        
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <main className="grid place-items-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          {status === "processing" && (
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
          {status === "processing" && "Processing Authentication"}
          {status === "success" && "Authentication Successful"}
          {status === "error" && "Authentication Failed"}
        </h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </main>
  );
}

export default function GoogleAuthCallback() {
  return (
    <Suspense fallback={
      <main className="grid place-items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-gray-600">Initializing authentication callback...</p>
        </div>
      </main>
    }>
      <GoogleAuthCallbackContent />
    </Suspense>
  );
}
