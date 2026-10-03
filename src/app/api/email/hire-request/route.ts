import { NextResponse } from "next/server";

import { isEmailConfigured } from "@/lib/email/config";
import { sendHireRequestDecisionEmail } from "@/lib/email/messages";
import { isLeaValleyHireListing } from "@/lib/lea-valley-guest";
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
    listingTitle?: string;
    dates?: string;
    decision?: string;
    requestId?: string;
    listingId?: string;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const listingTitle = String(raw.listingTitle ?? "").trim().slice(0, 200);
  const listingId = String(raw.listingId ?? "").trim().slice(0, 80);
  const dates = String(raw.dates ?? "").trim().slice(0, 200);
  const decision = raw.decision === "Declined" ? "Declined" : raw.decision;
  if (decision !== "Confirmed" && decision !== "Declined") {
    return NextResponse.json({ error: "Choose Confirm or Decline." }, { status: 400 });
  }
  if (!listingTitle || !dates) {
    return NextResponse.json({ error: "Listing and dates are required." }, { status: 400 });
  }
  if (!isLeaValleyHireListing({ id: listingId, name: listingTitle })) {
    return NextResponse.json({ error: "This listing does not take hire mail here." }, { status: 400 });
  }

  const result = await sendHireRequestDecisionEmail({
    to: emailResult.value,
    listingTitle,
    dates,
    decision,
    requestId: String(raw.requestId ?? "").trim().slice(0, 80) || undefined,
    listingId: listingId || undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    id: result.id,
    configured: isEmailConfigured(),
  });
}
