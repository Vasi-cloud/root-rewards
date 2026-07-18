import "server-only";

import type Stripe from "stripe";

import {
  getOrderBySessionId,
  makeOrderNumber,
  parseCauseSelectionFromMetadata,
  saveConfirmedOrder,
  type ConfirmedOrder,
  type OrderKind,
} from "@/lib/stripe/orders";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";

function customerIdOf(
  session: Stripe.Checkout.Session
): string | null {
  if (typeof session.customer === "string") return session.customer;
  return session.customer?.id ?? null;
}

function subscriptionIdOf(
  session: Stripe.Checkout.Session
): string | null {
  if (typeof session.subscription === "string") return session.subscription;
  return session.subscription?.id ?? null;
}

function kindOf(session: Stripe.Checkout.Session): OrderKind {
  if (session.mode === "subscription" || session.metadata?.kind === "impact_member") {
    return "impact_member";
  }
  return "marketplace_order";
}

async function loadLineItems(
  session: Stripe.Checkout.Session
): Promise<ConfirmedOrder["lineItems"]> {
  if (session.line_items?.data?.length) {
    return session.line_items.data.map((li) => ({
      name: li.description ?? li.price?.nickname ?? "Item",
      quantity: li.quantity ?? 1,
      amountCents: li.amount_total ?? 0,
    }));
  }

  try {
    const stripe = getStripe();
    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 50,
    });
    return items.data.map((li) => ({
      name: li.description ?? "Item",
      quantity: li.quantity ?? 1,
      amountCents: li.amount_total ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Idempotent order confirmation from a paid Checkout Session.
 * Safe to call from webhook and success page (whichever arrives first wins).
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  fulfilledBy: ConfirmedOrder["fulfilledBy"]
): Promise<ConfirmedOrder | null> {
  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid && session.status !== "complete") {
    return null;
  }

  const existing = getOrderBySessionId(session.id);
  if (existing) return existing;

  const meta = session.metadata ?? {};
  const lineItems = await loadLineItems(session);
  const memberCreditCents = Math.max(
    0,
    Math.floor(Number(meta.memberCreditCents) || 0)
  );

  const order: ConfirmedOrder = {
    id: session.id,
    orderNumber: makeOrderNumber(session.id),
    kind: kindOf(session),
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotalCents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? null,
    customerId: customerIdOf(session),
    subscriptionId: subscriptionIdOf(session),
    userId: meta.userId || session.client_reference_id || null,
    customerName: meta.customerName ?? session.customer_details?.name ?? null,
    shipping: {
      address: meta.shippingAddress ?? null,
      city: meta.shippingCity ?? null,
      zip: meta.shippingZip ?? null,
    },
    causeSelection: parseCauseSelectionFromMetadata(meta.causeSelection),
    memberCreditCents,
    lineItems,
    fulfilledAt: new Date().toISOString(),
    fulfilledBy,
    status: "fulfilled",
  };

  return saveConfirmedOrder(order);
}

export async function retrieveAndFulfillSession(
  sessionId: string,
  fulfilledBy: ConfirmedOrder["fulfilledBy"]
): Promise<ConfirmedOrder | null> {
  const existing = getOrderBySessionId(sessionId);
  if (existing) return existing;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "subscription", "customer"],
  });
  return fulfillCheckoutSession(session, fulfilledBy);
}

export type MembershipSyncPayload = {
  customerId: string | null;
  subscriptionId: string | null;
  periodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  status: string;
};

export function membershipPayloadFromSubscription(
  sub: Stripe.Subscription
): MembershipSyncPayload {
  return {
    customerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    subscriptionId: sub.id,
    periodEndsAt: getSubscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    status: sub.status,
  };
}
