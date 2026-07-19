import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import {
  COMPARE_PLATFORM_ORDER,
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

/** Category → secondary partners (Amazon is always added separately). */
const CATEGORY_PARTNERS: Record<string, AffiliatePlatformId[]> = {
  accessories: ["target", "etsy"],
  kitchen: ["target", "walmart", "etsy"],
  home: ["target", "walmart", "etsy"],
  apparel: ["rei", "etsy", "target"],
  beauty: ["target", "etsy"],
  stationery: ["etsy", "target"],
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

function handmadeish(product: Product): boolean {
  const blob = `${product.name} ${product.category} ${product.description}`.toLowerCase();
  return /handmade|notebook|card|wrap|tote|gift|stationery|organic|bamboo/.test(
    blob
  );
}

/**
 * Build partner compare links for a product.
 * Amazon is always first; Target / REI / Etsy / Walmart follow by relevance + price data.
 */
export function getPartnerCompareLinks(
  product: Product,
  opts?: { maxSecondary?: number }
): PartnerCompareLink[] {
  const maxSecondary = Math.min(4, Math.max(1, opts?.maxSecondary ?? 3));
  const comparison = getPriceComparison(product);
  const priceByPlatform = new Map<AffiliatePlatformId, number>();

  for (const row of comparison?.competitors ?? []) {
    const id = platformIdFromStoreName(row.store);
    if (id) priceByPlatform.set(id, row.price);
  }

  const suggested = new Set<AffiliatePlatformId>();
  for (const id of CATEGORY_PARTNERS[categoryKey(product.category)] ?? [
    "target",
    "etsy",
  ]) {
    suggested.add(id);
  }
  if (outdoorish(product)) suggested.add("rei");
  if (handmadeish(product)) suggested.add("etsy");

  // Prefer platforms that already have a competitor price row
  for (const id of priceByPlatform.keys()) {
    if (id !== "amazon") suggested.add(id);
  }

  const secondary = COMPARE_PLATFORM_ORDER.filter(
    (id) => id !== "amazon" && suggested.has(id)
  ).slice(0, maxSecondary);

  const links: PartnerCompareLink[] = [
    {
      platformId: "amazon",
      label: getAmazonStoreLabel(),
      listPrice: priceByPlatform.get("amazon"),
      primary: true,
    },
    ...secondary.map((platformId) => ({
      platformId,
      label: partnerButtonLabel(platformId),
      listPrice: priceByPlatform.get(platformId),
      primary: false,
    })),
  ];

  return links;
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
