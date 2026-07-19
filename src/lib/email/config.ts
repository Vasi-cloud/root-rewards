import "server-only";

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
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export type EmailSendResult =
  | { ok: true; mode: "live"; id: string }
  | { ok: true; mode: "demo"; id: string }
  | { ok: false; error: string };
