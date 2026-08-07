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
    tagline: "Shop green and share links at the standard rate.",
    priceMonthly: 0,
    affiliateBoost: 1,
    monthlyCauseCredit: 0,
    perks: [
      "Marketplace shopping & cause checkout",
      "No commission share for now",
      "Personal impact dashboard",
      "Referral link with attribution up to 30 days depending on partner platform",
    ],
  },
  {
    id: "impact",
    name: "Impact Member",
    tagline: "Amplify earnings and fund a little good every month.",
    priceMonthly: 5,
    affiliateBoost: 1.25,
    monthlyCauseCredit: 5,
    highlight: true,
    perks: [
      "Everything in Free",
      "25% of eligible partner commissions as account credit (after partners pay us)",
      "£5 monthly cause credit at checkout",
      "Impact Member badge on your profile",
      "Priority affiliate insights",
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
