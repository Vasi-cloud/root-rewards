import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { IMPACT_MEMBER_STRIPE_DESCRIPTION } from "@/lib/membership";
import {
  getAppUrl,
  getImpactMemberPriceId,
  IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
  isStripeConfigured,
} from "@/lib/stripe/config";
import {
  findOpenSubscriptionCheckoutUrl,
  guardImpactSubscriptionCheckout,
} from "@/lib/stripe/guard-impact-checkout";
import { getStripe } from "@/lib/stripe/server";
import { validateEmail } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * ONLY server entry that may create Impact Member (mode: subscription) Checkout.
 * Donate + marketplace checkout use mode: payment — not this route.
 */
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
  const customerIdHint =
    typeof raw.customerId === "string" && raw.customerId.startsWith("cus_")
      ? raw.customerId
      : null;

  const guard = await guardImpactSubscriptionCheckout({
    email: emailResult.value,
    customerIdHint,
    userId: userId ?? null,
  });

  if (guard.block && guard.alreadyMember) {
    return NextResponse.json({
      mode: "live",
      alreadyMember: true,
      customerId: guard.customerId,
      subscriptionId: guard.subscriptionId,
      subscriptionIds: guard.subscriptionIds,
      periodEndsAt: guard.periodEndsAt,
      cancelAtPeriodEnd: guard.cancelAtPeriodEnd,
      url: guard.url,
      membershipUrl: guard.url,
      portalUrl: guard.portalUrl,
    });
  }

  if (guard.block && !guard.alreadyMember) {
    return NextResponse.json(
      {
        error: guard.error,
        membershipUrl: guard.url,
        url: guard.url,
        alreadyMember: false,
      },
      { status: 409 }
    );
  }

  if (guard.block || !("customerId" in guard)) {
    return NextResponse.json(
      {
        error: "Could not resolve Stripe customer for membership.",
        membershipUrl: `${appUrl}/membership`,
        url: `${appUrl}/membership`,
      },
      { status: 409 }
    );
  }

  const customerId = guard.customerId;

  // Reuse an already-open subscription Checkout instead of creating another
  const openUrl = await findOpenSubscriptionCheckoutUrl(customerId);
  if (openUrl) {
    console.info("[stripe] returning existing open Impact Checkout", {
      email: emailResult.value,
      customerId,
    });
    return NextResponse.json({
      mode: "live",
      sessionId: null,
      url: openUrl,
    });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
            recurring: { interval: "month" },
            product_data: {
              name: "Forest Buddies Impact Member",
              description: IMPACT_MEMBER_STRIPE_DESCRIPTION,
            },
          },
        },
      ];

  try {
    // Final moment-of-create re-list (race: parallel Upgrade clicks)
    const fresh = await guardImpactSubscriptionCheckout({
      email: emailResult.value,
      customerIdHint: customerId,
      userId: userId ?? null,
    });
    if (fresh.block && fresh.alreadyMember) {
      return NextResponse.json({
        mode: "live",
        alreadyMember: true,
        customerId: fresh.customerId,
        subscriptionId: fresh.subscriptionId,
        subscriptionIds: fresh.subscriptionIds,
        periodEndsAt: fresh.periodEndsAt,
        cancelAtPeriodEnd: fresh.cancelAtPeriodEnd,
        url: fresh.url,
        membershipUrl: fresh.url,
        portalUrl: fresh.portalUrl,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      adaptive_pricing: { enabled: false },
      customer: customerId,
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
