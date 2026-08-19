/**
 * Amazon Associates helpers.
 * Associate tag: forestbuddies-20 (override with NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG).
 */

export type AmazonMarketplace = "uk" | "us";

/** Forest Buddies Amazon Associates ID */
export const AMAZON_ASSOCIATE_TAG = "forestbuddies-20";

export function getAmazonMarketplace(): AmazonMarketplace {
  const raw = (
    process.env.NEXT_PUBLIC_AMAZON_MARKETPLACE ?? "us"
  ).toLowerCase();
  return raw === "uk" ? "uk" : "us";
}

export function getAmazonHost(): string {
  return getAmazonMarketplace() === "uk"
    ? "www.amazon.co.uk"
    : "www.amazon.com";
}

export function getAmazonAssociateTag(): string {
  return (
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim() || AMAZON_ASSOCIATE_TAG
  );
}

export function getAmazonStoreLabel(): string {
  return getAmazonMarketplace() === "uk" ? "Amazon UK" : "Amazon";
}

/** Pull ASIN from common Amazon product URL shapes. */
export function extractAsinFromAmazonUrl(
  raw: string | null | undefined
): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("amazon.")) return null;
    const dp = url.pathname.match(
      /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{8,})/i
    );
    if (dp?.[1]) return dp[1].toUpperCase();
    const asinParam = url.searchParams.get("asin");
    if (asinParam && /^[A-Z0-9]{8,}$/i.test(asinParam)) {
      return asinParam.toUpperCase();
    }
  } catch {
    return null;
  }
  return null;
}

/** True when URL looks like an Amazon product/search link we can use. */
export function isValidAmazonAffiliateUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host.includes("amazon.");
  } catch {
    return false;
  }
}

/**
 * Ensure Associates `tag` is present on a saved Amazon URL.
 * Keeps path/query; sets/overwrites tag to our Associate ID.
 */
export function ensureAmazonAffiliateTag(
  rawUrl: string,
  affiliateCode?: string
): string {
  const url = new URL(rawUrl.trim());
  url.searchParams.set("tag", getAmazonAssociateTag());
  if (affiliateCode) {
    url.searchParams.set("ascsubtag", affiliateCode);
  }
  return url.toString();
}

/**
 * Build a tagged Amazon product or search URL.
 * Always includes `tag=forestbuddies-20` (or env override) for Associates tracking.
 */
export function buildAmazonAffiliateUrl(opts: {
  productName: string;
  amazonAsin?: string | null;
  /** Prefer this full saved Associates URL when present */
  amazonAffiliateUrl?: string | null;
  affiliateCode?: string;
}): string {
  if (
    opts.amazonAffiliateUrl &&
    isValidAmazonAffiliateUrl(opts.amazonAffiliateUrl)
  ) {
    return ensureAmazonAffiliateTag(
      opts.amazonAffiliateUrl,
      opts.affiliateCode
    );
  }

  const host = getAmazonHost();
  const tag = getAmazonAssociateTag();
  const asin = opts.amazonAsin?.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (asin && asin.length >= 8) {
    const url = new URL(`https://${host}/dp/${asin}`);
    url.searchParams.set("tag", tag);
    if (opts.affiliateCode) {
      url.searchParams.set("ascsubtag", opts.affiliateCode);
    }
    return url.toString();
  }

  const url = new URL(`https://${host}/s`);
  url.searchParams.set("k", opts.productName.trim() || "eco friendly");
  url.searchParams.set("tag", tag);
  if (opts.affiliateCode) {
    url.searchParams.set("ascsubtag", opts.affiliateCode);
  }
  return url.toString();
}
