import "server-only";

import type Stripe from "stripe";

import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";
import type { MembershipTierId } from "@/types";

/** Statuses that mean the shopper is an Impact Member right now. */
const IMPACT_ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export type MembershipReconcileResult = {
  mode: "live" | "demo";
  tierId: MembershipTierId;
  customerId: string | null;
  subscriptionId: string | null;
  periodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  status: string | null;
  /** True when Stripe was queried and local cache should follow this result */
  reconciled: boolean;
};

function emptyFree(
  mode: "live" | "demo",
  reconciled: boolean
): MembershipReconcileResult {
  return {
    mode,
    tierId: "free",
    customerId: null,
    subscriptionId: null,
    periodEndsAt: null,
    cancelAtPeriodEnd: false,
    status: null,
    reconciled,
  };
}

function isImpactSubscription(sub: Stripe.Subscription): boolean {
  if (
    sub.metadata?.kind === "impact_member" ||
    sub.metadata?.tierId === "impact"
  ) {
    return true;
  }
  // Checkout product_data name: "Forest Buddies Impact Member"
  const item = sub.items?.data?.[0];
  const product = item?.price?.product;
  if (
    typeof product === "object" &&
    product &&
    !("deleted" in product && product.deleted)
  ) {
    const name = (product as Stripe.Product).name?.toLowerCase() ?? "";
    if (name.includes("impact member")) return true;
  }
  // Price nickname / description fallbacks when product isn't expanded
  const nickname = item?.price?.nickname?.toLowerCase() ?? "";
  if (nickname.includes("impact")) return true;
  return false;
}

function customerIdOf(sub: Stripe.Subscription): string | null {
  if (typeof sub.customer === "string" && sub.customer.startsWith("cus_")) {
    return sub.customer;
  }
  if (
    sub.customer &&
    typeof sub.customer === "object" &&
    "id" in sub.customer &&
    typeof sub.customer.id === "string" &&
    sub.customer.id.startsWith("cus_")
  ) {
    return sub.customer.id;
  }
  return null;
}

function toResult(
  sub: Stripe.Subscription,
  customerId: string
): MembershipReconcileResult {
  const entitled = IMPACT_ENTITLED_STATUSES.has(sub.status);
  if (!entitled) {
    return {
      mode: "live",
      tierId: "free",
      customerId,
      subscriptionId: sub.id,
      periodEndsAt: getSubscriptionPeriodEnd(sub),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      status: sub.status,
      reconciled: true,
    };
  }
  return {
    mode: "live",
    tierId: "impact",
    customerId,
    subscriptionId: sub.id,
    periodEndsAt: getSubscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    status: sub.status,
    reconciled: true,
  };
}

async function listCustomerSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription[]> {
  const page = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
    expand: ["data.items.data.price.product"],
  });
  return page.data;
}

/**
 * Prefer Impact-tagged subs; otherwise any subscription for this customer
 * (Forest Buddies only sells one membership plan — Price IDs may omit metadata).
 */
function pickBestSubscription(
  subs: Stripe.Subscription[]
): Stripe.Subscription | null {
  if (subs.length === 0) return null;
  const tagged = subs.filter(isImpactSubscription);
  const pool = tagged.length > 0 ? tagged : subs;
  const ranked = [...pool].sort((a, b) => {
    const aActive = IMPACT_ENTITLED_STATUSES.has(a.status) ? 1 : 0;
    const bActive = IMPACT_ENTITLED_STATUSES.has(b.status) ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return (b.created ?? 0) - (a.created ?? 0);
  });
  return ranked[0] ?? null;
}

function preferBetter(
  current: { sub: Stripe.Subscription; customerId: string } | null,
  candidate: { sub: Stripe.Subscription; customerId: string }
): { sub: Stripe.Subscription; customerId: string } {
  if (!current) return candidate;
  const curActive = IMPACT_ENTITLED_STATUSES.has(current.sub.status) ? 1 : 0;
  const nextActive = IMPACT_ENTITLED_STATUSES.has(candidate.sub.status) ? 1 : 0;
  if (nextActive !== curActive) {
    return nextActive > curActive ? candidate : current;
  }
  return (candidate.sub.created ?? 0) > (current.sub.created ?? 0)
    ? candidate
    : current;
}

