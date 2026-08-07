/**
 * Canonical public origin for redirects, emails, and Stripe return URLs.
 * Production must never fall back to *.vercel.app.
 */

export const PRODUCTION_APP_URL = "https://www.forestbuddies.com";

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/** Prefer explicit env, then production domain in prod — never Vercel preview hosts. */
export function getAppUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeOrigin(explicit);

  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) return PRODUCTION_APP_URL;

  return "http://localhost:3000";
}
