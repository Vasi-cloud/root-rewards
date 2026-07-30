import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Leaf,
  Lock,
  Recycle,
  ShieldCheck,
  Truck,
} from "lucide-react";

export type TrustBadgeId =
  | "secure-checkout"
  | "eco-verified"
  | "buyer-protection"
  | "encrypted"
  | "free-returns"
  | "impact-tracked";

export type TrustBadge = {
  id: TrustBadgeId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

/**
 * Trust signals — keep wording accurate for soft launch.
 * Prefer secure checkout / SSL / eco-scored / impact tracked over over-claims.
 */
export const TRUST_BADGES: TrustBadge[] = [
  {
    id: "secure-checkout",
    label: "Secure checkout",
    shortLabel: "Secure checkout",
    description: "HTTPS checkout · Stripe when configured, otherwise demo pay",
    icon: Lock,
  },
  {
    id: "eco-verified",
    label: "Eco-scored",
    shortLabel: "Eco-scored",
    description: "Products scored for materials, makers, and carbon care",
    icon: Leaf,
  },
  {
    id: "buyer-protection",
    label: "Seller policies",
    shortLabel: "Seller policies",
    description: "Return and shipping terms vary by seller — see listing details",
    icon: ShieldCheck,
  },
  {
    id: "encrypted",
    label: "SSL encrypted",
    shortLabel: "SSL encrypted",
    description: "Connection protected over HTTPS",
    icon: BadgeCheck,
  },
  {
    id: "free-returns",
    label: "Returns guidance",
    shortLabel: "Returns guidance",
    description: "See Returns for Forest Buddies–fulfilled vs seller-fulfilled orders",
    icon: Recycle,
  },
  {
    id: "impact-tracked",
    label: "Impact tracked",
    shortLabel: "Impact tracked",
    description: "Cause gifts shown at checkout — illustrative / partner-funded",
    icon: Truck,
  },
];

export const CHECKOUT_TRUST_IDS: TrustBadgeId[] = [
  "secure-checkout",
  "encrypted",
  "impact-tracked",
  "eco-verified",
];

/** Footer: only signals that hold for soft launch today. */
export const FOOTER_TRUST_IDS: TrustBadgeId[] = [
  "secure-checkout",
  "encrypted",
  "eco-verified",
  "impact-tracked",
];

export const PRODUCT_TRUST_IDS: TrustBadgeId[] = [
  "eco-verified",
  "impact-tracked",
  "secure-checkout",
  "buyer-protection",
];

export function getTrustBadges(ids: TrustBadgeId[]): TrustBadge[] {
  const map = new Map(TRUST_BADGES.map((b) => [b.id, b]));
  return ids.map((id) => map.get(id)).filter((b): b is TrustBadge => Boolean(b));
}

export type ProductReview = {
  id: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  dateLabel: string;
  verified: boolean;
};

const REVIEW_POOL: Omit<ProductReview, "id">[] = [
  {
    author: "Maya R.",
    location: "Portland, OR",
    rating: 5,
    title: "Exactly as described",
    body: "Quality feels solid and the eco details on the page matched what arrived. Packaging was minimal — loved that.",
    dateLabel: "2 weeks ago",
    verified: true,
  },
  {
    author: "Jordan L.",
    location: "Austin, TX",
    rating: 5,
    title: "Gift-ready and planet-kind",
    body: "Bought this as a housewarming gift. Fit the size guide perfectly and checkout felt clear about the cause donation.",
    dateLabel: "1 month ago",
    verified: true,
  },
  {
    author: "Sam K.",
    location: "San Diego, CA",
    rating: 4,
    title: "Great everyday piece",
    body: "Uses well after a few weeks. Wish I’d checked the size chart sooner — exchange was easy though.",
    dateLabel: "3 weeks ago",
    verified: true,
  },
  {
    author: "Priya N.",
    location: "Seattle, WA",
    rating: 5,
    title: "Transparent materials story",
    body: "Appreciated the care notes and materials list. Feels like shopping with a conscience, not a brochure.",
    dateLabel: "5 days ago",
    verified: true,
  },
  {
    author: "Chris W.",
    location: "Denver, CO",
    rating: 4,
    title: "Solid value vs big stores",
    body: "Compared prices with Amazon — Forest Buddies was better and the impact line at checkout sealed it.",
    dateLabel: "1 week ago",
    verified: true,
  },
  {
    author: "Elena V.",
    location: "Chicago, IL",
    rating: 5,
    title: "Will buy again",
    body: "Arrived promptly (demo shipping). The product feels durable and the seller story made me trust the listing.",
    dateLabel: "4 days ago",
    verified: true,
  },
];

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic mock reviews for a product id (stable across reloads). */
export function getMockReviews(
  productId: string,
  count = 3
): ProductReview[] {
  const start = hashId(productId) % REVIEW_POOL.length;
  const out: ProductReview[] = [];
  for (let i = 0; i < count; i++) {
    const base = REVIEW_POOL[(start + i) % REVIEW_POOL.length];
    out.push({
      ...base,
      id: `${productId}-rev-${i}`,
    });
  }
  return out;
}

export function averageRating(reviews: ProductReview[]): number {
  if (reviews.length === 0) return 0;
  return (
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
    ) / 10
  );
}
