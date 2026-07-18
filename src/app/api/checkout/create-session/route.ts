import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { CAUSES } from "@/lib/causes";
import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { validateCheckoutBody } from "@/lib/stripe/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe is not configured. Use demo checkout.",
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
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    data.lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unitAmountCents,
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
        currency: "usd",
        unit_amount: Math.round(cause.unitPrice * 100),
        product_data: {
          name: `Impact: ${cause.name}`,
          description: cause.tagline,
          metadata: { causeId: cause.id },
        },
      },
    });
  }

  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  let couponId: string | undefined;

  if (data.memberCreditCents > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: data.memberCreditCents,
      currency: "usd",
      duration: "once",
      name: "Impact Member cause credit",
      max_redemptions: 1,
    });
    couponId = coupon.id;
    discounts.push({ coupon: coupon.id });
  }

  try {
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
        allowed_countries: ["US", "CA", "GB", "IE", "AU", "NZ", "DE", "FR", "NL", "ES", "IT"],
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
        ...(couponId ? { memberCreditCoupon: couponId } : {}),
      },
      payment_intent_data: {
        metadata: {
          kind: "marketplace_order",
          userId: data.userId ?? "",
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
    console.error("[stripe] create checkout session failed", err);
    return NextResponse.json(
      { error: "Could not start Stripe Checkout. Please try again." },
      { status: 502 }
    );
  }
}
