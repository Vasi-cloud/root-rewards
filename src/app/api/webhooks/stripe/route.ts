import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  isStripeConfigured,
  listConfiguredWebhookSecretEnvNames,
  normalizeWebhookSecrets,
} from "@/lib/stripe/config";
import {
  fulfillCheckoutSession,
  membershipPayloadFromSubscription,
} from "@/lib/stripe/fulfillment";
import { getOrderBySessionId, markEventProcessed } from "@/lib/stripe/orders";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhooks — production order confirmation & subscription lifecycle.
 *
 * Dashboard endpoint:
 *   https://www.forestbuddies.com/api/webhooks/stripe
 *
 * Env (signing secrets — must match the Stripe Dashboard endpoint that posts here):
 *   STRIPE_WEBHOOK_SECRET — primary (often Test while soft-launching)
 *   STRIPE_WEBHOOK_SECRET_LIVE — optional Live-mode endpoint secret
 *   STRIPE_WEBHOOK_SECRET_TEST — optional Test-mode endpoint secret
 *
 * After a valid signature we always return HTTP 2xx (including duplicates and
 * handler/email failures) so Stripe does not retry forever. Errors are logged.
 */

function constructEvent(
  stripe: Stripe,
  payload: Buffer,
  signature: string
): Stripe.Event {
  const secrets = normalizeWebhookSecrets();
  if (secrets.length === 0) {
    throw new Error("No STRIPE_WEBHOOK_SECRET configured.");
  }

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      // Buffer preserves the exact bytes Stripe signed (preferred over string).
      return stripe.webhooks.constructEvent(payload, signature, secret);
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

  const secrets = normalizeWebhookSecrets();
  if (secrets.length === 0) {
    console.error(
      "[stripe] webhook: no STRIPE_WEBHOOK_SECRET* env vars starting with whsec_"
    );
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 }
    );
  }

  const stripe = getStripe();

  let payload: Buffer;
  try {
    payload = Buffer.from(await request.arrayBuffer());
  } catch (err) {
    console.error("[stripe] webhook: could not read raw body", err);
    return NextResponse.json({ error: "Could not read body." }, { status: 400 });
  }

  const signature =
    request.headers.get("stripe-signature") ??
    request.headers.get("Stripe-Signature");
  if (!signature) {
    console.error("[stripe] webhook: missing stripe-signature header", {
      bodyBytes: payload.length,
    });
    return NextResponse.json(
      { error: "Missing stripe-signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = constructEvent(stripe, payload, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    // Real cause for Dashboard Test → prod URL mismatches is almost always
    // the wrong endpoint signing secret (Test vs Live / CLI vs Dashboard).
    console.error("[stripe] webhook signature failed", {
      error: message,
      bodyBytes: payload.length,
      secretSlots: listConfiguredWebhookSecretEnvNames(),
      secretCount: secrets.length,
      signaturePresent: true,
      hint:
        "Use the Signing secret from Stripe Dashboard → Developers → Webhooks → this endpoint (Test mode secret for Test events). CLI `stripe listen` secrets do not validate Dashboard deliveries.",
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Idempotent: duplicate deliveries → 200, never 400.
  let isNew = true;
  try {
    isNew = markEventProcessed(event.id);
  } catch (err) {
    console.error("[stripe] webhook: markEventProcessed failed (continuing)", {
      eventId: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  if (!isNew) {
    console.info("[stripe] webhook duplicate event acknowledged", {
      id: event.id,
      type: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const existing = getOrderBySessionId(session.id);
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
              metaErr instanceof Error ? metaErr.message : metaErr
            );
          }
        }

        console.info("[stripe] checkout.session.completed handled", {
          sessionId: session.id,
          orderNumber: order?.orderNumber ?? null,
          kind: order?.kind ?? null,
          amount: order?.amountTotalCents ?? null,
          alreadyExisted: Boolean(existing),
          emailMode: order?.confirmationEmailMode ?? null,
          causes: order?.causeSelection ?? null,
          causeGifts: order?.causeGifts ?? null,
        });
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const existing = getOrderBySessionId(session.id);
        const order = await fulfillCheckoutSession(session, "webhook");
        console.info("[stripe] async_payment_succeeded handled", {
          sessionId: session.id,
          orderNumber: order?.orderNumber ?? null,
          alreadyExisted: Boolean(existing),
        });
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
        const payloadMembership = membershipPayloadFromSubscription(sub);
        console.info(`[stripe] ${event.type}`, {
          ...payloadMembership,
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
    // Valid signature: always 2xx. Log the real error for ops.
    console.error("[stripe] webhook handler error (acknowledged 200)", {
      type: event.type,
      id: event.id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({
      received: true,
      handled: false,
      error: "Handler error logged",
    });
  }

  return NextResponse.json({ received: true });
}
