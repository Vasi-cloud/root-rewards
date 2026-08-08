import "server-only";

import { mkdirSync, appendFileSync, existsSync } from "fs";
import path from "path";
import { Resend } from "resend";

import {
  getEmailFrom,
  hasResendApiKey,
  type EmailSendResult,
} from "@/lib/email/config";

let resendSingleton: Resend | null = null;

function getResend(): Resend {
  if (!resendSingleton) {
    resendSingleton = new Resend(process.env.RESEND_API_KEY!.trim());
  }
  return resendSingleton;
}

function logDemoEmail(payload: {
  to: string;
  subject: string;
  text: string;
  kind: string;
}): string {
  const id = `demo_${Date.now().toString(36)}`;
  const entry = {
    id,
    at: new Date().toISOString(),
    kind: payload.kind,
    to: payload.to,
    subject: payload.subject,
    text: payload.text.slice(0, 2000),
  };
  console.info("[email:demo]", entry);
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, "email-log.jsonl"),
      `${JSON.stringify(entry)}\n`,
      "utf8"
    );
  } catch {
    // ignore read-only FS
  }
  return id;
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  const to = opts.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Invalid recipient email." };
  }

  // Demo path when Resend is not configured (local / preview without keys).
  if (!hasResendApiKey()) {
    const id = logDemoEmail({
      to,
      subject: opts.subject,
      text: opts.text,
      kind: opts.kind,
    });
    return { ok: true, mode: "demo", id };
  }

  const from = getEmailFrom();
  if (!from) {
    console.error(
      "[email] EMAIL_FROM is missing — refusing to send. Set EMAIL_FROM to e.g. Forest Buddies <noreply@forestbuddies.com>"
    );
    return {
      ok: false,
      error:
        "EMAIL_FROM is not configured. Set EMAIL_FROM to Forest Buddies <noreply@forestbuddies.com>.",
    };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      tags: [{ name: "kind", value: opts.kind.slice(0, 40) }],
    });

    if (error || !data?.id) {
      console.error("[email] Resend error", error);
      return {
        ok: false,
        error: error?.message ?? "Email provider rejected the message.",
      };
    }

    console.info("[email] sent", { kind: opts.kind, id: data.id, to });
    return { ok: true, mode: "live", id: data.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email send failed.",
    };
  }
}
