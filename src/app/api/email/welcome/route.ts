import { NextResponse } from "next/server";

import { sendWelcomeEmail } from "@/lib/email/messages";
import { isEmailConfigured } from "@/lib/email/config";
import { validateEmail, validateName } from "@/lib/validation";

export const runtime = "nodejs";

const welcomed = new Set<string>();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as { email?: string; name?: string; userId?: string };
  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const nameResult = validateName(String(raw.name ?? ""), {
    required: false,
    max: 80,
    label: "Name",
  });
  const dedupeKey = (raw.userId?.trim() || emailResult.value).toLowerCase();
  if (welcomed.has(dedupeKey)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      mode: isEmailConfigured() ? "live" : "demo",
    });
  }

  const result = await sendWelcomeEmail({
    to: emailResult.value,
    name: nameResult.ok ? nameResult.value : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  welcomed.add(dedupeKey);
  return NextResponse.json({
    ok: true,
    mode: result.mode,
    id: result.id,
  });
}
