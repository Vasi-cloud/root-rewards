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
  causes?: { causeId: string; pounds: number }[];
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

  const causeLines: { causeId: string; name: string; pounds: number }[] = [];
  const seen = new Set<string>();
  for (const item of opts.causes ?? []) {
    const pounds =
      typeof item.pounds === "number" && item.pounds > 0
        ? Math.round(item.pounds * 100) / 100
        : 0;
    if (pounds <= 0) continue;
    const cause = getCause(item.causeId);
    if (!cause || seen.has(cause.id)) {
      throw new Error("Choose a cause for that amount.");
    }
    seen.add(cause.id);
    causeLines.push({ causeId: cause.id, name: cause.name, pounds });
  }
  const causePounds =
    Math.round(causeLines.reduce((sum, line) => sum + line.pounds, 0) * 100) /
    100;

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
  for (const line of causeLines) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: STRIPE_CHECKOUT_CURRENCY,
        unit_amount: Math.round(line.pounds * 100),
        product_data: {
          name: line.name,
          description: "Optional amount",
          metadata: {
            hireRequestId: requestId,
            causeId: line.causeId,
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
