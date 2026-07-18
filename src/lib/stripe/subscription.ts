import type Stripe from "stripe";

/** Billing period end moved onto subscription items in newer Stripe API. */
export function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription | null | undefined
): string | null {
  if (!subscription) return null;
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  if (typeof fromItem === "number") {
    return new Date(fromItem * 1000).toISOString();
  }
  // Fallback for older shapes / expanded objects
  const legacy = (subscription as { current_period_end?: number })
    .current_period_end;
  if (typeof legacy === "number") {
    return new Date(legacy * 1000).toISOString();
  }
  return null;
}
