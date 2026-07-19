import type { AffiliatePlatformId } from "@/types";

export interface AffiliatePlatform {
  id: AffiliatePlatformId;
  name: string;
  kind: "first_party" | "external";
  /** Typical cookie / last-click window (days) */
  attributionDaysTypical: number;
  /** Upper bound often cited in partner docs */
  attributionDaysMax: number;
  attributionNote: string;
  /** Display-only typical commission % */
  commissionRateTypical: number;
  commissionNote: string;
  trackingModel: "first_party" | "cookie" | "network_report";
  trackingNote: string;
  /** External partners usually report sales later */
  conversionLatency: "instant" | "delayed";
  payoutNote: string;
  /** Demo associate / publisher tag */
  publisherTag?: string;
}

/**
 * Scalable partner catalog — add platforms here without rewriting UI.
 * Windows & rates mirror common public program norms (demo, not legal advice).
 */
export const AFFILIATE_PLATFORMS: AffiliatePlatform[] = [
  {
    id: "forest-buddies",
    name: "Forest Buddies",
    kind: "first_party",
    attributionDaysTypical: 30,
    attributionDaysMax: 30,
    attributionNote: "Up to 30 days on our first-party checkout links.",
    commissionRateTypical: 12,
    commissionNote: "Product rates 8–15%; Impact Members get a boost.",
    trackingModel: "first_party",
    trackingNote: "Clicks and checkouts tracked on Forest Buddies in real time.",
    conversionLatency: "instant",
    payoutNote: "Pending payout shown in your dashboard after conversion.",
  },
  {
    id: "amazon",
    name: "Amazon Associates",
    kind: "external",
    attributionDaysTypical: 1,
    attributionDaysMax: 1,
    attributionNote:
      "Often ~24 hours last-click; UK and US programme rules can differ.",
    commissionRateTypical: 4,
    commissionNote: "Typically ~1–10% by category; rates change and can reverse.",
    trackingModel: "cookie",
    trackingNote:
      "Outbound clicks tagged with your Associate ID on Amazon UK/US; Amazon reports sales later.",
    conversionLatency: "delayed",
    payoutNote: "Earnings stay pending until the partner confirms (often 1–3 days+).",
    /** Overridden by NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG when set */
    publisherTag: "forestbuddies-21",
  },
  {
    id: "target",
    name: "Target / Roundel",
    kind: "external",
    attributionDaysTypical: 7,
    attributionDaysMax: 14,
    attributionNote: "Usually about 7 days; up to ~14 days on some offers.",
    commissionRateTypical: 3,
    commissionNote: "Offer-based; often low single digits.",
    trackingModel: "network_report",
    trackingNote: "Clicks leave Forest Buddies; conversions arrive via partner reports.",
    conversionLatency: "delayed",
    payoutNote: "Reported and paid on the partner’s schedule.",
    publisherTag: "fb-target",
  },
  {
    id: "rei",
    name: "REI Co-op",
    kind: "external",
    attributionDaysTypical: 14,
    attributionDaysMax: 30,
    attributionNote: "Commonly 14–30 days depending on the active program.",
    commissionRateTypical: 5,
    commissionNote: "Program-dependent; outdoor gear often mid single digits.",
    trackingModel: "network_report",
    trackingNote: "Tracked as an outbound partner click; sales confirmed later.",
    conversionLatency: "delayed",
    payoutNote: "Pending until the network posts the order.",
    publisherTag: "fb-rei",
  },
  {
    id: "etsy",
    name: "Etsy",
    kind: "external",
    attributionDaysTypical: 30,
    attributionDaysMax: 30,
    attributionNote: "Etsy Affiliate typically about 30 days on qualifying purchases.",
    commissionRateTypical: 4,
    commissionNote: "Often a few percent on eligible marketplace orders.",
    trackingModel: "network_report",
    trackingNote: "Outbound search tagged with your publisher ID; Etsy reports later.",
    conversionLatency: "delayed",
    payoutNote: "Paid on the network’s schedule after confirmation.",
    publisherTag: "fb-etsy",
  },
  {
    id: "walmart",
    name: "Walmart",
    kind: "external",
    attributionDaysTypical: 3,
    attributionDaysMax: 3,
    attributionNote: "Creator / affiliate windows are often short (about 3 days).",
    commissionRateTypical: 4,
    commissionNote: "Category-based; rates change by offer.",
    trackingModel: "network_report",
    trackingNote: "Outbound search click; conversions arrive via partner reports.",
    conversionLatency: "delayed",
    payoutNote: "Reported and paid on Walmart’s creator schedule.",
    publisherTag: "fb-walmart",
  },
];

export function getAffiliatePlatform(
  id: AffiliatePlatformId | string | undefined | null
): AffiliatePlatform {
  return (
    AFFILIATE_PLATFORMS.find((p) => p.id === id) ?? AFFILIATE_PLATFORMS[0]
  );
}

/** Short shopper-facing label for partner buttons. */
export function partnerButtonLabel(id: AffiliatePlatformId): string {
  switch (id) {
    case "amazon":
      return "Amazon";
    case "target":
      return "Target";
    case "rei":
      return "REI";
    case "etsy":
      return "Etsy";
    case "walmart":
      return "Walmart";
    default:
      return getAffiliatePlatform(id).name.split(" ")[0] ?? "Partner";
  }
}

/** Map marketplace competitor store labels → platform ids. */
export function platformIdFromStoreName(
  store: string
): AffiliatePlatformId | null {
  const key = store.trim().toLowerCase();
  if (key.includes("amazon")) return "amazon";
  if (key.includes("target")) return "target";
  if (key.includes("rei")) return "rei";
  if (key.includes("etsy")) return "etsy";
  if (key.includes("walmart")) return "walmart";
  return null;
}

/** External partners shown for price compare (Amazon first). */
export const COMPARE_PLATFORM_ORDER: AffiliatePlatformId[] = [
  "amazon",
  "target",
  "rei",
  "etsy",
  "walmart",
];

export function listExternalPlatforms(): AffiliatePlatform[] {
  return AFFILIATE_PLATFORMS.filter((p) => p.kind === "external");
}

export function attributionWindowLabel(platform: AffiliatePlatform): string {
  if (platform.id === "forest-buddies") {
    return "Up to 30 days depending on partner platform";
  }
  if (platform.attributionDaysTypical === platform.attributionDaysMax) {
    if (platform.attributionDaysTypical <= 1) {
      return "Often ~24 hours (varies by category & region)";
    }
    return `About ${platform.attributionDaysTypical} days (program rules apply)`;
  }
  return `About ${platform.attributionDaysTypical}–${platform.attributionDaysMax} days depending on offer`;
}
