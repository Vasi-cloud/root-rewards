import { NextResponse } from "next/server";

import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";

export const runtime = "nodejs";

/** Verify a completed Checkout Session (payment or subscription). */
export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured.", mode: "demo" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "payment_intent"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";

    const subscription =
      typeof session.subscription === "object" && session.subscription
        ? session.subscription
        : null;

    return NextResponse.json({
      mode: "live",
      id: session.id,
      kind: session.metadata?.kind ?? null,
      status: session.status,
      paymentStatus: session.payment_status,
      paid,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? session.customer_email,
      customerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
      subscriptionId: subscription?.id ?? (
        typeof session.subscription === "string" ? session.subscription : null
      ),
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
      metadata: session.metadata ?? {},
    });
  } catch (err) {
    console.error("[stripe] retrieve session failed", err);
    return NextResponse.json(
      { error: "Could not verify payment session." },
      { status: 502 }
    );
  }
}
