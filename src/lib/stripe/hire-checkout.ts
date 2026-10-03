import "server-only";

import {
  isLeaValleyHireListing,
  leaValleyHirePricePounds,
  leaValleyHireTitle,
} from "@/lib/lea-valley-guest";
import { getAppUrl, getStripeKeyMode, STRIPE_CHECKOUT_CURRENCY } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export async function createLeaValleyHireCheckoutSession(opts: {
  requestId: string;
  listingId?: string;
  listingTitle: string;
  email: string;
  dates: string;
}): Promise<{ url: string; sessionId: string }> {
  if (getStripeKeyMode() !== "test") {
    throw new Error("Hire payment stays on Stripe Test.");
  }

  const requestId = opts.requestId.trim().slice(0, 80);
  const listingTitle = leaValleyHireTitle(opts.listingId, opts.listingTitle);
  if (!requestId) throw new Error("Missing hire request.");
  if (
    !isLeaValleyHireListing({
      id: opts.listingId,
      name: listingTitle,
    })
  ) {
    throw new Error("This listing does not take hire payment here.");
  }

  const pounds = leaValleyHirePricePounds({
    id: opts.listingId,
    name: listingTitle,
  });
  if (!pounds || pounds < 1) {
    throw new Error("This listing has no hire price.");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const unitAmount = Math.round(pounds * 100);
  const dates = opts.dates.trim().slice(0, 200);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    adaptive_pricing: { enabled: false },
    customer_email: opts.email.trim().toLowerCase(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: STRIPE_CHECKOUT_CURRENCY,
          unit_amount: unitAmount,
          product_data: {
            name: listingTitle,
            description: dates
              ? `Dates · ${dates}. Collect at the lock.`
              : "Collect at the lock.",
            metadata: {
              productId: (opts.listingId ?? "").slice(0, 80),
              hireRequestId: requestId,
            },
          },
        },
      },
    ],
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/hire/pay/${encodeURIComponent(requestId)}`,
    billing_address_collection: "auto",
    allow_promotion_codes: false,
    metadata: {
      kind: "hire_request",
      hireRequestId: requestId,
      listingTitle: listingTitle.slice(0, 200),
      listingId: (opts.listingId ?? "").slice(0, 80),
      dates,
      hasHire: "1",
      sellerSharePounds: String(pounds),
      partnerPotPounds: "0",
      paidTotalPounds: String(pounds),
      currency: STRIPE_CHECKOUT_CURRENCY,
    },
    payment_intent_data: {
      metadata: {
        kind: "hire_request",
        hireRequestId: requestId,
        currency: STRIPE_CHECKOUT_CURRENCY,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { url: session.url, sessionId: session.id };
}
