import "server-only";

import type Stripe from "stripe";

import { getAppUrl, isStripeConfigured } from "@/lib/stripe/config";
import { collectCustomerIdsByEmail } from "@/lib/stripe/reconcile-membership";
import { getStripe } from "@/lib/stripe/server";
import { getSubscriptionPeriodEnd } from "@/lib/stripe/subscription";

/** One-plan site: these statuses mean “already a member — do not Checkout”. */
const ENTITLED = new Set(["active", "trialing", "past_due"]);

export type ImpactCheckoutGuardResult =
  | {
      block: true;
      alreadyMember: true;
      customerId: string;
      subscriptionId: string;
      subscriptionIds: string[];
      periodEndsAt: string | null;
      cancelAtPeriodEnd: boolean;
      /** Client must navigate here — never Checkout */
      url: string;
      portalUrl: string | null;
    }
  | {
      block: false;
      /** Existing or newly created customer to attach Checkout to */
      customerId: string;
    }
  | {
      block: true;
      alreadyMember: false;
      error: string;
      url: string;
    };

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

async function listAllSubs(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription[]> {
  const page = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  return page.data;
}

/**
 * Cancel duplicate entitled subs at period end — keep the newest.
 * Never cancels the last remaining entitled sub.
 */
export async function cancelExtraEntitledSubscriptions(
  stripe: Stripe,
  entitled: Stripe.Subscription[]
): Promise<string[]> {
  if (entitled.length <= 1) return [];
  const ranked = [...entitled].sort(
    (a, b) => (b.created ?? 0) - (a.created ?? 0)
  );
  const extras = ranked.slice(1);
  const canceled: string[] = [];
  for (const sub of extras) {
    if (sub.cancel_at_period_end) {
      canceled.push(sub.id);
      continue;
    }
    try {
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
      canceled.push(sub.id);
      console.info("[stripe] duplicate Impact sub scheduled cancel_at_period_end", {
        subscriptionId: sub.id,
        kept: ranked[0]?.id,
      });
    } catch (err) {
      console.warn("[stripe] could not cancel duplicate sub", sub.id, err);
    }
  }
  return canceled;
}

/**
 * Hard server guard before Impact Member Checkout.
 * ANY active|trialing|past_due sub on any customer for this email → block.
 * Reuses existing Stripe customer; does not create a second cus_ for the same email.
 */
export async function guardImpactSubscriptionCheckout(opts: {
  email: string;
  customerIdHint?: string | null;
  userId?: string | null;
}): Promise<ImpactCheckoutGuardResult> {
  if (!isStripeConfigured()) {
    return {
      block: true,
      alreadyMember: false,
      error: "Stripe is not configured.",
      url: `${getAppUrl()}/membership`,
    };
  }

  const stripe = getStripe();
  const email = opts.email.trim().toLowerCase();
  const membershipUrl = `${getAppUrl()}/membership`;
  const hint =
    opts.customerIdHint?.startsWith("cus_") ? opts.customerIdHint : null;

  try {
    const customerIds: string[] = [];
    if (hint) customerIds.push(hint);
    for (const id of await collectCustomerIdsByEmail(stripe, email)) {
      if (!customerIds.includes(id)) customerIds.push(id);
    }

    const entitled: Stripe.Subscription[] = [];
    for (const cid of customerIds) {
      const subs = await listAllSubs(stripe, cid);
      for (const sub of subs) {
        if (ENTITLED.has(sub.status)) entitled.push(sub);
      }
    }

    if (entitled.length > 0) {
      const ranked = [...entitled].sort(
        (a, b) => (b.created ?? 0) - (a.created ?? 0)
      );
      const keep = ranked[0]!;
      const customerId = customerIdOf(keep) ?? customerIds[0]!;
      const allIds = ranked.map((s) => s.id);

      console.info("[stripe] duplicate Impact Checkout blocked", {
        email,
        customerId,
        existingSubIds: allIds,
        statuses: ranked.map((s) => s.status),
      });

      // Test / live cleanup: keep newest, cancel extras at period end
      await cancelExtraEntitledSubscriptions(stripe, ranked);

      let portalUrl: string | null = null;
      try {
        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: membershipUrl,
        });
        portalUrl = portal.url;
      } catch (err) {
        console.warn("[stripe] portal session for already-member skipped", err);
      }

      return {
        block: true,
        alreadyMember: true,
        customerId,
        subscriptionId: keep.id,
        subscriptionIds: allIds,
        periodEndsAt: getSubscriptionPeriodEnd(keep),
        cancelAtPeriodEnd: Boolean(keep.cancel_at_period_end),
        url: membershipUrl,
        portalUrl,
      };
    }

    // Reuse existing customer — never create a second cus_ for this email
    if (customerIds.length > 0) {
      return { block: false, customerId: customerIds[0]! };
    }

    const created = await stripe.customers.create({
      email,
      metadata: {
        userId: opts.userId?.slice(0, 128) ?? "",
        source: "impact_member_checkout",
      },
    });
    return { block: false, customerId: created.id };
  } catch (err) {
    console.error("[stripe] Impact Checkout guard failed", err);
    return {
      block: true,
      alreadyMember: false,
      error:
        "Could not verify existing membership. Open /membership — we will not start Checkout.",
      url: membershipUrl,
    };
  }
}

/** True if this customer already has an open subscription-mode Checkout. */
export async function findOpenSubscriptionCheckoutUrl(
  customerId: string
): Promise<string | null> {
  if (!customerId.startsWith("cus_")) return null;
  try {
    const stripe = getStripe();
    const open = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 10,
    });
    const hit = open.data.find((s) => s.mode === "subscription" && s.url);
    return hit?.url ?? null;
  } catch {
    return null;
  }
}
