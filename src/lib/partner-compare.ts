import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import {
  COMPARE_PLATFORM_ORDER,
  SECONDARY_COMPARE_PLATFORMS,
  isLiveExternalPartner,
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
  /** Amazon is always primary in the UI when live */
  primary: boolean;
};

/** Category → preferred secondary order among *live* secondaries only. */
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
 * Only LIVE_EXTERNAL_PARTNER_IDS are returned (Amazon today).
 * Re-enable others by adding their id to that list when approved.
 */
export function getPartnerCompareLinks(
  product: Product,
  opts?: { maxSecondary?: number; amazonOnly?: boolean }
): PartnerCompareLink[] {
  const liveSecondaries = SECONDARY_COMPARE_PLATFORMS;
  const maxSecondary = Math.min(
    liveSecondaries.length,
    Math.max(0, opts?.maxSecondary ?? liveSecondaries.length)
  );
  const comparison = getPriceComparison(product);
  const priceByPlatform = new Map<AffiliatePlatformId, number>();

  for (const row of comparison?.competitors ?? []) {
    const id = platformIdFromStoreName(row.store);
    if (id && isLiveExternalPartner(id)) priceByPlatform.set(id, row.price);
  }

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
    ([...liveSecondaries] as AffiliatePlatformId[]);

  const orderedSecondary: AffiliatePlatformId[] = [];
  for (const id of priority) {
    if (liveSecondaries.includes(id) && !orderedSecondary.includes(id)) {
      orderedSecondary.push(id);
    }
  }
  for (const id of liveSecondaries) {
    if (!orderedSecondary.includes(id)) orderedSecondary.push(id);
  }

  if (outdoorish(product)) {
    const reiIdx = orderedSecondary.indexOf("rei");
    if (reiIdx > 0) {
      orderedSecondary.splice(reiIdx, 1);
      orderedSecondary.unshift("rei");
    }
  }

  const secondary =
    opts?.amazonOnly || liveSecondaries.length === 0
      ? []
      : orderedSecondary.slice(0, maxSecondary);

  const links: PartnerCompareLink[] = [];

  if (isLiveExternalPartner("amazon")) {
    links.push({
      platformId: "amazon",
      label: getAmazonStoreLabel(),
      listPrice: priceByPlatform.get("amazon") ?? estimate("amazon"),
      primary: true,
    });
  }

  for (const platformId of secondary) {
    if (!isLiveExternalPartner(platformId)) continue;
    links.push({
      platformId,
      label: partnerButtonLabel(platformId),
      listPrice: estimate(platformId),
      primary: false,
    });
  }

  // If Amazon isn't live but other partners are, still return them
  if (links.length === 0) {
    for (const platformId of COMPARE_PLATFORM_ORDER) {
      if (!isLiveExternalPartner(platformId)) continue;
      links.push({
        platformId,
        label: partnerButtonLabel(platformId),
        listPrice: estimate(platformId),
        primary: platformId === COMPARE_PLATFORM_ORDER[0],
      });
    }
  }

  return links;
}

/** Lowest known partner list price among live partners only. */
export function lowestPartnerListPrice(
  links: PartnerCompareLink[]
): number | null {
  const prices = links
    .map((l) => l.listPrice)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}
