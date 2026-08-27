/**
 * Stripe configuration — secrets never leave the server.
 * Demo mode is the default until STRIPE_SECRET_KEY is set.
 */

export { getAppUrl, PRODUCTION_APP_URL } from "@/lib/app-url";

export type PaymentsMode = "live" | "demo";

export function getPaymentsMode(): PaymentsMode {
  return isStripeConfigured() ? "live" : "demo";
}

/** True when server can create Checkout Sessions and talk to Stripe. */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && key.startsWith("sk_"));
}

const WEBHOOK_SECRET_ENV_KEYS = [
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_WEBHOOK_SECRET_LIVE",
  "STRIPE_WEBHOOK_SECRET_TEST",
] as const;

/** Strip whitespace / wrapping quotes from a Dashboard or CLI whsec_ value. */
export function normalizeWebhookSecret(
  raw: string | undefined | null
): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (!s.startsWith("whsec_")) return null;
  return s;
}

/** Deduped webhook signing secrets from env (primary + optional live/test). */
export function normalizeWebhookSecrets(): string[] {
  const secrets: string[] = [];
  for (const key of WEBHOOK_SECRET_ENV_KEYS) {
    const normalized = normalizeWebhookSecret(process.env[key]);
    if (normalized && !secrets.includes(normalized)) secrets.push(normalized);
  }
  return secrets;
}

/** Env var names that currently hold a usable whsec_ (for safe logging only). */
export function listConfiguredWebhookSecretEnvNames(): string[] {
  return WEBHOOK_SECRET_ENV_KEYS.filter((key) =>
    Boolean(normalizeWebhookSecret(process.env[key]))
  );
}

export function isStripeWebhookConfigured(): boolean {
  return normalizeWebhookSecrets().length > 0;
}

export function getStripePublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key && key.startsWith("pk_") ? key : undefined;
}

/** Optional pre-created Price ID for Impact Member (£5/mo). */
export function getImpactMemberPriceId(): string | undefined {
  const id = process.env.STRIPE_PRICE_IMPACT_MEMBER?.trim();
  return id && id.startsWith("price_") ? id : undefined;
}

/** Impact Member list price in pence — must match membership catalog (£5). */
export const IMPACT_MEMBER_UNIT_AMOUNT_CENTS = 500;

/** Stripe Checkout currency for Forest Buddies® UK soft launch. */
export const STRIPE_CHECKOUT_CURRENCY = "gbp" as const;
