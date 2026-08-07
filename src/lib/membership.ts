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
      "No commission share — upgrade to unlock your share link",
      "Personal impact dashboard",
      "Buy Local, Kitchen, Parts, and Ask Leafy",
    ],
  },
  {
    id: "impact",
    name: "Impact Member",
    tagline: "Unlock your share link and fund a little good every month.",
    priceMonthly: 5,
    affiliateBoost: 1.25,
    monthlyCauseCredit: 5,
    highlight: true,
    perks: [
      "Everything in Free",
      "Share link + 25% of eligible commissions as account credit (after partners pay us)",
      "£5 monthly cause credit at checkout (toward causes — not product cashback)",
      "Impact Member badge on your profile",
      "Affiliate tools & share activity",
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
