/**
 * SKU to PayNow Product ID mapping - Single source of truth
 * Maps internal SKUs to PayNow product IDs and grant definitions
 */

export const skuMap = {
  // Points packages
  points_20: {
    productId: "459935272365195264",
    grant: { type: "points" as const, amount: 20 },
  },
  points_50: {
    productId: "458255405240287232",
    grant: { type: "points" as const, amount: 50 },
  },
  points_150: {
    productId: "458255787102310400",
    grant: { type: "points" as const, amount: 150 },
  },
  points_500: {
    productId: "458256188073574400",
    grant: { type: "points" as const, amount: 500 },
  },

  // Subscription plans
  sub_basic_m: {
    productId: "458253675014389760",
    grant: { type: "subscription" as const, plan: "basic", cycle: "monthly" },
  },
  sub_pro_m: {
    productId: "458254106331451392",
    grant: { type: "subscription" as const, plan: "pro", cycle: "monthly" },
  },
  sub_basic_y: {
    productId: "458254569336479744",
    grant: { type: "subscription" as const, plan: "basic", cycle: "yearly" },
  },
  sub_pro_y: {
    productId: "458255036057649152",
    grant: { type: "subscription" as const, plan: "pro", cycle: "yearly" },
  },
} as const;

export type Sku = keyof typeof skuMap;
