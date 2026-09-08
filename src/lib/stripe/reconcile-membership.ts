import "server-only";

import type Stripe from "stripe";

import {
  getImpactMemberPriceId,
  IMPACT_MEMBER_UNIT_AMOUNT_CENTS,
  isStripeConfigured,
} from "@/lib/stripe/config";
import {
  collectEmailMatchedCustomerIds,
  listCustomersForEmail,
  normalizeBillingEmail,
} from "@/lib/stripe/resolve-customer";
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

  const item = sub.items?.data?.[0];
  const price = item?.price;
  const configuredPriceId = getImpactMemberPriceId();
  if (configuredPriceId && price?.id === configuredPriceId) {
    return true;
  }

  // Inline Checkout price_data (£5/mo GBP) — Forest Buddies only sells this plan
  if (
    price?.unit_amount === IMPACT_MEMBER_UNIT_AMOUNT_CENTS &&
    price?.recurring?.interval === "month" &&
    (price.currency === "gbp" || !price.currency)
  ) {
    return true;
  }

  const product = price?.product;
  if (
    typeof product === "object" &&
    product &&
    !("deleted" in product && product.deleted)
  ) {
    const name = (product as Stripe.Product).name?.toLowerCase() ?? "";
    if (name.includes("impact member")) return true;
  }
  const nickname = price?.nickname?.toLowerCase() ?? "";
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
    limit: 100,
    expand: ["data.items.data.price.product"],
  });
  return page.data;
}

/**
 * Prefer Impact-tagged / £5 Impact price subs; otherwise any subscription
 * (Forest Buddies only sells one membership plan).
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

/** Entitled Impact sub only — used to block duplicate Checkout. */
function pickEntitledImpactSubscription(
  subs: Stripe.Subscription[]
): Stripe.Subscription | null {
  const entitled = subs.filter(
    (s) => IMPACT_ENTITLED_STATUSES.has(s.status) && isImpactSubscription(s)
  );
  if (entitled.length === 0) {
    // Single-plan fallback: any entitled sub for this customer
    const anyEntitled = subs.filter((s) =>
      IMPACT_ENTITLED_STATUSES.has(s.status)
    );
    if (anyEntitled.length === 0) return null;
    return [...anyEntitled].sort(
      (a, b) => (b.created ?? 0) - (a.created ?? 0)
    )[0]!;
  }
  return [...entitled].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0]!;
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

export async function collectCustomerIdsByEmail(
  stripe: Stripe,
  email: string
): Promise<string[]> {
  const customers = await listCustomersForEmail(
    stripe,
    normalizeBillingEmail(email)
  );
  return customers.map((c) => c.id);
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

/** Only keep a stored subscription if its Stripe customer email matches auth email. */
async function retrieveSubIfEmailMatches(
  stripe: Stripe,
  subscriptionId: string,
  email: string | null
): Promise<{ sub: Stripe.Subscription; customerId: string } | null> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product", "customer"],
    });
    const cid = customerIdOf(sub);
    if (!cid) return null;
    if (!email) return { sub, customerId: cid };

    let custEmail: string | null = null;
    if (
      sub.customer &&
      typeof sub.customer === "object" &&
      "email" in sub.customer
    ) {
      custEmail =
        (sub.customer as Stripe.Customer).email?.trim().toLowerCase() ?? null;
    } else {
      const cust = await stripe.customers.retrieve(cid);
      if (cust && !("deleted" in cust && cust.deleted)) {
        custEmail = (cust as Stripe.Customer).email?.trim().toLowerCase() ?? null;
      }
    }
    if (custEmail !== email) {
      console.warn("[stripe] ignoring stored subscription (customer email mismatch)", {
        subscriptionId,
        custEmail,
        authEmail: email,
      });
      return null;
    }
    return { sub, customerId: cid };
  } catch (err) {
    console.warn("[stripe] subscription retrieve failed", subscriptionId, err);
    return null;
  }
}

/**
 * Hard guard helper — email-matched customers only.
 */
