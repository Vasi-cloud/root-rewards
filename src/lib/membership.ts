import type { MembershipTierId } from "@/types";

export interface MembershipTier {
  id: MembershipTierId;
  name: string;
  tagline: string;
  priceMonthly: number;
  /** Multiplier on base affiliate commission (1 = 100%) */
  affiliateBoost: number;
  /** Demo monthly cause credit in GBP applied at checkout */
  monthlyCauseCredit: number;
  perks: string[];
  highlight?: boolean;
}

/** Public one-liner — homepage, membership, Stripe line item, email. */
export const IMPACT_MEMBER_PRIMARY =
  "Impact Member · £5/mo — cause credit toward partner programmes, and support for the platform.";

/** Stripe Checkout product_data.description — must not lead with commissions. */
export const IMPACT_MEMBER_STRIPE_DESCRIPTION =
  "Impact Member · £5/mo — cause credit toward partner programmes, and support for the platform. Not product cashback or a shopping balance. Cancel anytime.";

/** Scalable catalog — add tiers here without rewriting UI. */
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Shop green with Marketplace, Buy Local, Kitchen, Parts, and Ask Leafy.",
    priceMonthly: 0,
    affiliateBoost: 1,
    monthlyCauseCredit: 0,
    perks: [
      "Marketplace shopping & cause checkout",
      "Personal impact dashboard",
      "Buy Local, Kitchen, Parts, and Ask Leafy",
    ],
  },
  {
    id: "impact",
    name: "Impact Member",
    tagline:
      "£5/mo — cause credit toward partner programmes, and support for the platform.",
    priceMonthly: 5,
    affiliateBoost: 1.25,
    monthlyCauseCredit: 5,
    highlight: true,
    perks: [
      "Everything in Free",
      "£5 monthly cause credit at checkout (toward causes — not product cashback or a shopping balance)",
      "Your membership supports the Forest Buddies platform",
      "Impact Member badge on your profile",
      "Cancel anytime — benefits last until your period ends",
    ],
  },
];

export function getMembershipTier(
  id: MembershipTierId | undefined | null
): MembershipTier {
  return (
    MEMBERSHIP_TIERS.find((t) => t.id === id) ?? MEMBERSHIP_TIERS[0]
  );
}

export function affiliateRateWithMembership(
  basePercent: number,
  tierId: MembershipTierId | undefined | null
): number {
  const tier = getMembershipTier(tierId);
  return Number((basePercent * tier.affiliateBoost).toFixed(2));
}
