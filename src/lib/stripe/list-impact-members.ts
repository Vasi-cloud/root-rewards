import "server-only";

import type Stripe from "stripe";

import type { AdminStripeMember } from "@/lib/admin-stripe-members";
import {
  IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
  isStripeConfigured,
} from "@/lib/stripe/config";
import { isImpactSubscription } from "@/lib/stripe/reconcile-membership";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";

export type { AdminStripeMember } from "@/lib/admin-stripe-members";
export type { AdminMemberStatus } from "@/lib/admin-stripe-members";

function customerIdOf(sub: Stripe.Subscription): string | null {
  if (typeof sub.customer === "string" && sub.customer.startsWith("cus_")) {
    return sub.customer;
  }
  if (
    sub.customer &&
    typeof sub.customer === "object" &&
    "id" in sub.customer &&
    typeof (sub.customer as { id?: string }).id === "string" &&
    (sub.customer as { id: string }).id.startsWith("cus_")
  ) {
    return (sub.customer as { id: string }).id;
  }
  return null;
}

function emailFromExpandedCustomer(
  sub: Stripe.Subscription
): string | null {
  if (
    sub.customer &&
    typeof sub.customer === "object" &&
    !("deleted" in sub.customer && sub.customer.deleted)
  ) {
    const e = (sub.customer as Stripe.Customer).email?.trim();
    return e || null;
  }
  return null;
}

function mapAdminStatus(sub: Stripe.Subscription): AdminStripeMember["status"] | null {
  if (sub.status === "past_due") return "past_due";
  if (
    sub.status === "canceled" ||
    sub.status === "unpaid" ||
    sub.status === "incomplete_expired"
  ) {
    return "cancelled";
  }
  if (sub.status === "trialing") return "trialing";
  if (sub.status === "active") return "active";
  return null;
}

function amountMonthlyOf(sub: Stripe.Subscription): number {
  const price = sub.items?.data?.[0]?.price;
  if (typeof price?.unit_amount === "number") {
    return price.unit_amount / 100;
  }
  return IMPACT_MEMBER_UNIT_AMOUNT_CENTS / 100;
}

function startedAtOf(sub: Stripe.Subscription): string {
  const start =
    typeof sub.start_date === "number" ? sub.start_date : sub.created;
  return new Date(start * 1000).toISOString();
}

/**
 * List Impact Member subscriptions via the same STRIPE_SECRET_KEY as
 * membership Checkout (Test when sk_test_*, Live when sk_live_*).
 * Prefer plain list (no Search API) so Test mode works without Search enabled.
 */
async function collectSubscriptions(
  stripe: Stripe
): Promise<Stripe.Subscription[]> {
  const byId = new Map<string, Stripe.Subscription>();

  const absorb = (subs: Stripe.Subscription[]) => {
    for (const sub of subs) {
      if (isImpactSubscription(sub)) byId.set(sub.id, sub);
    }
  };

  const statuses: Stripe.SubscriptionListParams["status"][] = [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "unpaid",
  ];

  for (const status of statuses) {
    let startingAfter: string | undefined;
    for (let i = 0; i < 8; i++) {
      // No expand — deleted customers / expand quirks must not fail the whole list.
      const page = await stripe.subscriptions.list({
        status,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      absorb(page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
  }

  // Optional Search enrichment (may be unavailable on some accounts).
  try {
    let pageToken: string | undefined;
    for (let i = 0; i < 10; i++) {
      const page = await stripe.subscriptions.search({
        query: "metadata['kind']:'impact_member'",
        limit: 100,
        ...(pageToken ? { page: pageToken } : {}),
      });
      absorb(page.data);
      if (!page.has_more || !page.next_page) break;
      pageToken = page.next_page;
    }
  } catch (err) {
    console.warn("[stripe] Impact member search unavailable", err);
  }

  return [...byId.values()];
}

/**
 * List Impact Member subscriptions from Stripe (Test or live — same secret key).
 * Email comes from the Stripe customer; never invent a display name.
 */
export async function listImpactMembersFromStripe(): Promise<{
  mode: "live" | "demo";
  members: AdminStripeMember[];
}> {
  if (!isStripeConfigured()) {
    return { mode: "demo", members: [] };
  }

  const stripe = getStripe();
  const subs = await collectSubscriptions(stripe);
  const emailCache = new Map<string, string | null>();
  const members: AdminStripeMember[] = [];

  for (const sub of subs) {
    const status = mapAdminStatus(sub);
    if (!status) continue;
    const customerId = customerIdOf(sub);
    if (!customerId) continue;

    let email = emailFromExpandedCustomer(sub);
    if (email === null) {
      if (emailCache.has(customerId)) {
        email = emailCache.get(customerId) ?? null;
      } else {
        try {
          const cust = await stripe.customers.retrieve(customerId);
          if (cust && !("deleted" in cust && cust.deleted)) {
            email = (cust as Stripe.Customer).email?.trim() || null;
          }
        } catch {
          email = null;
        }
        emailCache.set(customerId, email);
      }
    }

    members.push({
      subscriptionId: sub.id,
      customerId,
      email,
      emailMissing: !email,
      status,
      plan: "Impact Member",
      periodEndsAt: getSubscriptionPeriodEnd(sub),
      startedAt: startedAtOf(sub),
      amountMonthly: amountMonthlyOf(sub),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    });
  }

  members.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return { mode: "live", members };
}
