import { useEffect, useState } from "react";
import { clientEnvSchema, type ClientEnv } from "~/env-client";

interface PublicConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  app: {
    websiteUrl: string;
    paynowStoreId: string;
    backgroundImageUrl: string;
    discordInviteUrl: string;
    gameserverConnectionMessage: string;
  };
  features: {
    subPoints: boolean;
    subPointsKind: string;
    subPointsExpireDays: number;
    subTopupLazy: boolean;
  };
}

export function usePublicConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/public-config");
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading, error };
}

// Helper function to convert public config to client env format
export function publicConfigToClientEnv(config: PublicConfig): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_FIREBASE_API_KEY: config.firebase.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.firebase.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.firebase.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: config.firebase.appId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.firebase.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.firebase.messagingSenderId,
    NEXT_PUBLIC_WEBSITE_URL: config.app.websiteUrl,
    NEXT_PUBLIC_PAYNOW_STORE_ID: config.app.paynowStoreId,
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL: config.app.backgroundImageUrl,
    NEXT_PUBLIC_DISCORD_INVITE_URL: config.app.discordInviteUrl,
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: config.app.gameserverConnectionMessage,
  });
}
