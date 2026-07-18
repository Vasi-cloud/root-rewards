import {
  getAffiliatePlatform,
  type AffiliatePlatform,
} from "@/lib/affiliate-platforms";
import { affiliateRateWithMembership } from "@/lib/membership";
import type { AffiliatePlatformId, MembershipTierId } from "@/types";

/** Fallback max for first-party demo cookie when platform omitted. */
const ATTRIBUTION_DAYS = 30;

/** User-facing copy — attribution varies by brand/partner. */
export const ATTRIBUTION_WINDOW_LABEL =
  "Up to 30 days depending on partner platform";

export const ATTRIBUTION_WINDOW_SHORT =
  "up to 30 days (varies by partner)";

export function generateAffiliateCode(seed?: string): string {
  const base =
    (seed ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8) || "buddy";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`.toUpperCase();
}

export function attributionExpiry(
  from = new Date(),
  platformId?: AffiliatePlatformId | null
): string {
  const platform = getAffiliatePlatform(platformId ?? "forest-buddies");
  const days = Math.max(1, platform.attributionDaysMax);
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isAttributionValid(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() > now.getTime();
}

export function buildReferralUrl(opts: {
  origin: string;
  code: string;
  path?: string;
  productId?: string;
}): string {
  const url = new URL(opts.path ?? "/marketplace", opts.origin);
  url.searchParams.set("ref", opts.code);
  if (opts.productId) url.searchParams.set("product", opts.productId);
  return url.toString();
}

/**
 * Build a realistic outbound partner URL (demo destinations).
 * Amazon uses Associate `tag`; others use subId-style query params.
 */
export function buildPartnerOutboundUrl(opts: {
  platformId: AffiliatePlatformId;
  productName: string;
  productId?: string;
  affiliateCode: string;
}): string {
  const platform = getAffiliatePlatform(opts.platformId);
  const tag = platform.publisherTag ?? "forestbuddies";
  const q = encodeURIComponent(opts.productName);
  const sub = encodeURIComponent(opts.affiliateCode);

  switch (opts.platformId) {
    case "amazon":
      return `https://www.amazon.com/s?k=${q}&tag=${encodeURIComponent(tag)}&ascsubtag=${sub}`;
    case "target":
      return `https://www.target.com/s?searchTerm=${q}&afid=${encodeURIComponent(tag)}&ref=${sub}`;
    case "rei":
      return `https://www.rei.com/search?q=${q}&cm_mmc=${encodeURIComponent(tag)}-${sub}`;
    default:
      return `/marketplace${opts.productId ? `?product=${opts.productId}` : ""}`;
  }
}

export function computeCommission(opts: {
  orderTotal: number;
  basePercent: number;
  membershipTier?: MembershipTierId | null;
  /** External platforms ignore Impact boost (partner pays their own rates) */
  platformId?: AffiliatePlatformId | null;
}): number {
  const platform = getAffiliatePlatform(opts.platformId ?? "forest-buddies");
  const base =
    platform.kind === "external"
      ? platform.commissionRateTypical
      : opts.basePercent;
  const rate =
    platform.kind === "external"
      ? base
      : affiliateRateWithMembership(base, opts.membershipTier);
  return Number(((opts.orderTotal * rate) / 100).toFixed(2));
}

export function estimateExternalOrderTotal(
  productPrice: number,
  platform: AffiliatePlatform
): number {
  // External carts are unknown — demo uses competitor-ish list price ± noise
  const jitter = 0.92 + (platform.id.length % 5) * 0.02;
  return Number((productPrice * jitter).toFixed(2));
}

export { ATTRIBUTION_DAYS };
export type { AffiliatePlatform };
