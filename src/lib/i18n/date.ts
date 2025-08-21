// Date formatting utilities that use Western Arabic numerals

export const formatDate = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  return date.toLocaleDateString(locale === "ar" ? "ar-u-nu-latn" : "en-US");
};

export const formatDateTime = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  return date.toLocaleString(locale === "ar" ? "ar-u-nu-latn" : "en-US");
};

export const formatTime = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  return date.toLocaleTimeString(locale === "ar" ? "ar-u-nu-latn" : "en-US");
};
