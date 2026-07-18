import { NextResponse } from "next/server";

import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

/** Stripe Customer Portal — manage / cancel subscription securely. */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured.", mode: "demo" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const customerId = String(
    (body as { customerId?: string }).customerId ?? ""
  ).trim();
  if (!customerId.startsWith("cus_")) {
    return NextResponse.json(
      { error: "Missing Stripe customer id. Re-subscribe or contact support." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/membership`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[stripe] portal session failed", err);
    return NextResponse.json(
      { error: "Could not open billing portal." },
      { status: 502 }
    );
  }
}
