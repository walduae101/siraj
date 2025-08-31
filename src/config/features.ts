import { getPublicConfig } from "~/lib/public-config.client";

// Client-side features from runtime config
export async function getFeatures() {
  try {
    const config = await getPublicConfig();
    return {
      pointsClient: config.features?.pointsClient === true,
      stubCheckout: config.features?.stubCheckout === true,
      liveCheckout: config.features?.liveCheckout === true,
    };
  } catch {
    // Fallback to safe defaults
    return {
      pointsClient: false,
      stubCheckout: false,
      liveCheckout: false,
    };
  }
}

// Legacy export for backward compatibility (deprecated)
export const features = {
  pointsClient: false, // Use getFeatures() instead
  stubCheckout: false, // Use getFeatures() instead
  liveCheckout: false, // Use getFeatures() instead
};

// ⚠️ DO NOT ADD SERVER ENV READS HERE
// Server features must use getConfig() from ~/server/config
