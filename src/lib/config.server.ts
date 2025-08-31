/* server-only */
import "server-only";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

type SecretMap = Record<string, string | undefined>;
const cache: { loaded?: SecretMap; at?: number } = {};

async function fetchSecret(name: string): Promise<string | undefined> {
  try {
    const client = new SecretManagerServiceClient();
    const [access] = await client.accessSecretVersion({ name: `projects/${process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT}/secrets/${name}/versions/latest` });
    return access?.payload?.data?.toString();
  } catch {
    return undefined;
  }
}

export async function loadPublicConfig(): Promise<{
  ok: boolean;
  firebase?: {
    apiKey?: string;
    projectId?: string;
    authDomain?: string;
    appId?: string;
    messagingSenderId?: string;
    storageBucket?: string;
  };
  app?: {
    websiteUrl?: string;
    paynowStoreId?: string;
    backgroundImageUrl?: string;
    discordInviteUrl?: string;
    gameserverConnectionMessage?: string;
  };
  features?: Record<string, unknown>;
  missing?: string[];
}> {
  if (!cache.loaded || !cache.at || Date.now() - cache.at > 60_000) {
    const names = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_WEBSITE_URL",
      "NEXT_PUBLIC_PAYNOW_STORE_ID",
      "NEXT_PUBLIC_BACKGROUND_IMAGE_URL",
      "NEXT_PUBLIC_DISCORD_INVITE_URL",
      "NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE",
    ];
    const entries = await Promise.all(names.map(async n => [n, await fetchSecret(n)] as const));
    cache.loaded = Object.fromEntries(entries);
    cache.at = Date.now();
  }
  const s = cache.loaded!;
  const miss = Object.entries(s).filter(([,v]) => !v).map(([k]) => k);

  return {
    ok: miss.length === 0,
    firebase: {
      apiKey: s.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: s.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: s.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      appId: s.NEXT_PUBLIC_FIREBASE_APP_ID,
      messagingSenderId: s.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: s.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    app: {
      websiteUrl: s.NEXT_PUBLIC_WEBSITE_URL,
      paynowStoreId: s.NEXT_PUBLIC_PAYNOW_STORE_ID,
      backgroundImageUrl: s.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
      discordInviteUrl: s.NEXT_PUBLIC_DISCORD_INVITE_URL,
      gameserverConnectionMessage: s.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE,
    },
    features: {},
    missing: miss,
  };
}
