import { NextResponse } from "next/server";

// This endpoint serves only safe public Firebase configuration
// that can be exposed to the client without security risks
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
      `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "207501673877",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:207501673877:web:8c8265c153623cf14ae29c",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate that required fields are present
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    console.error("[public-config] Missing required Firebase configuration");
    return NextResponse.json(
      { error: "Firebase configuration not available" },
      { status: 500 }
    );
  }

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
    },
  });
}
