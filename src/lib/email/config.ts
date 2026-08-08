import "server-only";

import { getAppUrl } from "@/lib/app-url";

/** True when RESEND_API_KEY looks like a Resend secret. */
export function hasResendApiKey(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && key.startsWith("re_"));
}

/**
 * Production From address — EMAIL_FROM only.
 * Expected: Forest Buddies <noreply@forestbuddies.com>
 * No Gmail / resend.dev fallbacks.
 */
export function getEmailFrom(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function hasEmailFrom(): boolean {
  return Boolean(getEmailFrom());
}

/** Live sends require both API key and EMAIL_FROM. */
export function isEmailConfigured(): boolean {
  return hasResendApiKey() && hasEmailFrom();
}

export function getAppUrlForEmail(): string {
  return getAppUrl();
}

export type EmailSendResult =
  | { ok: true; mode: "live"; id: string }
  | { ok: true; mode: "demo"; id: string }
  | { ok: false; error: string };
