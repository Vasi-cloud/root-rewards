import "server-only";

import type Stripe from "stripe";

import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

const ENTITLED = new Set(["active", "trialing", "past_due"]);

export function normalizeBillingEmail(email: string): string {
  return email.trim().toLowerCase();
}

function customerEmailOf(customer: Stripe.Customer): string | null {
  const e = customer.email?.trim().toLowerCase();
  return e || null;
}

/**
 * Collect Stripe customers whose email matches (list + search).
 * Email must already be normalized (trim + lowercase).
 */
export async function listCustomersForEmail(
  stripe: Stripe,
  email: string
): Promise<Stripe.Customer[]> {
  const byId = new Map<string, Stripe.Customer>();
  const absorb = (c: Stripe.Customer) => {
    if (c.deleted) return;
    // Stripe list/search email filters are case-sensitive; compare normalized
    if (customerEmailOf(c) === email) byId.set(c.id, c);
  };

  const listed = await stripe.customers.list({ email, limit: 100 });
  for (const c of listed.data) absorb(c);
  try {
    const escaped = email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const searched = await stripe.customers.search({
      query: `email:'${escaped}'`,
      limit: 100,
    });
    for (const c of searched.data) absorb(c);
  } catch (err) {
    console.warn("[stripe] customer email search unavailable", err);
  }
  return [...byId.values()];
}

async function customerHasEntitledSub(
  stripe: Stripe,
  customerId: string
): Promise<{ has: boolean; newestCreated: number }> {
  const page = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  let newest = 0;
  let has = false;
  for (const sub of page.data) {
    if (ENTITLED.has(sub.status)) {
      has = true;
      newest = Math.max(newest, sub.created ?? 0);
    }
  }
  return { has, newestCreated: newest };
}

/**
 * Pick among customers that already match the signed-in email:
 * 1) Prefer one with an active|trialing|past_due Impact sub (newest sub wins)
 * 2) Else most recently updated (proxy: newest entitled/any sub activity, else created)
 */
async function pickBestCustomerForEmail(
  stripe: Stripe,
  customers: Stripe.Customer[]
): Promise<Stripe.Customer | null> {
  if (customers.length === 0) return null;
  if (customers.length === 1) return customers[0]!;

  const scored: Array<{
    customer: Stripe.Customer;
    hasEntitled: boolean;
    newestSub: number;
    recency: number;
  }> = [];

  for (const customer of customers) {
    const { has, newestCreated } = await customerHasEntitledSub(
      stripe,
      customer.id
    );
    const created = customer.created ?? 0;
    scored.push({
      customer,
      hasEntitled: has,
      newestSub: newestCreated,
      recency: Math.max(created, newestCreated),
    });
  }

  scored.sort((a, b) => {
    if (a.hasEntitled !== b.hasEntitled) return a.hasEntitled ? -1 : 1;
    if (a.hasEntitled && b.hasEntitled && a.newestSub !== b.newestSub) {
      return b.newestSub - a.newestSub;
    }
    return b.recency - a.recency;
  });

  return scored[0]?.customer ?? null;
}

export type ResolvedStripeCustomer = {
  /** Email-matched customer id, or null if none exist yet */
  customerId: string | null;
  /** Hint was present but belonged to a different email — do not use */
  ignoredStaleCustomerId: string | null;
  /** All cus_ ids that match this email */
  matchedCustomerIds: string[];
};

/**
 * Source of truth: Firebase Auth email (trim + lowercase).
 * Stored stripeCustomerId is used only when its Stripe email matches.
 * Never returns a customer belonging to another email.
 */
export async function resolveStripeCustomerForEmail(opts: {
  email: string;
  /** Optional stored id — ignored when email does not match */
  customerIdHint?: string | null;
}): Promise<ResolvedStripeCustomer> {
  if (!isStripeConfigured()) {
    return {
      customerId: null,
      ignoredStaleCustomerId: null,
      matchedCustomerIds: [],
    };
  }

  const stripe = getStripe();
  const email = normalizeBillingEmail(opts.email);
  const hint =
    opts.customerIdHint?.startsWith("cus_") ? opts.customerIdHint : null;

  let ignoredStaleCustomerId: string | null = null;
  const matched = await listCustomersForEmail(stripe, email);
  const matchedIds = new Set(matched.map((c) => c.id));

  if (hint) {
    try {
      const retrieved = await stripe.customers.retrieve(hint);
      if (retrieved && !("deleted" in retrieved && retrieved.deleted)) {
        const cust = retrieved as Stripe.Customer;
        const custEmail = customerEmailOf(cust);
        if (custEmail === email) {
          if (!matchedIds.has(cust.id)) {
            matched.push(cust);
            matchedIds.add(cust.id);
          }
        } else {
          ignoredStaleCustomerId = hint;
          console.warn("[stripe] ignoring stale stripeCustomerId (email mismatch)", {
            hint,
            hintEmail: custEmail,
            authEmail: email,
          });
        }
      }
    } catch (err) {
      console.warn("[stripe] stored customer retrieve failed", hint, err);
      ignoredStaleCustomerId = hint;
    }
  }

  const best = await pickBestCustomerForEmail(stripe, matched);

  return {
    customerId: best?.id ?? null,
    ignoredStaleCustomerId,
    matchedCustomerIds: [...matchedIds],
  };
}

/** Ids only — for callers that already import collectCustomerIdsByEmail patterns. */
export async function collectEmailMatchedCustomerIds(
  stripe: Stripe,
  email: string,
  customerIdHint?: string | null
): Promise<{
  customerIds: string[];
  ignoredStaleCustomerId: string | null;
  preferredCustomerId: string | null;
}> {
  const resolved = await resolveStripeCustomerForEmail({
    email,
    customerIdHint,
  });
  // Prefer preferred first in the list for iteration order
  const ids = [...resolved.matchedCustomerIds];
  if (
    resolved.customerId &&
    ids[0] !== resolved.customerId
  ) {
    const rest = ids.filter((id) => id !== resolved.customerId);
    return {
      customerIds: [resolved.customerId, ...rest],
      ignoredStaleCustomerId: resolved.ignoredStaleCustomerId,
      preferredCustomerId: resolved.customerId,
    };
  }
  return {
    customerIds: ids,
    ignoredStaleCustomerId: resolved.ignoredStaleCustomerId,
    preferredCustomerId: resolved.customerId,
  };
}
