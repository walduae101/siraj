/**
 * RTL (Right-to-Left) utilities for Arabic/English support
 */

/**
 * Convert Western Arabic numerals to Eastern Arabic-Indic numerals
 * Used for displaying numbers in Arabic locale
 */
export function toArabicDigits(n: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/[0-9]/g, (digit) => arabicDigits[parseInt(digit)]);
}

/**
 * Format number with Arabic digits and proper locale formatting
 */
export function formatNumberWithArabicDigits(n: number, locale: string = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale).format(n);
  return locale === 'ar' ? toArabicDigits(formatted) : formatted;
}

/**
 * Get RTL-aware icon direction
 * Returns 'left' for RTL (forward direction) and 'right' for LTR
 */
export function getRTLIconDirection(isRTL: boolean = true): 'left' | 'right' {
  return isRTL ? 'left' : 'right';
}

/**
 * Get RTL-aware text alignment class
 */
export function getRTLTextAlign(isRTL: boolean = true): string {
  return isRTL ? 'text-right' : 'text-left';
}

/**
 * Get RTL-aware flex alignment
 */
export function getRTLFlexAlign(isRTL: boolean = true): string {
  return isRTL ? 'justify-end' : 'justify-start';
}

/**
 * Check if current locale is RTL
 */
export function isRTLLocale(locale?: string): boolean {
  if (!locale) {
    // Default to Arabic for this app
    return true;
  }
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale);
}
