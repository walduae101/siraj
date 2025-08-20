export const PAYNOW_PRODUCTS = {
  // points (one-time)
  points_20: "459935272365195264",
  points_50: "458255405240287232",
  points_150: "458255787102310400",
  points_500: "458256188073574400",

  // subscriptions (recurring)
  sub_basic_monthly: "458253675014389760",
  sub_pro_monthly: "458254106331451392",
  sub_basic_annual: "458254569336479744",
  sub_pro_annual: "458255036057649152",
} as const;

export type PayNowSku = keyof typeof PAYNOW_PRODUCTS;

export const isSubscription = (sku: PayNowSku) => sku.startsWith("sub_");
