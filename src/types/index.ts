import type { FlagHit, SellerTrustTier } from "@/types/moderation";

export type { SellerTrustTier } from "@/types/moderation";

export type MembershipTierId = "free" | "impact";

export type AccountStatus = "active" | "deactivated";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "customer" | "affiliate" | "admin" | "seller";
  affiliateCode?: string;
  membershipTier?: MembershipTierId;
  /** Soft-delete flag — data retained for legal / compliance */
  accountStatus?: AccountStatus;
  /** When the account was soft-deactivated (ISO) */
  deactivatedAt?: string;
  createdAt?: string;
}

export type SellerStatus =
  | "none"
  | "pending"
  | "approved"
  | "paused"
  | "rejected";

export type ProductApprovalStatus = "pending" | "approved" | "rejected";

export type PayoutStatus = "scheduled" | "processing" | "paid" | "failed";

/** Brand / solo operator on Forest Buddies */
export type SellerType = "individual" | "business";

/** Payload for the Become a Seller application */
export interface SellerApplicationInput {
  sellerType: SellerType;
  /** Public shop / practice name */
  shopName: string;
  bio: string;
  story?: string;
  location?: string;
  /** Self-employed trading name (may match shopName) */
  tradingName?: string;
  /** Comma-separated or free-text services / offerings */
  servicesOffered?: string;
  /** Background for solo professionals */
  professionalBackground?: string;
  /** Registered company / brand legal name */
  companyName?: string;
}

/** Goods vs bookable / deliverable services */
export type ListingType = "product" | "service";

export type ServiceDeliveryMode = "in_person" | "remote" | "hybrid";

/** Regional size row for apparel / soft goods (aligned EU · UK · US). */
export interface SizeChartRow {
  eu: string;
  uk: string;
  us: string;
  /** Optional body measurement hints (cm) */
  chestCm?: string;
  waistCm?: string;
}

export interface SizeChart {
  rows: SizeChartRow[];
  /** e.g. "True to size — size up for a relaxed fit" */
  note?: string;
}

export interface SellerProduct {
  id: string;
  /** Goods or service offering */
  listingType?: ListingType;
  /** Primary product title */
  name: string;
  /** Short marketing subtitle */
  subtitle: string;
  description: string;
  category: string;
  /** Search keywords / tags */
  tags: string[];
  price: number;
  ecoScore: number;
  /** Units in stock (products) or bookable slots (services) */
  stock: number;
  /** Hero / listing photo (SVG or URL) */
  imageUrl?: string;
  /** Extra gallery frames for Etsy-style detail */
  gallery?: string[];
  /** Materials & origin storytelling (products) or “what’s included” (services) */
  materials?: string;
  madeIn?: string;
  careNotes?: string;
  /** How it fits / who it suits — reduces wrong-size returns */
  fitGuide?: string;
  /** Physical measurements when size chart does not apply */
  dimensions?: string;
  /** Apparel / soft-goods size chart (EU / UK / US) */
  sizeChart?: SizeChart;
  /** Service duration e.g. "60 min", "half day" */
  duration?: string;
  /** How the service is delivered */
  deliveryMode?: ServiceDeliveryMode;
  /** Booking / availability note */
  availabilityNote?: string;
  /** Short maker story on the card */
  storySnippet?: string;
  /** How buying this funds impact */
  impactNote?: string;
  /** Admin moderation status */
  status: ProductApprovalStatus;
  reviewedAt?: string;
  reviewNote?: string;
  /** True when auto-approved via trusted seller path */
  autoApproved?: boolean;
  /** Snapshot of rule hits at last submit */
  flagHits?: FlagHit[];
  /** Demo analytics */
  views: number;
  sales: number;
  createdAt: string;
}

export interface SellerAnalytics {
  views: number;
  viewsThisMonth: number;
  sales: number;
  salesThisMonth: number;
  /** Percent, e.g. 1.2 */
  conversionRate: number;
}

export interface SellerPayout {
  id: string;
  amount: number;
  status: PayoutStatus;
  method: string;
  scheduledFor: string;
  paidAt?: string;
}

export interface SellerCauseImpact {
  causeId: string;
  unitsSupported: number;
  label?: string;
}

