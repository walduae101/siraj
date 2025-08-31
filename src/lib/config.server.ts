import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const c = new SecretManagerServiceClient();
const cache = new Map<string, string>();

async function read(name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const pid = await c.getProjectId();
  try {
    const [v] = await c.accessSecretVersion({ name: `projects/${pid}/secrets/${name}/versions/latest` });
    const val = v?.payload?.data?.toString() ?? "";
    cache.set(name, val);
    return val;
  } catch (error) {
    console.warn(`Secret ${name} not found, using empty string`);
    cache.set(name, "");
    return "";
  }
}

export async function getServerConfig() {
  const names = [
    "PAYNOW_API_KEY", "PAYNOW_WEBHOOK_SECRET", "OPENAI_API_KEY",
    "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 
    "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "FEAT_SUB_POINTS", "SUB_POINTS_KIND", "SUB_POINTS_EXPIRE_DAYS", "SUB_TOPUP_LAZY",
    "NEXT_PUBLIC_WEBSITE_URL", "NEXT_PUBLIC_PAYNOW_STORE_ID", "NEXT_PUBLIC_BACKGROUND_IMAGE_URL", 
    "NEXT_PUBLIC_DISCORD_INVITE_URL", "NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE"
  ];
  const vals = await Promise.all(names.map(read));
  const m: Record<string, string> = {};
  names.forEach((n, i) => m[n] = vals[i] || "");

  const features = {
    subPoints: (m.FEAT_SUB_POINTS ?? "false").toLowerCase() === "true",
    subPointsKind: m.SUB_POINTS_KIND ?? "promo",
    subPointsExpireDays: Number(m.SUB_POINTS_EXPIRE_DAYS ?? "365"),
    subTopupLazy: (m.SUB_TOPUP_LAZY ?? "false").toLowerCase() === "true"
  };

  const firebase = {
    apiKey: m.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: m.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: m.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: m.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: m.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: m.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  };

  const pub = {
    firebase,
    app: {
      websiteUrl: m.NEXT_PUBLIC_WEBSITE_URL,
      paynowStoreId: m.NEXT_PUBLIC_PAYNOW_STORE_ID,
      backgroundImageUrl: m.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
      discordInviteUrl: m.NEXT_PUBLIC_DISCORD_INVITE_URL,
      gameserverConnectionMessage: m.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE
    },
    features
  };

  return {
    secrets: {
      PAYNOW_API_KEY: m.PAYNOW_API_KEY,
      PAYNOW_WEBHOOK_SECRET: m.PAYNOW_WEBHOOK_SECRET,
      OPENAI_API_KEY: m.OPENAI_API_KEY
    },
    public: pub
  };
}
