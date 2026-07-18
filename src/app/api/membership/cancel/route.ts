import { NextResponse } from "next/server";

import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";

export const runtime = "nodejs";

/** Soft-cancel Impact Member at period end via Stripe. */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured.", mode: "demo" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const subscriptionId = String(
    (body as { subscriptionId?: string }).subscriptionId ?? ""
  ).trim();
  const resume = Boolean((body as { resume?: boolean }).resume);

  if (!subscriptionId.startsWith("sub_")) {
    return NextResponse.json(
      { error: "Missing Stripe subscription id." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !resume,
    });

    return NextResponse.json({
      mode: "live",
      subscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: getSubscriptionPeriodEnd(sub),
      status: sub.status,
    });
  } catch (err) {
    console.error("[stripe] cancel subscription failed", err);
    return NextResponse.json(
      { error: "Could not update subscription." },
      { status: 502 }
    );
  }
}