export interface SellerEarningsBreakdown {
  /** Gross product sales this period */
  productSales: number;
  /** Platform fee (15%) */
  platformFee: number;
  /** Seller net after fee */
  sellerShare: number;
  /** Optional share allocated to causes (demo) */
  causeContribution: number;
  /** Category split for motivational chart */
  byCategory: { category: string; amount: number }[];
}

export interface SellerProfile {
  uid: string;
  email: string;
  shopName: string;
  /** Public URL segment: /shop/[slug] */
  slug: string;
  /** Solo / self-employed vs registered brand */
  sellerType?: SellerType;
  /** Short one-liner about the brand */
  bio: string;
  /** Longer founder / brand story */
  story?: string;
  /** Self-employed trading name shown on the public shop */
  tradingName?: string;
  /** What they offer — services and/or goods (application + profile) */
  servicesOffered?: string;
  /** Solo professional background / credentials */
  professionalBackground?: string;
  /** Registered company or legal brand name */
  companyName?: string;
  /** Optional shop banner photo */
  coverImageUrl?: string;
  /** City / region shown on the public shop */
  location?: string;
  /** One-line founder note under the hero */
  founderNote?: string;
  /** Narrative tying products to causes */
  impactStory?: string;
  /** Causes the shop supports */
  impact?: SellerCauseImpact[];
  status: SellerStatus;
  appliedAt?: string;
  approvedAt?: string;
  /** Seller paused their shop — listings hidden, data kept */
  pausedAt?: string;
  /** Seller left the program — can re-apply; data kept */
  canceledAt?: string;
  /**
   * Admin override for trust tier.
   * When set, used instead of computed metrics.
   */
  trustOverride?: SellerTrustTier | null;
  /** Last computed tier (cached for UI) */
  trustTier?: SellerTrustTier;
  products: SellerProduct[];
  earnings: {
    total: number;
    /** In escrow / awaiting next cycle */
    pending: number;
    /** Ready to request payout */
    available: number;
    thisMonth: number;
    orders: number;
    breakdown?: SellerEarningsBreakdown;
  };
  analytics: SellerAnalytics;
  payouts: SellerPayout[];
  payoutMethod?: string;
}

export interface CompetitorPrice {
  store: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sustainabilityScore: number;
  affiliateCommissionPercent: number;
  /** When set, checkout credits this seller's earnings */
  sellerUid?: string;
  /** Goods (default) or service offering */
  listingType?: ListingType;
  rentalDuration?: number; // days, only for rental items
  /** Optional external price comparisons (Amazon, etc.) */
  competitorPrices?: CompetitorPrice[];
  /** Amazon ASIN for deep affiliate links (falls back to tagged search) */
  amazonAsin?: string;
  /** Rich listing details — shown in product detail to reduce returns */
  materials?: string;
  madeIn?: string;
  careNotes?: string;
  fitGuide?: string;
  dimensions?: string;
  sizeChart?: SizeChart;
  duration?: string;
  deliveryMode?: ServiceDeliveryMode;
  availabilityNote?: string;
}

export interface AffiliateStats {
  clicks: number;
  conversions: number;
  earnings: number;
  pendingPayout: number;
  /** Confirmed payouts only (external partners may hold more in pending) */
  pendingPartnerReports?: number;
}

export type AffiliatePlatformId =
  | "forest-buddies"
  | "amazon"
  | "target"
  | "rei";

export type AffiliateEventType = "click" | "conversion" | "outbound";

export type AffiliateConversionStatus =
  | "confirmed"
  | "pending"
  | "reversed";

export interface AffiliateEvent {
  id: string;
  type: AffiliateEventType;
  code: string;
  platformId?: AffiliatePlatformId;
  productId?: string;
  productName?: string;
  orderTotal?: number;
  commission?: number;
  /** External partners often post pending first */
  status?: AffiliateConversionStatus;
  /** Destination host for outbound partner clicks */
  destination?: string;
  createdAt: string;
}

export interface AffiliateAttribution {
  code: string;
  capturedAt: string;
  expiresAt: string;
  platformId?: AffiliatePlatformId;
  productId?: string;
  productName?: string;
  landingPath?: string;
}

export interface CartItem extends Product {
  quantity: number;
  rentalDuration?: number;
}
