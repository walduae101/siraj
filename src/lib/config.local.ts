/* local development config */
import type { PublicConfig } from "./public-config.client";

/**
 * Local development configuration that bypasses Secret Manager
 * This file should only be used in development mode
 * 
 * Note: Using default Firebase auth domain (firebaseapp.com) for local development
 * because the custom domain (siraj.life) has strict CSP policies that prevent
 * popup authentication from localhost. In production, siraj.life will be used.
 */
export function getLocalDevConfig(): PublicConfig {
  const config = {
    firebase: {
      apiKey: "AIzaSyBlAiqH3HaLcgq6ZFqkXrA6WPcGx-EchC4",
      projectId: "walduae-project-20250809071906",
      authDomain: "walduae-project-20250809071906.firebaseapp.com", // Use default Firebase domain for local dev
      appId: "1:207501673877:web:8c8265c153623cf14ae29c",
      messagingSenderId: "207501673877",
      storageBucket: "walduae-project-20250809071906.firebasestorage.app",
    },
    app: {
      websiteUrl: "http://localhost:3000",
      paynowStoreId: "local-dev-store",
      backgroundImageUrl: "https://via.placeholder.com/1920x1080",
      discordInviteUrl: "https://discord.gg/siraj",
      gameserverConnectionMessage: "Local development mode",
    },
    features: {},
  };

  console.log("🔧 getLocalDevConfig() called");
  console.log("🔧 Local config auth domain:", config.firebase.authDomain);
  console.log("🔧 Full local config:", config);

  return config;
}
