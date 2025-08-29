// Client-side features from build-time env vars only
export const features = {
  // Server-side features: use getConfig() from ~/server/config instead
  pointsClient: process.env.NEXT_PUBLIC_FEAT_POINTS === "1",
  stubCheckout: process.env.NEXT_PUBLIC_STUB_CHECKOUT === "1",
  liveCheckout: process.env.NEXT_PUBLIC_PAYNOW_LIVE === "1",
};

// ⚠️ DO NOT ADD SERVER ENV READS HERE
// Server features must use getConfig() from ~/server/config
