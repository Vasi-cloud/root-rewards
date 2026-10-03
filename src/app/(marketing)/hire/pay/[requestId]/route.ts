import { NextResponse } from "next/server";

import { getHireRequest } from "@/lib/hire-requests-store";
import { createLeaValleyHireCheckoutSession } from "@/lib/stripe/hire-checkout";
import { getStripeKeyMode, isStripeConfigured } from "@/lib/stripe/config";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> | { requestId: string } }
) {
  if (!isStripeConfigured() || getStripeKeyMode() !== "test") {
    return NextResponse.json(
      { error: "Hire payment stays on Stripe Test." },
      { status: 503 }
    );
  }

  const params = await Promise.resolve(context.params);
  const requestId = decodeURIComponent(params.requestId ?? "").trim();
  const row = getHireRequest(requestId);
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

  try {
    const session = await createLeaValleyHireCheckoutSession({
      requestId: row.id,
      listingId: row.listingId,
      listingTitle: row.listingTitle,
      email: row.email,
      dates: row.dates,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not open Stripe Checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
