import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check - can be extended with database connectivity, etc.
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      region: process.env.REGION || "us-central1",
      service: process.env.SERVICE_NAME || "siraj",
      version: process.env.npm_package_version || "1.0.0",
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error("[health] Health check failed:", error);
    
    const unhealthy = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      region: process.env.REGION || "us-central1",
      service: process.env.SERVICE_NAME || "siraj",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(unhealthy, { status: 503 });
  }
}
