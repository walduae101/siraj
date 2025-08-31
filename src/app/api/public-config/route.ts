import { NextResponse } from "next/server";
import { loadServerEnv } from "~/env-server";

export async function GET() {
  try {
    const env = await loadServerEnv();
    
    // Return only public configuration (safe for client)
    const publicConfig = {
      firebase: {
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
      app: {
        websiteUrl: env.NEXT_PUBLIC_WEBSITE_URL,
        paynowStoreId: env.NEXT_PUBLIC_PAYNOW_STORE_ID,
        backgroundImageUrl: env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
        discordInviteUrl: env.NEXT_PUBLIC_DISCORD_INVITE_URL,
        gameserverConnectionMessage: env.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE,
      },
      features: {
        subPoints: env.FEAT_SUB_POINTS,
        subPointsKind: env.SUB_POINTS_KIND,
        subPointsExpireDays: env.SUB_POINTS_EXPIRE_DAYS,
        subTopupLazy: env.SUB_TOPUP_LAZY,
      },
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error("Failed to load public config:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 }
    );
  }
}
