// Client-side features still read from env vars
export const features = {
  pointsServer: process.env.FEAT_POINTS === "1",
  pointsClient: process.env.NEXT_PUBLIC_FEAT_POINTS === "1",
  stubCheckout:
    process.env.STUB_CHECKOUT === "1" ||
    process.env.NEXT_PUBLIC_STUB_CHECKOUT === "1",
  liveCheckout:
    process.env.PAYNOW_LIVE === "1" ||
    process.env.NEXT_PUBLIC_PAYNOW_LIVE === "1",
};

// For server-side features, use getConfig() from ~/server/config instead
