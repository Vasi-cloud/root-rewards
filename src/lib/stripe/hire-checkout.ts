import "server-only";

import { getCause } from "@/lib/causes";
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
  causeId?: string;
  causePounds?: number;
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

  const causePounds =
    typeof opts.causePounds === "number" && opts.causePounds > 0
      ? Math.round(opts.causePounds * 100) / 100
      : 0;
  const cause = causePounds > 0 ? getCause(opts.causeId ?? "") : undefined;
  if (causePounds > 0 && !cause) {
    throw new Error("Choose a cause for that amount.");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const dates = opts.dates.trim().slice(0, 200);
  const paidTotal = Math.round((pounds + causePounds) * 100) / 100;

  const lineItems: {
    quantity: number;
    price_data: {
      currency: typeof STRIPE_CHECKOUT_CURRENCY;
      unit_amount: number;
      product_data: {
        name: string;
        description?: string;
        metadata: Record<string, string>;
      };
    };
  }[] = [
    {
      quantity: 1,
      price_data: {
        currency: STRIPE_CHECKOUT_CURRENCY,
        unit_amount: Math.round(pounds * 100),
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
  ];
  if (cause && causePounds > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: STRIPE_CHECKOUT_CURRENCY,
        unit_amount: Math.round(causePounds * 100),
        product_data: {
          name: cause.name,
          description: "Optional amount",
          metadata: {
            hireRequestId: requestId,
            causeId: cause.id,
          },
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    adaptive_pricing: { enabled: false },
    customer_email: opts.email.trim().toLowerCase(),
    line_items: lineItems,
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel`,
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
      partnerPotPounds: String(causePounds),
      paidTotalPounds: String(paidTotal),
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
