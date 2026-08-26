import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  CAUSES,
  giftTotal,
  giftsToIllustrativeUnits,
  parseCauseGifts,
} from "@/lib/causes";
import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { parseCauseSelection } from "@/lib/stripe/validate";
import { validateEmail, validateName } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Donation-only Stripe Checkout — causes, no shipping / cart goods.
 * Charges exact £ gifts (causeGifts); falls back to legacy unit pricing.
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
    causeGifts?: unknown;
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

  let causeGifts = parseCauseGifts(b.causeGifts);
  let totalDollars = giftTotal(causeGifts);
  let causeSelection = giftsToIllustrativeUnits(causeGifts);

  if (totalDollars < 0.5) {
    // Legacy: units × catalog unitPrice
    causeSelection = parseCauseSelection(b.causeSelection);
    for (const cause of CAUSES) {
      const units = causeSelection[cause.id] || 0;
      causeGifts[cause.id] = units > 0 ? units * cause.unitPrice : 0;
    }
    totalDollars = giftTotal(causeGifts);
    causeSelection = giftsToIllustrativeUnits(causeGifts);
  }

  if (totalDollars < 0.5) {
    return NextResponse.json(
      { error: "Choose at least £1 for one or more causes." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const cause of CAUSES) {
    const pounds = causeGifts[cause.id] || 0;
    if (pounds < 1) continue;
    const cents = Math.round(pounds * 100);
    if (cents < 50) continue;
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: cents,
        product_data: {
          name: `Support: ${cause.name}`,
          description: `${cause.tagline} (partner-funded / illustrative — not a GPS pin for a tree)`,
          metadata: { causeId: cause.id, kind: "cause_donation" },
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "Choose a cause amount to continue." },
      { status: 400 }
    );
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
        causeGifts: JSON.stringify(causeGifts).slice(0, 450),
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
