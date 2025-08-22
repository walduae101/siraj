// Date formatting utilities that use Western Arabic numerals

// Helper to convert Eastern Arabic numerals to Western Arabic numerals
const convertToWesternNumerals = (str: string): string => {
  const arabicToWestern: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  return str.replace(/[٠-٩]/g, (char) => arabicToWestern[char] || char);
};

export const formatDate = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  let formatted = date.toLocaleDateString(
    locale === "ar" ? "ar-u-nu-latn" : "en-US",
  );

  // Fallback: manually convert any Eastern Arabic numerals to Western
  if (locale === "ar") {
    formatted = convertToWesternNumerals(formatted);
  }

  return formatted;
};

export const formatDateTime = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  let formatted = date.toLocaleString(
    locale === "ar" ? "ar-u-nu-latn" : "en-US",
  );

  // Fallback: manually convert any Eastern Arabic numerals to Western
  if (locale === "ar") {
    formatted = convertToWesternNumerals(formatted);
  }

  return formatted;
};

export const formatTime = (date: Date, locale: "en" | "ar" = "en") => {
  // Use ar-u-nu-latn to force Latin (Western) numerals even in Arabic locale
  let formatted = date.toLocaleTimeString(
    locale === "ar" ? "ar-u-nu-latn" : "en-US",
  );

  // Fallback: manually convert any Eastern Arabic numerals to Western
  if (locale === "ar") {
    formatted = convertToWesternNumerals(formatted);
  }

  return formatted;
};
