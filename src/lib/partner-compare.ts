import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import {
  SECONDARY_COMPARE_PLATFORMS,
  partnerButtonLabel,
  platformIdFromStoreName,
} from "@/lib/affiliate-platforms";
import { getPriceComparison } from "@/lib/price-comparison";
import type { AffiliatePlatformId, Product } from "@/types";

export type PartnerCompareLink = {
  platformId: AffiliatePlatformId;
  label: string;
  /** Demo / comparison list price when known */
  listPrice?: number;
  /** Amazon is always primary in the UI */
  primary: boolean;
};

/** Category → preferred secondary order (all platforms still shown). */
const CATEGORY_PRIORITY: Record<string, AffiliatePlatformId[]> = {
  accessories: ["target", "etsy", "walmart", "rei", "clickbank"],
  kitchen: ["target", "walmart", "etsy", "rei", "clickbank"],
  home: ["target", "walmart", "etsy", "clickbank", "rei"],
  apparel: ["rei", "etsy", "target", "walmart", "clickbank"],
  beauty: ["target", "etsy", "walmart", "clickbank", "rei"],
  stationery: ["etsy", "target", "clickbank", "walmart", "rei"],
  consulting: ["clickbank", "etsy", "target", "walmart", "rei"],
  workshops: ["clickbank", "etsy", "target", "walmart", "rei"],
  legal: ["clickbank", "etsy", "target", "walmart", "rei"],
};

function categoryKey(category: string): string {
  return category.trim().toLowerCase();
}

function outdoorish(product: Product): boolean {
  const blob = `${product.name} ${product.category} ${product.description}`.toLowerCase();
  return /outdoor|backpack|lantern|trail|camp|hike|bottle|jacket|hemp/.test(
    blob
  );
}

/**
 * Build partner compare links for a product.
 * Amazon is always first; Target, REI, Etsy, Walmart, ClickBank follow
 * (ordered by category relevance) so shoppers can compare and buy easily.
 */
export function getPartnerCompareLinks(
  product: Product,
  opts?: { maxSecondary?: number; amazonOnly?: boolean }
): PartnerCompareLink[] {
  const maxSecondary = Math.min(
    SECONDARY_COMPARE_PLATFORMS.length,
    Math.max(0, opts?.maxSecondary ?? SECONDARY_COMPARE_PLATFORMS.length)
  );
  const comparison = getPriceComparison(product);
  const priceByPlatform = new Map<AffiliatePlatformId, number>();

  for (const row of comparison?.competitors ?? []) {
    const id = platformIdFromStoreName(row.store);
    if (id) priceByPlatform.set(id, row.price);
  }

  // Estimate demo list prices for platforms without a competitor row
  const estimate = (platformId: AffiliatePlatformId): number => {
    const known = priceByPlatform.get(platformId);
    if (known != null) return known;
    const bump =
      platformId === "rei"
        ? 1.12
        : platformId === "etsy"
          ? 1.08
          : platformId === "clickbank"
            ? 1.15
            : platformId === "walmart"
              ? 0.95
              : 1.05;
    return Number((product.price * bump).toFixed(0));
  };

  const priority =
    CATEGORY_PRIORITY[categoryKey(product.category)] ??
    ([...SECONDARY_COMPARE_PLATFORMS] as AffiliatePlatformId[]);

  const orderedSecondary: AffiliatePlatformId[] = [];
  for (const id of priority) {
    if (SECONDARY_COMPARE_PLATFORMS.includes(id) && !orderedSecondary.includes(id)) {
      orderedSecondary.push(id);
    }
  }
  for (const id of SECONDARY_COMPARE_PLATFORMS) {
    if (!orderedSecondary.includes(id)) orderedSecondary.push(id);
  }

  if (outdoorish(product)) {
    const reiIdx = orderedSecondary.indexOf("rei");
    if (reiIdx > 0) {
      orderedSecondary.splice(reiIdx, 1);
      orderedSecondary.unshift("rei");
    }
  }

  const secondary = opts?.amazonOnly
    ? []
    : orderedSecondary.slice(0, maxSecondary);

  return [
    {
      platformId: "amazon",
      label: getAmazonStoreLabel(),
      listPrice: priceByPlatform.get("amazon") ?? estimate("amazon"),
      primary: true,
    },
    ...secondary.map((platformId) => ({
      platformId,
      label: partnerButtonLabel(platformId),
      listPrice: estimate(platformId),
      primary: false as const,
    })),
  ];
}

/** Lowest known partner list price (excludes Forest Buddies). */
export function lowestPartnerListPrice(
  links: PartnerCompareLink[]
): number | null {
  const prices = links
    .map((l) => l.listPrice)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}
