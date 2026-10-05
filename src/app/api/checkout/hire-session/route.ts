import { NextResponse } from "next/server";

import { getCause, type CauseId } from "@/lib/causes";
import { getHireRequestForPay } from "@/lib/hire-pay-lookup";
import { createLeaValleyHireCheckoutSession } from "@/lib/stripe/hire-checkout";
import { getStripeKeyMode, isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";

const CAUSE_IDS = new Set<CauseId>([
  "trees",
  "ocean",
  "animals",
  "education",
  "climate",
]);

function parseOptionalPounds(raw: unknown): number | { error: string } {
  if (raw == null) return 0;
  const text = String(raw).trim();
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    return { error: "Enter an amount or leave it blank." };
  }
  const pounds = Math.round(n * 100) / 100;
  if (pounds > 500) return { error: "That optional amount is too high." };
  return pounds;
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || getStripeKeyMode() !== "test") {
    return NextResponse.json(
      { error: "Hire payment stays on Stripe Test." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    requestId?: string;
    causes?: Record<string, unknown>;
  };
  const requestId = String(raw.requestId ?? "").trim();
  const row = await getHireRequestForPay(requestId);
  if (!row) {
    return NextResponse.json(
      { error: "That hire request was not found." },
      { status: 404 }
    );
  }
  if (row.status === "Paid") {
    return NextResponse.json(
      { error: "This hire is already paid." },
      { status: 409 }
    );
  }
  if (row.status !== "Confirmed") {
    return NextResponse.json(
      { error: "The seller has not confirmed this request yet." },
      { status: 400 }
    );
  }

  const causes: { causeId: CauseId; pounds: number }[] = [];
  const rawCauses =
    raw.causes && typeof raw.causes === "object" ? raw.causes : {};
  for (const causeId of CAUSE_IDS) {
    const parsed = parseOptionalPounds(rawCauses[causeId]);
    if (typeof parsed !== "number") {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed > 0) {
      if (!getCause(causeId)) {
        return NextResponse.json(
          { error: "Choose a cause for that amount." },
          { status: 400 }
        );
      }
      causes.push({ causeId, pounds: parsed });
    }
  }

  try {
    const session = await createLeaValleyHireCheckoutSession({
      requestId: row.id,
      listingId: row.listingId,
      listingTitle: row.listingTitle,
      email: row.email,
      dates: row.dates,
      causes,
    });
    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start hire checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
