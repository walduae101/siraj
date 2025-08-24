import { NextResponse } from "next/server";
import { getConfig } from "~/server/config";

export async function GET() {
  try {
    const config = await getConfig();

    // Return only public Firebase configuration
    return NextResponse.json({
      apiKey: config.firebase.apiKey || "",
      authDomain:
        config.firebase.authDomain ||
        `${config.firebase.projectId}.firebaseapp.com`,
      projectId: config.firebase.projectId || "",
      appId: config.firebase.appId || "",
      storageBucket: config.firebase.storageBucket,
      messagingSenderId: config.firebase.messagingSenderId,
    });
  } catch (error) {
    console.error("Failed to get Firebase config:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 },
    );
  }
}
