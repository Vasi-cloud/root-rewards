/** Scalable moderation types — keep product/seller domain types separate. */

export type SellerTrustTier = "new" | "standard" | "trusted";

export type FlagSeverity = "info" | "warn" | "high" | "block";

export type FlagSource = "rule" | "report" | "manual";

export type ReportReason =
  | "misleading_eco"
  | "low_quality"
  | "spam"
  | "wrong_category"
  | "other";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export type FlagStatus = "open" | "resolved" | "dismissed";

export interface SellerTrustMetrics {
  approvedCount: number;
  rejectedCount: number;
  openReportCount: number;
  /** 0–1 */
  rejectionRate: number;
}

export interface FlagHit {
  ruleId: string;
  severity: FlagSeverity;
  message: string;
}

export interface ModerationFlag {
  id: string;
  ruleId: string;
  severity: FlagSeverity;
  source: FlagSource;
  message: string;
  productId: string;
  productName: string;
  sellerUid?: string;
  shopName?: string;
  status: FlagStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface ProductReport {
  id: string;
  productId: string;
  productName: string;
  sellerUid?: string;
  shopName?: string;
  reporterUid?: string;
  reason: ReportReason;
  note: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  misleading_eco: "Misleading eco claims",
  low_quality: "Poor quality / not as described",
  spam: "Spam or fake listing",
  wrong_category: "Wrong category",
  other: "Other",
};
