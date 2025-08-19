// This file provides a safe way to access env vars without triggering validation errors on the client

// On the server, we can safely import the full env with validation
if (typeof window === "undefined") {
  module.exports = require("./env");
} else {
  // On the client, we create a mock env object that only contains client vars
  const clientEnv = {
    // Client vars from process.env
    NEXT_PUBLIC_BACKGROUND_IMAGE_URL:
      process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
    NEXT_PUBLIC_PAYNOW_STORE_ID: process.env.NEXT_PUBLIC_PAYNOW_STORE_ID,
    NEXT_PUBLIC_DISCORD_INVITE_URL: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
    NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE:
      process.env.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE,
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    // Dummy server vars to prevent errors
    NODE_ENV: "production",
    PAYNOW_API_KEY: "",
    FIREBASE_PROJECT_ID: "",
    FIREBASE_SERVICE_ACCOUNT_JSON: "",
    OPENAI_API_KEY: "",
    GAMESERVER_GAME: "minecraft",
    GAMESERVER_IP: "",
    GAMESERVER_PORT: "",
  };

  module.exports = { env: clientEnv };
}
