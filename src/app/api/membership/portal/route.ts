import { NextResponse } from "next/server";

import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { resolveStripeCustomerForEmail } from "@/lib/stripe/resolve-customer";
import { getStripe } from "@/lib/stripe/server";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Stripe Customer Portal — always for the signed-in Firebase email’s customer.
 * Never opens a portal for a stale stripeCustomerId belonging to another email.
 */
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

  const raw = body as {
    email?: string;
    customerId?: string | null;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json(
      { error: "Signed-in email is required to open the billing portal." },
      { status: 400 }
    );
  }

  const customerIdHint =
    typeof raw.customerId === "string" && raw.customerId.startsWith("cus_")
      ? raw.customerId
      : null;

  try {
    const resolved = await resolveStripeCustomerForEmail({
      email: emailResult.value,
      customerIdHint,
    });

    if (!resolved.customerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer found for this email. Open Membership to restore your plan.",
          ignoredStaleCustomerId: resolved.ignoredStaleCustomerId,
        },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: resolved.customerId,
      return_url: `${getAppUrl()}/membership`,
    });

    return NextResponse.json({
      url: portal.url,
      customerId: resolved.customerId,
      ignoredStaleCustomerId: resolved.ignoredStaleCustomerId,
    });
  } catch (err) {
    console.error("[stripe] portal session failed", err);
    return NextResponse.json(
      { error: "Could not open billing portal." },
      { status: 502 }
    );
  }
}
