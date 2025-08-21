// Helper to convert Eastern Arabic numerals to Western Arabic numerals
const convertToWesternNumerals = (str: string): string => {
  const arabicToWestern: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  return str.replace(/[٠-٩]/g, (char) => arabicToWestern[char] || char);
};

export const fmtInt = (n: number, locale: "en" | "ar" = "en") => {
  // First try the proper locale with Latin numerals
  let formatted = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", {
    maximumFractionDigits: 0,
  }).format(n);
  
  // Fallback: manually convert any Eastern Arabic numerals to Western
  if (locale === "ar") {
    formatted = convertToWesternNumerals(formatted);
  }
  
  return formatted;
};

export const fmtNum = fmtInt;
