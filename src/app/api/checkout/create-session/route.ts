import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { CAUSES } from "@/lib/causes";
import {
  getAppUrl,
  isStripeConfigured,
  STRIPE_CHECKOUT_CURRENCY,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { validateCheckoutBody } from "@/lib/stripe/validate";

export const runtime = "nodejs";

function stripeErrorPayload(err: unknown): {
  status: number;
  error: string;
  type?: string;
} {
  if (err && typeof err === "object") {
    const e = err as {
      type?: string;
      code?: string;
      message?: string;
      statusCode?: number;
      rawType?: string;
    };
    const type = e.type || e.rawType || e.code || "StripeError";
    const message =
      typeof e.message === "string" && e.message.trim()
        ? e.message.trim()
        : "Stripe request failed.";
    const status =
      typeof e.statusCode === "number" && e.statusCode >= 400 && e.statusCode < 600
        ? e.statusCode === 502
          ? 500
          : e.statusCode
        : 400;
    return { status: status >= 500 ? 500 : 400, error: message, type };
  }
  return {
    status: 500,
    error: err instanceof Error ? err.message : "Could not start checkout.",
    type: "UnknownError",
  };
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    console.error(
      "[stripe] STRIPE_SECRET_KEY missing or invalid (expected sk_…)"
    );
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY (sk_test_… or sk_live_…) to enable checkout.",
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

  const parsed = validateCheckoutBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;

  // Stripe card payments require a positive total (min 50p in GBP).
  if (data.totalCents < 50) {
    return NextResponse.json(
      {
        error:
          "Order total must be at least £0.50 after cause credit. Add items or reduce credit applied.",
      },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const appUrl = getAppUrl();

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      data.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: STRIPE_CHECKOUT_CURRENCY,
          unit_amount: Math.round(item.unitAmountCents),
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            metadata: { productId: item.id },
          },
        },
      }));

    for (const cause of CAUSES) {
      const units = data.causeSelection[cause.id] || 0;
      if (units <= 0) continue;
      stripeLineItems.push({
        quantity: units,
        price_data: {
          currency: STRIPE_CHECKOUT_CURRENCY,
          unit_amount: Math.round(cause.unitPrice * 100),
          product_data: {
            name: `Impact: ${cause.name}`,
            description: `${cause.tagline} (illustrative partner-funded impact)`,
            metadata: { causeId: cause.id },
          },
        },
      });
    }

    if (stripeLineItems.length === 0) {
      return NextResponse.json(
        { error: "Nothing to charge — cart and causes are empty." },
        { status: 400 }
      );
    }

    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    let couponId: string | undefined;

    if (data.memberCreditCents > 0) {
      // Credit only offsets cause line items; never drive total ≤ 0.
      const maxCredit = Math.min(
        data.memberCreditCents,
        data.causesCents,
        Math.max(0, data.goodsCents + data.causesCents - 50)
      );
      if (maxCredit > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: maxCredit,
          currency: STRIPE_CHECKOUT_CURRENCY,
          duration: "once",
          name: "Impact Member cause credit",
          max_redemptions: 1,
        });
        couponId = coupon.id;
        discounts.push({ coupon: coupon.id });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.email,
      client_reference_id: data.userId ?? undefined,
      line_items: stripeLineItems,
      ...(discounts.length > 0 ? { discounts } : {}),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: [
          "GB",
          "IE",
          "US",
          "CA",
          "AU",
          "NZ",
          "DE",
          "FR",
          "NL",
          "ES",
          "IT",
        ],
      },
      phone_number_collection: { enabled: false },
      allow_promotion_codes: false,
      metadata: {
        kind: "marketplace_order",
        customerName: data.name.slice(0, 100),
        shippingAddress: data.address.slice(0, 200),
        shippingCity: data.city.slice(0, 80),
        shippingZip: data.zip.slice(0, 20),
        memberCreditCents: String(data.memberCreditCents),
        causeSelection: JSON.stringify(data.causeSelection).slice(0, 450),
        userId: data.userId ?? "",
        currency: STRIPE_CHECKOUT_CURRENCY,
        ...(couponId ? { memberCreditCoupon: couponId } : {}),
      },
      payment_intent_data: {
        metadata: {
          kind: "marketplace_order",
          userId: data.userId ?? "",
          currency: STRIPE_CHECKOUT_CURRENCY,
        },
      },
    });

    if (!session.url) {
      console.error("[stripe] checkout session missing url", {
        sessionId: session.id,
      });
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mode: "live",
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    const payload = stripeErrorPayload(err);
    console.error("[stripe] create checkout session failed", {
      type: payload.type,
      error: payload.error,
      totalCents: data.totalCents,
      memberCreditCents: data.memberCreditCents,
    });
    return NextResponse.json(
      { error: payload.error, type: payload.type },
      { status: payload.status }
    );
  }
}
