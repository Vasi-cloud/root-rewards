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

function emptyFree(mode: "live" | "demo", reconciled: boolean): MembershipReconcileResult {
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

function toResult(sub: Stripe.Subscription, customerId: string): MembershipReconcileResult {
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

/**
 * Resolve Impact Member from Stripe (source of truth).
 * Prefer customer id; fall back to email customer search.
 */
export async function reconcileMembershipFromStripe(opts: {
  email?: string | null;
  customerId?: string | null;
  userId?: string | null;
}): Promise<MembershipReconcileResult> {
  if (!isStripeConfigured()) {
    return emptyFree("demo", false);
  }

  const stripe = getStripe();
  const email = opts.email?.trim().toLowerCase() || null;
  const customerIdHint =
    opts.customerId?.startsWith("cus_") ? opts.customerId : null;

  try {
    const customerIds: string[] = [];
    if (customerIdHint) customerIds.push(customerIdHint);

    if (email) {
      const found = await stripe.customers.list({ email, limit: 10 });
      for (const c of found.data) {
        if (!customerIds.includes(c.id)) customerIds.push(c.id);
      }
    }

    if (customerIds.length === 0) {
      return emptyFree("live", true);
    }

    let best: { sub: Stripe.Subscription; customerId: string } | null = null;

    for (const cid of customerIds) {
      const subs = await listCustomerSubscriptions(stripe, cid);
      const pick = pickBestSubscription(subs);
      if (!pick) continue;
      if (
        !best ||
        (IMPACT_ENTITLED_STATUSES.has(pick.status) &&
          !IMPACT_ENTITLED_STATUSES.has(best.sub.status)) ||
        (pick.created ?? 0) > (best.sub.created ?? 0)
      ) {
        best = { sub: pick, customerId: cid };
      }
    }

    if (!best) {
      return {
        ...emptyFree("live", true),
        customerId: customerIds[0] ?? null,
      };
    }

    const result = toResult(best.sub, best.customerId);

    // Attach Firebase UID to subscription metadata when we know it (non-blocking)
    if (
      result.tierId === "impact" &&
      opts.userId &&
      best.sub.metadata?.userId !== opts.userId
    ) {
      try {
        await stripe.subscriptions.update(best.sub.id, {
          metadata: {
            ...best.sub.metadata,
            kind: "impact_member",
            tierId: "impact",
            userId: opts.userId,
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
