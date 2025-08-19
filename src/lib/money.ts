export function formatCents(cents: number, currency?: string) {
  return `${(cents / 100).toFixed(2)} ${currency?.toUpperCase() ?? ""}`;
}
