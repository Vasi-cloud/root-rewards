/**
 * Amazon Associates helpers.
 *
 * Default tags by storefront (only when the URL has no tag=):
 *   amazon.co.uk → forestbuddies-21
 *   amazon.com   → forestbuddies-20
 *
 * If a stored URL already has tag=, it is never rewritten.
 */

export type AmazonMarketplace = "uk" | "us";

/** US Associates tag */
export const AMAZON_ASSOCIATE_TAG_US = "forestbuddies-20";
/** UK Associates tag */
export const AMAZON_ASSOCIATE_TAG_UK = "forestbuddies-21";

/** @deprecated Prefer AMAZON_ASSOCIATE_TAG_US / host-based helpers */
export const AMAZON_ASSOCIATE_TAG = AMAZON_ASSOCIATE_TAG_US;

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

/** Default tag for the configured site marketplace (fallback when no URL host). */
export function getAmazonAssociateTag(): string {
  const env = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim();
  if (env) return env;
  return getAmazonMarketplace() === "uk"
    ? AMAZON_ASSOCIATE_TAG_UK
    : AMAZON_ASSOCIATE_TAG_US;
}

/**
 * Associates tag for a given Amazon hostname.
 * .co.uk → forestbuddies-21; .com (and other amazon hosts) → forestbuddies-20.
 */
export function getAmazonAssociateTagForHost(hostname: string): string {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  if (host === "amazon.co.uk" || host.endsWith(".amazon.co.uk")) {
    return AMAZON_ASSOCIATE_TAG_UK;
  }
  return AMAZON_ASSOCIATE_TAG_US;
}

export function getAmazonStoreLabel(): string {
  return getAmazonMarketplace() === "uk" ? "Amazon UK" : "Amazon";
}

export function getAmazonStoreLabelForUrl(rawUrl: string): string {
  const host = amazonHostname(rawUrl);
  if (host === "amazon.co.uk" || host?.endsWith(".amazon.co.uk")) {
    return "Amazon UK";
  }
  return "Amazon";
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

/** Read tag= from a URL if present (query string). */
export function readAmazonTagFromUrl(raw: string): string | null {
  try {
    const url = new URL(normalizeAmazonProductUrl(raw));
    const tag = url.searchParams.get("tag")?.trim();
    return tag || null;
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
 * Normalize a stored Amazon URL for save / Shop Amazon.
 * - Keeps an existing tag= unchanged (e.g. forestbuddies-21 on .co.uk).
 * - If no tag: amazon.co.uk → forestbuddies-21, amazon.com → forestbuddies-20.
 * - Short links (amzn.to / a.co) are preserved as-is.
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

  const existingTag = url.searchParams.get("tag")?.trim();
  if (!existingTag) {
    url.searchParams.set("tag", getAmazonAssociateTagForHost(url.hostname));
  }
  // Never overwrite an existing tag.

  if (affiliateCode) {
    url.searchParams.set("ascsubtag", affiliateCode);
  }
  return url.toString();
}

/**
 * Build a tagged Amazon product or search URL.
 * Prefers the stored Associates URL and never forces forestbuddies-20 onto .co.uk.
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
  const tag = getAmazonAssociateTagForHost(host);
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
