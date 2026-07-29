import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { CAUSES, selectionCost, selectionTotalUnits } from "@/lib/causes";
import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { parseCauseSelection } from "@/lib/stripe/validate";
import { validateEmail, validateName } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Donation-only Stripe Checkout — causes, no shipping / cart goods.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe is not configured. Use demo donate.",
        mode: "demo",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as {
    email?: string;
    name?: string;
    causeSelection?: unknown;
    userId?: string | null;
  };

  const emailResult = validateEmail(String(b.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const nameRaw = String(b.name ?? "").trim();
  let name = "Forest Buddies donor";
  if (nameRaw) {
    const nameResult = validateName(nameRaw, {
      required: false,
      max: 120,
      label: "Name",
    });
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 });
    }
    if (nameResult.value) name = nameResult.value;
  }

  const causeSelection = parseCauseSelection(b.causeSelection);
  if (selectionTotalUnits(causeSelection) < 1) {
    return NextResponse.json(
      { error: "Choose a cause amount to continue." },
      { status: 400 }
    );
  }

  const totalDollars = selectionCost(causeSelection);
  if (totalDollars < 0.5) {
    return NextResponse.json(
      { error: "Donation must be at least $0.50." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const cause of CAUSES) {
    const units = causeSelection[cause.id] || 0;
    if (units <= 0) continue;
    lineItems.push({
      quantity: units,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(cause.unitPrice * 100),
        product_data: {
          name: `Support: ${cause.name}`,
          description: `${cause.tagline} (illustrative partner-funded impact)`,
          metadata: { causeId: cause.id, kind: "cause_donation" },
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: emailResult.value,
      client_reference_id:
        typeof b.userId === "string" && b.userId
          ? b.userId.slice(0, 128)
          : undefined,
      line_items: lineItems,
      success_url: `${appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate`,
      billing_address_collection: "auto",
      allow_promotion_codes: false,
      metadata: {
        kind: "cause_donation",
        customerName: name.slice(0, 100),
        causeSelection: JSON.stringify(causeSelection).slice(0, 450),
        userId:
          typeof b.userId === "string" && b.userId ? b.userId.slice(0, 128) : "",
      },
      payment_intent_data: {
        metadata: {
          kind: "cause_donation",
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      mode: "live",
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("[stripe] create donate session failed", err);
    return NextResponse.json(
      { error: "Could not start donation checkout. Please try again." },
      { status: 502 }
    );
  }
}
