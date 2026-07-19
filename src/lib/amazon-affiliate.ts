/**
 * Amazon Associates helpers — UK-first with optional US marketplace.
 * Client-safe: uses NEXT_PUBLIC_* env vars.
 */

export type AmazonMarketplace = "uk" | "us";

const DEMO_TAGS: Record<AmazonMarketplace, string> = {
  uk: "forestbuddies-21",
  us: "forestbuddies-20",
};

export function getAmazonMarketplace(): AmazonMarketplace {
  const raw = (
    process.env.NEXT_PUBLIC_AMAZON_MARKETPLACE ?? "uk"
  ).toLowerCase();
  return raw === "us" ? "us" : "uk";
}

export function getAmazonHost(): string {
  return getAmazonMarketplace() === "us"
    ? "www.amazon.com"
    : "www.amazon.co.uk";
}

export function getAmazonAssociateTag(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim() ||
    (getAmazonMarketplace() === "uk"
      ? process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG_UK?.trim()
      : process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG_US?.trim());
  return fromEnv || DEMO_TAGS[getAmazonMarketplace()];
}

export function getAmazonStoreLabel(): string {
  return getAmazonMarketplace() === "uk" ? "Amazon UK" : "Amazon";
}

/** Build a tagged Amazon product or search URL. */
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
