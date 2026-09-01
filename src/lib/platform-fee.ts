/**
 * Platform take on first-party (Stripe) sales — disclosed at checkout.
 * Not applied as a separate buyer surcharge; the line is honesty for shoppers.
 */
export const PLATFORM_FEE_PERCENT = 10;

export const PLATFORM_FEE_RATE = PLATFORM_FEE_PERCENT / 100;

/** Checkout / cart disclosure copy */
export function platformFeeIncludesLine(): string {
  return `Includes a ${PLATFORM_FEE_PERCENT}% platform fee.`;
}

/** Illustrative fee amount from a first-party goods subtotal (not added on top). */
export function platformFeeFromSubtotal(subtotalGbp: number): number {
  if (!(subtotalGbp > 0)) return 0;
  return Math.round(subtotalGbp * PLATFORM_FEE_RATE * 100) / 100;
}
