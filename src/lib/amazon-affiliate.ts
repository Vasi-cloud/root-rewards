/**
 * Amazon Associates helpers.
 * Associate tag: forestbuddies-20 (override with NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG).
 */

export type AmazonMarketplace = "uk" | "us";

/** Forest Buddies Amazon Associates ID */
export const AMAZON_ASSOCIATE_TAG = "forestbuddies-20";

/** Official Amazon product hosts + common short-link hosts we accept in Admin. */
const AMAZON_SHORT_HOSTS = new Set(["amzn.to", "a.co", "amzn.com"]);

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

/** Ensure absolute URL (Admin pastes often omit https://). */
export function normalizeAmazonProductUrl(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  return s;
}

function amazonHostname(rawUrl: string): string | null {
  try {
    const url = new URL(normalizeAmazonProductUrl(rawUrl));
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Pull ASIN from common Amazon product URL shapes. */
export function extractAsinFromAmazonUrl(
  raw: string | null | undefined
): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(normalizeAmazonProductUrl(raw));
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (AMAZON_SHORT_HOSTS.has(host)) return null;
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

/**
 * True for full amazon.com / amazon.co.uk (etc.) links and amzn.to / a.co short links.
 */
export function isValidAmazonAffiliateUrl(raw: string): boolean {
  const host = amazonHostname(raw);
  if (!host) return false;
  if (AMAZON_SHORT_HOSTS.has(host)) return true;
  return host.includes("amazon.");
}

export function isAmazonShortLink(raw: string): boolean {
  const host = amazonHostname(raw);
  return Boolean(host && AMAZON_SHORT_HOSTS.has(host));
}

/**
 * Ensure Associates `tag` is present on a saved Amazon URL.
 * Preserves an existing tag (e.g. forestbuddies-21) so Admin edits stick.
 * Only injects the default tag when the URL has none.
 * Short links (amzn.to / a.co) are preserved as-is.
 */
export function ensureAmazonAffiliateTag(
  rawUrl: string,
  affiliateCode?: string
): string {
  const normalized = normalizeAmazonProductUrl(rawUrl);
  const url = new URL(normalized);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (AMAZON_SHORT_HOSTS.has(host)) {
    return url.toString();
  }

  if (!url.searchParams.get("tag")?.trim()) {
    url.searchParams.set("tag", getAmazonAssociateTag());
  }
  if (affiliateCode) {
    url.searchParams.set("ascsubtag", affiliateCode);
  }
  return url.toString();
}

/**
 * Build a tagged Amazon product or search URL.
 * Always includes `tag=forestbuddies-20` (or env override) for Associates tracking
 * when the destination is a full Amazon product/search URL.
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
