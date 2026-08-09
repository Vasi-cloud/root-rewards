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
 *
 * Dashboard endpoint (Production):
 *   https://www.forestbuddies.com/api/webhooks/stripe
 *
 * Env:
 *   STRIPE_WEBHOOK_SECRET — primary signing secret (test or live)
 *   STRIPE_WEBHOOK_SECRET_LIVE — optional second secret when both modes are used
 *   STRIPE_WEBHOOK_SECRET_TEST — optional test-mode secret alongside live
 *
 * After a valid signature, we return HTTP 2xx even if side-effects fail,
 * so Stripe does not retry forever on application bugs. Errors are logged.
 */

function webhookSecrets(): string[] {
  const keys = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_LIVE,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && s.startsWith("whsec_")));
  return [...new Set(keys)];
}

function constructEvent(
  stripe: Stripe,
  body: string,
  signature: string
): Stripe.Event {
  const secrets = webhookSecrets();
  if (secrets.length === 0) {
    throw new Error("No STRIPE_WEBHOOK_SECRET configured.");
  }

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Invalid signature");
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    console.error("[stripe] webhook: STRIPE_SECRET_KEY missing");
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }
  if (!isStripeWebhookConfigured() && webhookSecrets().length === 0) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read body." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = constructEvent(stripe, body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe] webhook signature failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Acknowledge duplicates quickly (2xx)
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
          try {
            await stripe.subscriptions.update(order.subscriptionId, {
              metadata: {
                kind: "impact_member",
                tierId: "impact",
                userId: order.userId ?? "",
                checkoutSessionId: session.id,
              },
            });
          } catch (metaErr) {
            console.warn(
              "[stripe] subscription metadata update failed",
              metaErr
            );
          }
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
        console.info(`[stripe] ${event.type}`, {
          ...payload,
          status: sub.status,
          kind: sub.metadata?.kind ?? null,
        });
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
        console.info("[stripe] webhook ignored event", { type: event.type });
        break;
    }
  } catch (err) {
    // Valid signature + received: return 2xx so Stripe stops infinite retries
    // on application/logic bugs. Investigate via logs.
    console.error("[stripe] webhook handler error (acknowledged)", {
      type: event.type,
      id: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({
      received: true,
      handled: false,
      error: "Handler error logged",
    });
  }

  return NextResponse.json({ received: true });
}
