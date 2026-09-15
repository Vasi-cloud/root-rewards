import "server-only";

import {
  getStripeKeyMode,
  isStripeConfigured,
  STRIPE_CHECKOUT_CURRENCY,
} from "@/lib/stripe/config";
import {
  listConfirmedOrders,
  makeOrderNumber,
  type ConfirmedOrder,
} from "@/lib/stripe/orders";
import { getStripe } from "@/lib/stripe/server";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerEmail: string | null;
  amountTotalCents: number;
  currency: string;
  status: string;
  kind: "marketplace_order" | "impact_member" | string;
  itemCount: number;
  fulfilledAt: string;
  source: "local" | "stripe";
};

function fromConfirmed(order: ConfirmedOrder): AdminOrderRow {
  return {
    id: order.sessionId,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    amountTotalCents: order.amountTotalCents,
    currency: (order.currency || STRIPE_CHECKOUT_CURRENCY).toLowerCase(),
    status: order.status,
    kind: order.kind,
    itemCount: order.lineItems.reduce((n, li) => n + (li.quantity || 1), 0),
    fulfilledAt: order.fulfilledAt,
    source: "local",
  };
}

async function listPaidCheckoutSessionsFromStripe(): Promise<AdminOrderRow[]> {
  if (!isStripeConfigured()) return [];
  const stripe = getStripe();
  const rows: AdminOrderRow[] = [];
  let startingAfter: string | undefined;

  for (let i = 0; i < 5; i++) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const session of page.data) {
      const paid =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required";
      if (!paid) continue;

      const metaKind = session.metadata?.kind?.trim() || "";
      // Marketplace first-party only — skip membership + donate checkouts.
      if (metaKind === "impact_member" || metaKind === "cause_donation") {
        continue;
      }
      if (metaKind && metaKind !== "marketplace_order") {
        continue;
      }
      if (!metaKind && session.mode !== "payment") {
        continue;
      }

      rows.push({
        id: session.id,
        orderNumber: makeOrderNumber(session.id),
        customerEmail:
          session.customer_details?.email ?? session.customer_email ?? null,
        amountTotalCents: session.amount_total ?? 0,
        currency: (session.currency || STRIPE_CHECKOUT_CURRENCY).toLowerCase(),
        status: session.payment_status || "paid",
        kind: "marketplace_order",
        itemCount: 0,
        fulfilledAt: new Date(
          (session.created || Math.floor(Date.now() / 1000)) * 1000
        ).toISOString(),
        source: "stripe",
      });
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return rows;
}

/**
 * Admin Orders: local fulfilled store first, then Stripe Checkout sessions.
 * Always GBP soft-launch — amounts in minor units with currency field.
 */
export async function listAdminOrders(): Promise<{
  mode: "live" | "demo";
  keyMode: "test" | "live" | null;
  orders: AdminOrderRow[];
}> {
  const local = listConfirmedOrders()
    .filter((o) => o.kind === "marketplace_order")
    .map(fromConfirmed);

  const byId = new Map<string, AdminOrderRow>();
  for (const row of local) byId.set(row.id, row);

  if (isStripeConfigured()) {
    try {
      const fromStripe = await listPaidCheckoutSessionsFromStripe();
      for (const row of fromStripe) {
        if (row.kind === "impact_member") continue;
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
    } catch (err) {
      console.warn("[admin] Stripe checkout session list failed", err);
    }
  }

  const orders = [...byId.values()].sort(
    (a, b) =>
      new Date(b.fulfilledAt).getTime() - new Date(a.fulfilledAt).getTime()
  );

  return {
    mode: isStripeConfigured() ? "live" : "demo",
    keyMode: getStripeKeyMode(),
    orders,
  };
}
