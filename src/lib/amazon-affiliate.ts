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

/**
 * Build a tagged Amazon product or search URL.
 * Always includes `tag=forestbuddies-20` (or env override) for Associates tracking.
 */
export function buildAmazonAffiliateUrl(opts: {
  productName: string;
  amazonAsin?: string | null;
  affiliateCode?: string;
}): string {
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
