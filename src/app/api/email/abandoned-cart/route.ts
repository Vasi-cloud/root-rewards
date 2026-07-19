import { NextResponse } from "next/server";

import { isEmailConfigured } from "@/lib/email/config";
import { sendAbandonedCartEmail } from "@/lib/email/messages";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    email?: string;
    previewNames?: unknown;
    itemCount?: unknown;
    totalPrice?: unknown;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const previewNames = Array.isArray(raw.previewNames)
    ? raw.previewNames
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const itemCount = Math.min(
    200,
    Math.max(1, Math.floor(Number(raw.itemCount) || previewNames.length || 1))
  );
  const totalPrice = Math.min(
    100_000,
    Math.max(0, Number(Number(raw.totalPrice).toFixed(2)) || 0)
  );

  const result = await sendAbandonedCartEmail({
    to: emailResult.value,
    previewNames,
    itemCount,
    totalPrice,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    id: result.id,
    demo: result.mode === "demo",
    configured: isEmailConfigured(),
  });
}
