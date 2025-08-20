export type Price = number;

function readNum(name: string, fallback: Price): Price {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const pricing = {
  currency: (process.env.NEXT_PUBLIC_CURRENCY ?? "AED") as
    | "USD"
    | "EUR"
    | "GBP"
    | "AED"
    | string,

  points: {
    // Legacy stub packages (perpetual, never expires)
    p1k: readNum("NEXT_PUBLIC_PRICE_POINTS_1000", 9),
    p5k: readNum("NEXT_PUBLIC_PRICE_POINTS_5000", 35),
    p10k: readNum("NEXT_PUBLIC_PRICE_POINTS_10000", 65),
    
    // PayNow packages (perpetual, never expires)
    p20: readNum("NEXT_PUBLIC_PRICE_POINTS_20", 5),
    p50: readNum("NEXT_PUBLIC_PRICE_POINTS_50", 10),
    p150: readNum("NEXT_PUBLIC_PRICE_POINTS_150", 25),
    p500: readNum("NEXT_PUBLIC_PRICE_POINTS_500", 50),
  },

  subs: {
    // Legacy stub subscriptions
    monthly: readNum("NEXT_PUBLIC_PRICE_SUB_MONTHLY", 19),
    yearly: readNum("NEXT_PUBLIC_PRICE_SUB_YEARLY", 180),
    
    // PayNow subscriptions
    basicMonthly: readNum("NEXT_PUBLIC_PRICE_SUB_BASIC_M", 10),
    proMonthly: readNum("NEXT_PUBLIC_PRICE_SUB_PRO_M", 29),
    basicYearly: readNum("NEXT_PUBLIC_PRICE_SUB_BASIC_Y", 100),
    proYearly: readNum("NEXT_PUBLIC_PRICE_SUB_PRO_Y", 290),
    
    // institutional handled via "Contact"
  },
};
