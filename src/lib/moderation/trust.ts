import type { FlagHit, FlagSeverity, SellerTrustMetrics, SellerTrustTier } from "@/types/moderation";
import type { SellerProduct, SellerProfile } from "@/types";

/** Thresholds — tune centrally for scale. */
export const TRUST_CONFIG = {
  standardMinApproved: 3,
  trustedMinApproved: 5,
  trustedMaxRejectionRate: 0.15,
  standardMaxRejectionRate: 0.35,
  trustedMaxOpenReports: 1,
} as const;

export function computeTrustMetrics(
  seller: Pick<SellerProfile, "products">,
  openReportCount = 0
): SellerTrustMetrics {
  const approvedCount = seller.products.filter((p) => p.status === "approved").length;
  const rejectedCount = seller.products.filter((p) => p.status === "rejected").length;
  const decided = approvedCount + rejectedCount;
  return {
    approvedCount,
    rejectedCount,
    openReportCount,
    rejectionRate: decided === 0 ? 0 : rejectedCount / decided,
  };
}

export function deriveTrustTier(
  metrics: SellerTrustMetrics,
  override?: SellerTrustTier | null
): SellerTrustTier {
  if (override === "trusted" || override === "standard" || override === "new") {
    return override;
  }

  const { approvedCount, rejectionRate, openReportCount } = metrics;

  if (
    approvedCount >= TRUST_CONFIG.trustedMinApproved &&
    rejectionRate <= TRUST_CONFIG.trustedMaxRejectionRate &&
    openReportCount <= TRUST_CONFIG.trustedMaxOpenReports
  ) {
    return "trusted";
  }

  if (
    approvedCount >= TRUST_CONFIG.standardMinApproved &&
    rejectionRate <= TRUST_CONFIG.standardMaxRejectionRate
  ) {
    return "standard";
  }

  return "new";
}

/**
 * Trusted sellers auto-approve when there are no block/high flags.
 * Warn/info flags are recorded but do not block auto-approve for trusted.
 */
export function shouldAutoApprove(
  tier: SellerTrustTier,
  hits: FlagHit[]
): boolean {
  if (tier !== "trusted") return false;
  return !hits.some((h) => h.severity === "block" || h.severity === "high");
}

export function worstSeverity(hits: FlagHit[]): FlagSeverity | null {
  const order: FlagSeverity[] = ["info", "warn", "high", "block"];
  let worst: FlagSeverity | null = null;
  for (const hit of hits) {
    if (!worst || order.indexOf(hit.severity) > order.indexOf(worst)) {
      worst = hit.severity;
    }
  }
  return worst;
}

export function resolveListingDecision(
  seller: SellerProfile,
  product: Pick<
    SellerProduct,
    "name" | "subtitle" | "description" | "category" | "tags" | "price" | "ecoScore"
  >,
  hits: FlagHit[],
  openReportCount = 0
): {
  status: "pending" | "approved";
  tier: SellerTrustTier;
  autoApproved: boolean;
  reviewNote?: string;
} {
  const metrics = computeTrustMetrics(seller, openReportCount);
  const tier = deriveTrustTier(metrics, seller.trustOverride ?? null);
  const auto = shouldAutoApprove(tier, hits);

  if (auto) {
    return {
      status: "approved",
      tier,
      autoApproved: true,
      reviewNote: "Auto-approved (trusted seller)",
    };
  }

  const note =
    hits.length > 0
      ? `Flagged for review: ${hits.map((h) => h.ruleId).join(", ")}`
      : undefined;

  return {
    status: "pending",
    tier,
    autoApproved: false,
    reviewNote: note,
  };
}
