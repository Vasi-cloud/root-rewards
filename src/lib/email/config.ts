import "server-only";

import { getAppUrl } from "@/lib/app-url";

export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && key.startsWith("re_"));
}

export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Forest Buddies <onboarding@resend.dev>"
  );
}

export function getAppUrlForEmail(): string {
  return getAppUrl();
}

export type EmailSendResult =
  | { ok: true; mode: "live"; id: string }
  | { ok: true; mode: "demo"; id: string }
  | { ok: false; error: string };
