import { NextResponse } from "next/server";

export async function GET() {
  // Basic health check endpoint for container monitoring
  try {
    // You can add additional health checks here if needed
    // For example: database connectivity, external service checks, etc.
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "siraj",
        version: process.env.npm_package_version || "unknown",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

// Also support HEAD requests for lighter health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}
