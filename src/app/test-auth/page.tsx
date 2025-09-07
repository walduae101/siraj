"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth, signInWithGoogle } from "~/lib/firebase.client";
import { getPublicConfig } from "~/lib/public-config.client";

export default function TestAuthPage() {
  const [config, setConfig] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        addDebugLog("🔄 Starting config load...");
        addDebugLog(`📍 Current hostname: ${window.location.hostname}`);
        addDebugLog(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
        
        const cfg = await getPublicConfig();
        addDebugLog("✅ Config loaded successfully");
        addDebugLog(`🔧 Config source: ${cfg.firebase?.authDomain}`);
        
        setConfig(cfg);
        console.log("Loaded config:", cfg);
      } catch (e) {
        addDebugLog(`❌ Config load failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        console.error("Failed to load config:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };

    const loadAuth = async () => {
      try {
        addDebugLog("🔄 Starting Firebase auth load...");
        const authInstance = await getFirebaseAuth();
        addDebugLog("✅ Firebase auth loaded successfully");
        setAuth(authInstance);
        console.log("Firebase auth loaded:", authInstance);
      } catch (e) {
        addDebugLog(`❌ Firebase auth load failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        console.error("Failed to load Firebase auth:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };

    loadConfig();
    loadAuth();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setSignInError(null);
    
    try {
      addDebugLog("🔐 Starting Google Sign-In...");
      console.log("Starting Google Sign-In...");
      const result = await signInWithGoogle();
      addDebugLog("✅ Google Sign-In successful");
      console.log("Sign-In successful:", result);
      alert("Sign-In successful! Check console for details.");
    } catch (e) {
      addDebugLog(`❌ Google Sign-In failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      console.error("Sign-In failed:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setSignInError(errorMessage);
      alert(`Sign-In failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Firebase Auth Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration Section */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          {error ? (
            <div className="text-red-600 mb-4">Error: {error}</div>
          ) : config ? (
            <div className="space-y-2">
              <div><strong>Project ID:</strong> {config.firebase?.projectId}</div>
              <div><strong>Auth Domain:</strong> {config.firebase?.authDomain}</div>
              <div><strong>API Key:</strong> {config.firebase?.apiKey?.substring(0, 10)}...</div>
              <div><strong>Website URL:</strong> {config.app?.websiteUrl}</div>
            </div>
          ) : (
            <div>Loading config...</div>
          )}
        </div>

        {/* Authentication Section */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          {error ? (
            <div className="text-red-600 mb-4">Error: {error}</div>
          ) : auth ? (
            <div className="space-y-4">
              <div className="text-green-600">✅ Firebase Auth loaded successfully</div>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Test Google Sign-In"}
              </button>
              {signInError && (
                <div className="text-red-600 mt-2">
                  <strong>Sign-In Error:</strong> {signInError}
                </div>
              )}
            </div>
          ) : (
            <div>Loading Firebase Auth...</div>
          )}
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          <div><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</div>
          <div><strong>Port:</strong> {typeof window !== 'undefined' ? window.location.port : 'N/A'}</div>
          <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</div>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <div>No logs yet...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

