import { NextResponse } from "next/server";
import { firebaseConfig } from "~/lib/firebase/config";

export async function GET() {
  try {
    // Return the client-side Firebase configuration
    return NextResponse.json(firebaseConfig);
  } catch (error) {
    console.error("Failed to get Firebase config:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 },
    );
  }
}
