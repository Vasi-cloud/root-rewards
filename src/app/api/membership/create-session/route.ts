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
  collectCustomerIdsByEmail,
  findBlockingImpactMembership,
} from "@/lib/stripe/reconcile-membership";
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
    subscriptionId?: string | null;
  };

  const emailResult = validateEmail(String(raw.email ?? ""));
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const membershipUrl = `${appUrl}/membership`;
  const priceId = getImpactMemberPriceId();
  const userId =
    typeof raw.userId === "string" ? raw.userId.slice(0, 128) : undefined;
  const customerIdHint =
    typeof raw.customerId === "string" && raw.customerId.startsWith("cus_")
      ? raw.customerId
      : null;
  const subscriptionIdHint =
    typeof raw.subscriptionId === "string" &&
    raw.subscriptionId.startsWith("sub_")
      ? raw.subscriptionId
      : null;

  // Hard guard: never open Checkout when an entitled Impact sub already exists.
  const existing = await findBlockingImpactMembership({
    email: emailResult.value,
    customerId: customerIdHint,
    subscriptionId: subscriptionIdHint,
    userId: userId ?? null,
  });

  // Fail closed — do not create a second Checkout if Stripe lookup failed.
  if (!existing.reconciled) {
    return NextResponse.json(
      {
        error:
          "Could not verify existing membership. Open Membership to continue — we will not start a new Checkout.",
        membershipUrl,
        alreadyMember: false,
      },
      { status: 409 }
    );
  }

  if (existing.tierId === "impact" && existing.subscriptionId) {
    let portalUrl: string | null = null;
    if (existing.customerId?.startsWith("cus_")) {
      try {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existing.customerId,
          return_url: membershipUrl,
        });
        portalUrl = portal.url;
      } catch (err) {
        console.warn("[stripe] portal for already-member skipped", err);
      }
    }
    return NextResponse.json({
      mode: "live",
      alreadyMember: true,
      customerId: existing.customerId,
      subscriptionId: existing.subscriptionId,
      periodEndsAt: existing.periodEndsAt,
      cancelAtPeriodEnd: existing.cancelAtPeriodEnd,
      membershipUrl,
      portalUrl,
    });
  }

  // Reuse one Stripe customer — never customer_email alone (that duplicates cus_).
  let customerId =
    customerIdHint ||
    (existing.customerId?.startsWith("cus_") ? existing.customerId : null);

  if (!customerId) {
    const byEmail = await collectCustomerIdsByEmail(
      stripe,
      emailResult.value
    );
    customerId = byEmail[0] ?? null;
  }

  if (!customerId) {
    try {
      const created = await stripe.customers.create({
        email: emailResult.value,
        metadata: {
          userId: userId ?? "",
          source: "impact_member_checkout",
        },
      });
      customerId = created.id;
    } catch (err) {
      console.error("[stripe] create customer for membership failed", err);
      return NextResponse.json(
        { error: "Could not start membership checkout. Please try again." },
        { status: 502 }
      );
    }
  }

  // Re-check after resolving customer (covers race / multi-cus_ emails)
  const recheck = await findBlockingImpactMembership({
    email: emailResult.value,
    customerId,
    subscriptionId: subscriptionIdHint,
    userId: userId ?? null,
  });
  if (
    recheck.reconciled &&
    recheck.tierId === "impact" &&
    recheck.subscriptionId
  ) {
    return NextResponse.json({
      mode: "live",
      alreadyMember: true,
      customerId: recheck.customerId,
      subscriptionId: recheck.subscriptionId,
      periodEndsAt: recheck.periodEndsAt,
      cancelAtPeriodEnd: recheck.cancelAtPeriodEnd,
      membershipUrl,
      portalUrl: null,
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
        // Subscription may not exist until Checkout completes.
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