export async function findBlockingImpactMembership(opts: {
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  userId?: string | null;
}): Promise<MembershipReconcileResult> {
  if (!isStripeConfigured()) {
    return emptyFree("demo", false);
  }

  const stripe = getStripe();
  const email = opts.email ? normalizeBillingEmail(opts.email) : null;
  const customerIdHint =
    opts.customerId?.startsWith("cus_") ? opts.customerId : null;
  const subscriptionIdHint =
    opts.subscriptionId?.startsWith("sub_") ? opts.subscriptionId : null;
  const userId =
    typeof opts.userId === "string" && opts.userId.trim()
      ? opts.userId.trim().slice(0, 128)
      : null;

  if (!email) {
    return emptyFree("live", false);
  }

  try {
    let best: { sub: Stripe.Subscription; customerId: string } | null = null;

    if (subscriptionIdHint) {
      const hit = await retrieveSubIfEmailMatches(
        stripe,
        subscriptionIdHint,
        email
      );
      if (hit && IMPACT_ENTITLED_STATUSES.has(hit.sub.status)) {
        best = preferBetter(best, hit);
      }
    }

    const { customerIds, preferredCustomerId } =
      await collectEmailMatchedCustomerIds(stripe, email, customerIdHint);

    for (const cid of customerIds) {
      const subs = await listCustomerSubscriptions(stripe, cid);
      const pick = pickEntitledImpactSubscription(subs);
      if (!pick) continue;
      best = preferBetter(best, { sub: pick, customerId: cid });
    }

    if (userId) {
      for (const hit of await findSubsByUserIdMetadata(stripe, userId)) {
        if (!IMPACT_ENTITLED_STATUSES.has(hit.sub.status)) continue;
        // Only accept if customer is email-matched
        if (!customerIds.includes(hit.customerId)) continue;
        best = preferBetter(best, hit);
      }
    }

    if (!best) {
      return {
        ...emptyFree("live", true),
        customerId: preferredCustomerId ?? customerIds[0] ?? null,
      };
    }

    return toResult(best.sub, best.customerId);
  } catch (err) {
    console.error("[stripe] blocking Impact lookup failed", err);
    return {
      ...emptyFree("live", false),
      status: "error",
    };
  }
}

/**
 * Resolve Impact Member from Stripe (source of truth).
 * Firebase Auth email is the key — stale stripeCustomerId for another email is ignored.
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
  const email = opts.email ? normalizeBillingEmail(opts.email) : null;
  const customerIdHint =
    opts.customerId?.startsWith("cus_") ? opts.customerId : null;
  const subscriptionIdHint =
    opts.subscriptionId?.startsWith("sub_") ? opts.subscriptionId : null;
  const userId =
    typeof opts.userId === "string" && opts.userId.trim()
      ? opts.userId.trim().slice(0, 128)
      : null;

  if (!email) {
    return emptyFree("live", false);
  }

  try {
    let best: { sub: Stripe.Subscription; customerId: string } | null = null;

    if (subscriptionIdHint) {
      const hit = await retrieveSubIfEmailMatches(
        stripe,
        subscriptionIdHint,
        email
      );
      if (hit) best = preferBetter(best, hit);
    }

    const { customerIds, preferredCustomerId, ignoredStaleCustomerId } =
      await collectEmailMatchedCustomerIds(stripe, email, customerIdHint);

    if (ignoredStaleCustomerId) {
      console.warn("[stripe] reconcile ignored stale stripeCustomerId", {
        email,
        ignoredStaleCustomerId,
        preferredCustomerId,
      });
    }

    for (const cid of customerIds) {
      const subs = await listCustomerSubscriptions(stripe, cid);
      const pick = pickBestSubscription(subs);
      if (!pick) continue;
      best = preferBetter(best, { sub: pick, customerId: cid });
    }

    if (userId) {
      for (const hit of await findSubsByUserIdMetadata(stripe, userId)) {
        if (!customerIds.includes(hit.customerId)) continue;
        best = preferBetter(best, hit);
      }
    }

    if (!best) {
      return {
        ...emptyFree("live", true),
        customerId: preferredCustomerId ?? customerIds[0] ?? null,
      };
    }

    const result = toResult(best.sub, best.customerId);

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
    return {
      ...emptyFree("live", false),
      status: "error",
    };
  }
}
