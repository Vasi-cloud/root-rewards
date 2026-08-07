/**
 * Sitewide display currency — Forest Buddies® soft-launches in GBP.
 * Catalog / cart major units are pounds; Stripe uses pence (×100).
 */

export const DISPLAY_CURRENCY = "GBP" as const;
export const DISPLAY_CURRENCY_SYMBOL = "£";

/** Format a major-unit amount for UI (e.g. 5 → "£5.00"). */
export function formatMoney(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${DISPLAY_CURRENCY_SYMBOL}${n.toFixed(2)}`;
}

/** Whole pounds when exact (e.g. 5 → "£5"); otherwise two decimals. */
export function formatMoneyCompact(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  if (Number.isInteger(n)) return `${DISPLAY_CURRENCY_SYMBOL}${n}`;
  return formatMoney(n);
}

/** Stripe / API smallest unit (pence). */
export function toMinorUnits(major: number): number {
  return Math.round((Number.isFinite(major) ? major : 0) * 100);
}
