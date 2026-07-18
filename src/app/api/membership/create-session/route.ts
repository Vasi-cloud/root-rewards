import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  getAppUrl,
  getImpactMemberPriceId,
  IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
  isStripeConfigured,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe is not configured. Use demo membership upgrade.",
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

  const raw = body as {
    email?: string;
    userId?: string | null;
    customerId?: string | null;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const priceId = getImpactMemberPriceId();
  const userId =
    typeof raw.userId === "string" ? raw.userId.slice(0, 128) : undefined;
  const existingCustomer =
    typeof raw.customerId === "string" && raw.customerId.startsWith("cus_")
      ? raw.customerId
      : undefined;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
            recurring: { interval: "month" },
            product_data: {
              name: "Forest Buddies Impact Member",
              description:
                "+25% affiliate boost, $8 monthly cause credit, Impact badge",
            },
          },
        },
      ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(existingCustomer
        ? { customer: existingCustomer }
        : { customer_email: emailResult.value }),
      client_reference_id: userId,
      line_items: lineItems,
      success_url: `${appUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/membership/cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          kind: "impact_member",
          tierId: "impact",
          userId: userId ?? "",
        },
      },
      metadata: {
        kind: "impact_member",
        tierId: "impact",
        userId: userId ?? "",
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    // Link subscription metadata to this session for webhook correlation
    if (session.subscription && typeof session.subscription === "string") {
      try {
        await stripe.subscriptions.update(session.subscription, {
          metadata: {
            kind: "impact_member",
            tierId: "impact",
            userId: userId ?? "",
            checkoutSessionId: session.id,
          },
        });
      } catch {
        // Subscription may not exist until Checkout completes — success webhook covers it.
      }
    }

    return NextResponse.json({
      mode: "live",
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("[stripe] create membership session failed", err);
    return NextResponse.json(
      { error: "Could not start membership checkout. Please try again." },
      { status: 502 }
    );
  }
}
