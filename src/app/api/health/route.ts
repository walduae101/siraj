import { NextResponse } from "next/server";

export async function GET() {
  return new Response(
    JSON.stringify({ status: "healthy", service: "siraj", version: "1.0.0", timestamp: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
