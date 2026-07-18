import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "@/lib/stripe/config";
import {
  fulfillCheckoutSession,
  membershipPayloadFromSubscription,
} from "@/lib/stripe/fulfillment";
import { markEventProcessed } from "@/lib/stripe/orders";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

/**
 * Stripe webhooks — production order confirmation & subscription lifecycle.
 * Signature verification is required. Events are processed idempotently.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!.trim()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe] webhook signature failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Acknowledge duplicates without re-running side effects
  const isNew = markEventProcessed(event.id);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const order = await fulfillCheckoutSession(session, "webhook");
        if (order?.kind === "impact_member" && order.subscriptionId) {
          await stripe.subscriptions.update(order.subscriptionId, {
            metadata: {
              kind: "impact_member",
              tierId: "impact",
              userId: order.userId ?? "",
              checkoutSessionId: session.id,
            },
          });
        }
        console.info("[stripe] order confirmed via webhook", {
          sessionId: session.id,
          orderNumber: order?.orderNumber,
          kind: order?.kind,
          amount: order?.amountTotalCents,
        });
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session, "webhook");
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn("[stripe] async payment failed", { id: session.id });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const payload = membershipPayloadFromSubscription(sub);
        console.info(`[stripe] ${event.type}`, payload);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("[stripe] invoice.payment_failed", {
          id: invoice.id,
          customer: invoice.customer,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler error", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