async function collectCustomerIdsByEmail(
  stripe: Stripe,
  email: string
): Promise<string[]> {
  const ids: string[] = [];
  const listed = await stripe.customers.list({ email, limit: 100 });
  for (const c of listed.data) {
    if (!ids.includes(c.id)) ids.push(c.id);
  }
  // Search API catches customers list pagination / exact-match edge cases
  try {
    const escaped = email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const searched = await stripe.customers.search({
      query: `email:'${escaped}'`,
      limit: 100,
    });
    for (const c of searched.data) {
      if (!ids.includes(c.id)) ids.push(c.id);
    }
  } catch (err) {
    console.warn("[stripe] customer email search unavailable", err);
  }
  return ids;
}

async function findSubsByUserIdMetadata(
  stripe: Stripe,
  userId: string
): Promise<Array<{ sub: Stripe.Subscription; customerId: string }>> {
  const out: Array<{ sub: Stripe.Subscription; customerId: string }> = [];
  try {
    const escaped = userId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const page = await stripe.subscriptions.search({
      query: `metadata['userId']:'${escaped}'`,
      limit: 20,
      expand: ["data.items.data.price.product"],
    });
    for (const sub of page.data) {
      const cid = customerIdOf(sub);
      if (cid) out.push({ sub, customerId: cid });
    }
  } catch (err) {
    console.warn("[stripe] subscription userId search unavailable", err);
  }
  return out;
}

/**
 * Resolve Impact Member from Stripe (source of truth).
 * Prefer stored subscription / customer id; fall back to email + userId metadata.
 */
export async function reconcileMembershipFromStripe(opts: {
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
}): Promise<MembershipReconcileResult> {
  if (!isStripeConfigured()) {
    return emptyFree("demo", false);
  }

  const stripe = getStripe();
  const email = opts.email?.trim().toLowerCase() || null;
  const customerIdHint =
    opts.customerId?.startsWith("cus_") ? opts.customerId : null;
  const subscriptionIdHint =
    opts.subscriptionId?.startsWith("sub_") ? opts.subscriptionId : null;
  const userId =
    typeof opts.userId === "string" && opts.userId.trim()
      ? opts.userId.trim().slice(0, 128)
      : null;

  try {
    let best: { sub: Stripe.Subscription; customerId: string } | null = null;

    // 1) Direct retrieve of stored subscription id (survives localStorage wipe)
    if (subscriptionIdHint) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionIdHint, {
          expand: ["items.data.price.product"],
        });
        const cid = customerIdOf(sub);
        if (cid) {
          best = preferBetter(best, { sub, customerId: cid });
        }
      } catch (err) {
        console.warn(
          "[stripe] stored subscription retrieve failed",
          subscriptionIdHint,
          err
        );
      }
    }

    // 2) Customers: stored id + email list/search
    const customerIds: string[] = [];
    if (customerIdHint) customerIds.push(customerIdHint);
    if (email) {
      for (const id of await collectCustomerIdsByEmail(stripe, email)) {
        if (!customerIds.includes(id)) customerIds.push(id);
      }
    }

    for (const cid of customerIds) {
      const subs = await listCustomerSubscriptions(stripe, cid);
      const pick = pickBestSubscription(subs);
      if (!pick) continue;
      best = preferBetter(best, { sub: pick, customerId: cid });
    }

    // 3) Subscriptions tagged with this Firebase uid
    if (userId) {
      for (const hit of await findSubsByUserIdMetadata(stripe, userId)) {
        best = preferBetter(best, hit);
      }
    }

    if (!best) {
      return {
        ...emptyFree("live", true),
        customerId: customerIds[0] ?? customerIdHint,
      };
    }

    const result = toResult(best.sub, best.customerId);

    // Attach Firebase UID to subscription metadata when we know it (non-blocking)
    if (
      result.tierId === "impact" &&
      userId &&
      best.sub.metadata?.userId !== userId
    ) {
      try {
        await stripe.subscriptions.update(best.sub.id, {
          metadata: {
            ...best.sub.metadata,
            kind: "impact_member",
            tierId: "impact",
            userId,
          },
        });
      } catch (err) {
        console.warn("[stripe] could not attach userId to subscription", err);
      }
    }

    return result;
  } catch (err) {
    console.error("[stripe] membership reconcile failed", err);
    // Fail open for local UX: do not invent Free if Stripe errored — caller keeps cache
    return {
      ...emptyFree("live", false),
      status: "error",
    };
  }
}
