export type Price = number;

function readNum(name: string, fallback: Price): Price {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const pricing = {
  currency: (process.env.NEXT_PUBLIC_CURRENCY ?? 'AED') as
    | 'USD' | 'EUR' | 'GBP' | 'AED' | string,

  points: {
    // perpetual, never expires
    p1k: readNum('NEXT_PUBLIC_PRICE_POINTS_1000', 9),
    p5k: readNum('NEXT_PUBLIC_PRICE_POINTS_5000', 35),
    p10k: readNum('NEXT_PUBLIC_PRICE_POINTS_10000', 65),
  },

  subs: {
    // separate time-based access
    monthly: readNum('NEXT_PUBLIC_PRICE_SUB_MONTHLY', 19),
    yearly: readNum('NEXT_PUBLIC_PRICE_SUB_YEARLY', 180),
    // institutional handled via “Contact”
  },
};
