/**
 * Date utility functions for subscription management
 */

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);

  // Handle edge cases where day might not exist in target month
  // (e.g., Jan 31 + 1 month = Feb 28/29, not Mar 3)
  if (result.getDate() !== date.getDate()) {
    result.setDate(0); // Set to last day of previous month
  }

  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
