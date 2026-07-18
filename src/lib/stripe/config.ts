/**
 * Stripe configuration — secrets never leave the server.
 * Demo mode is the default until STRIPE_SECRET_KEY is set.
 */

export type PaymentsMode = "live" | "demo";

export function getPaymentsMode(): PaymentsMode {
  return isStripeConfigured() ? "live" : "demo";
}

/** True when server can create Checkout Sessions and talk to Stripe. */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && key.startsWith("sk_"));
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function getStripePublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key && key.startsWith("pk_") ? key : undefined;
}

/** Optional pre-created Price ID for Impact Member ($9/mo). */
export function getImpactMemberPriceId(): string | undefined {
  const id = process.env.STRIPE_PRICE_IMPACT_MEMBER?.trim();
  return id && id.startsWith("price_") ? id : undefined;
}

export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/** Impact Member list price in cents — must match membership catalog. */
export const IMPACT_MEMBER_UNIT_AMOUNT_CENTS = 900;
