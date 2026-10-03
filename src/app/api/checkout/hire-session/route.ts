import { NextResponse } from "next/server";

import { createLeaValleyHireCheckoutSession } from "@/lib/stripe/hire-checkout";
import { getStripeKeyMode, isStripeConfigured } from "@/lib/stripe/config";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

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
    listingId?: string;
    listingTitle?: string;
    email?: string;
    dates?: string;
    treeAddon?: unknown;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  try {
    const session = await createLeaValleyHireCheckoutSession({
      requestId: String(raw.requestId ?? ""),
      listingId: typeof raw.listingId === "string" ? raw.listingId : undefined,
      listingTitle: String(raw.listingTitle ?? ""),
      email: emailResult.value,
      dates: String(raw.dates ?? ""),
      treeAddon: raw.treeAddon === true,
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
