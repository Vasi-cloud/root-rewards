import type { ProductRecommendation } from "@/lib/recommendation-agent";

export type VisionEngine = "mock" | "grok-vision" | "google-vision";

export interface VisionLabel {
  label: string;
  confidence: number;
}

export interface VisionResult {
  /** Detected / inferred labels from the photo */
  labels: VisionLabel[];
  /** Friendly one-liner for the UI */
  summary: string;
  /** Similar marketplace products */
  picks: ProductRecommendation[];
  /** Product ids for local-store lookup */
  productIds: string[];
  /** Dominant category guess */
  categoryHint: string | null;
  sourceName: string;
  engine: VisionEngine;
  /** Overall match confidence 0–1 (top detection or model self-score) */
  confidence?: number;
  /** True when live Grok call failed and mock kicked in */
  fallback?: boolean;
  fallbackReason?: string;
}

export interface VisionAnalysisDraft {
  summary: string;
  categoryHint: string | null;
  labels: VisionLabel[];
  keywords: string[];
  suggestedProductIds: string[];
  matchScores?: number[];
  confidence?: number;
}
