export const fmtInt = (n: number, locale: "en" | "ar" = "en") =>
  new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", {
    maximumFractionDigits: 0,
  }).format(n);

export const fmtNum = fmtInt;
