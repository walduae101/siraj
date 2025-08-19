export const t = (locale: "en" | "ar") => (en: string, ar: string) =>
  locale === "ar" ? ar : en;
