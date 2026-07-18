import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-catalog";
import type { ProductRecommendation } from "@/lib/recommendation-agent";
import type { Product } from "@/types";

/**
 * Mock vision agent — classify an uploaded photo and recommend similar products.
 * Keep VisionResult stable for a future Grok Vision / Google Vision swap.
 */

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
}

type Cue = {
  /** Tokens matched against filename + optional note */
  tokens: string[];
  labels: string[];
  productIds: string[];
  category: string;
};

const VISION_CUES: Cue[] = [
  {
    tokens: ["tote", "bag", "market", "canvas", "shopping"],
    labels: ["tote bag", "canvas", "accessories"],
    productIds: ["1", "4"],
    category: "Accessories",
  },
  {
    tokens: ["cutlery", "utensil", "fork", "spoon", "chopsticks", "bamboo"],
    labels: ["utensils", "bamboo", "kitchen"],
    productIds: ["2"],
    category: "Kitchen",
  },
  {
    tokens: ["cleaner", "spray", "glass", "refill", "cleaning"],
    labels: ["cleaner bottle", "home care"],
    productIds: ["3"],
    category: "Home",
  },
  {
    tokens: ["backpack", "rucksack", "pack", "schoolbag"],
    labels: ["backpack", "hemp canvas"],
    productIds: ["4", "17"],
    category: "Apparel",
  },
  {
    tokens: ["wrap", "beeswax", "cheese", "foodwrap"],
    labels: ["food wrap", "beeswax"],
    productIds: ["5"],
    category: "Kitchen",
  },
  {
    tokens: ["notebook", "journal", "paper", "stationery", "sketch"],
    labels: ["notebook", "stationery"],
    productIds: ["6", "13"],
    category: "Stationery",
  },
  {
    tokens: ["balm", "lip", "tin", "chapstick"],
    labels: ["lip balm", "beauty tin"],
    productIds: ["7", "15"],
    category: "Beauty",
  },
  {
    tokens: ["lantern", "solar", "lamp", "light", "camping"],
    labels: ["lantern", "solar gear"],
    productIds: ["8", "17"],
    category: "Home",
  },
  {
    tokens: ["bottle", "flask", "water", "drink", "thermos"],
    labels: ["water bottle", "insulated"],
    productIds: ["9", "1"],
    category: "Kitchen",
  },
  {
    tokens: ["toothbrush", "brush", "dental", "teeth"],
    labels: ["toothbrush", "bamboo"],
    productIds: ["10", "15"],
    category: "Beauty",
  },
  {
    tokens: ["shirt", "tee", "tshirt", "t-shirt", "hemp", "apparel"],
    labels: ["t-shirt", "apparel"],
    productIds: ["11", "17"],
    category: "Apparel",
  },
  {
    tokens: ["candle", "wax", "soy", "scent"],
    labels: ["candle", "home fragrance"],
    productIds: ["12"],
    category: "Home",
  },
  {
    tokens: ["card", "greeting", "seed", "postcard", "envelope"],
    labels: ["greeting card", "seed paper"],
    productIds: ["13", "6"],
    category: "Stationery",
  },
  {
    tokens: ["skillet", "pan", "cast", "iron", "cookware"],
    labels: ["cast iron", "cookware"],
    productIds: ["14", "2"],
    category: "Kitchen",
  },
  {
    tokens: ["round", "pad", "cotton", "facial", "makeup"],
    labels: ["cotton rounds", "beauty"],
    productIds: ["15", "7"],
    category: "Beauty",
  },
  {
    tokens: ["dryer", "wool", "laundry", "ball"],
    labels: ["dryer balls", "laundry"],
    productIds: ["16", "3"],
    category: "Home",
  },
  {
    tokens: ["jacket", "rain", "coat", "shell", "waterproof"],
    labels: ["rain jacket", "outerwear"],
    productIds: ["17", "4"],
    category: "Apparel",
  },
  {
    tokens: ["jar", "storage", "glassware", "container", "pantry"],
    labels: ["storage jars", "glass"],
    productIds: ["18", "5"],
    category: "Kitchen",
  },
  {
    tokens: ["kitchen", "cooking", "dish", "food"],
    labels: ["kitchenware"],
    productIds: ["2", "5", "9", "14", "18"],
    category: "Kitchen",
  },
  {
    tokens: ["eco", "green", "sustainable", "organic", "reuse"],
    labels: ["eco product"],
    productIds: ["1", "9", "11", "5"],
    category: "Accessories",
  },
];

const FALLBACK_IDS = ["1", "9", "11", "5", "2"];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function pickCueScores(haystack: string): { cue: Cue; hits: number }[] {
  const tokens = new Set(tokenize(haystack));
  const scored: { cue: Cue; hits: number }[] = [];
  for (const cue of VISION_CUES) {
    let hits = 0;
    for (const t of cue.tokens) {
      if (tokens.has(t) || haystack.toLowerCase().includes(t)) hits += 1;
    }
    if (hits > 0) scored.push({ cue, hits });
  }
  return scored.sort((a, b) => b.hits - a.hits);
}

function productsByIds(ids: string[]): Product[] {
  const map = new Map(MARKETPLACE_PRODUCTS.map((p) => [p.id, p]));
  const out: Product[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p && !out.some((x) => x.id === p.id)) out.push(p);
  }
  return out;
}

function buildLabels(
  cues: { cue: Cue; hits: number }[],
  categoryHint: string | null
): VisionLabel[] {
  const labels: VisionLabel[] = [];
  for (const { cue, hits } of cues.slice(0, 3)) {
    for (const label of cue.labels.slice(0, 2)) {
      if (labels.some((l) => l.label === label)) continue;
      labels.push({
        label,
        confidence: Math.min(0.96, 0.55 + hits * 0.12 + labels.length * 0.02),
      });
    }
  }
  if (categoryHint && !labels.some((l) => l.label === categoryHint.toLowerCase())) {
    labels.push({ label: categoryHint.toLowerCase(), confidence: 0.62 });
  }
  if (labels.length === 0) {
    return [
      { label: "everyday eco goods", confidence: 0.48 },
      { label: "reusable product", confidence: 0.42 },
    ];
  }
  return labels.slice(0, 5);
}

function craftVisionPicks(
  products: Product[],
  labels: VisionLabel[],
  categoryHint: string | null
): ProductRecommendation[] {
  const labelText = labels.map((l) => l.label).join(" ");
  return products.map((product, i) => {
    const sameCat = categoryHint && product.category === categoryHint;
    const visualSimilarity = Math.max(
      52,
      Math.round(92 - i * 8 + (sameCat ? 6 : 0))
    );
    const tags = ["vision match", ...(sameCat ? [categoryHint.toLowerCase()] : [])];
    if (product.sustainabilityScore >= 90) tags.push("eco standout");
    return {
      product,
      score: visualSimilarity,
      reason: `Looks similar to your photo (${visualSimilarity}% visual match${
        sameCat ? ` · ${categoryHint}` : ""
      }). Detected: ${labelText || "eco everyday"}.`,
      matchTags: [...new Set(tags)],
    } satisfies ProductRecommendation;
  });
}

/**
 * Classify a photo using filename + optional note (mock CV).
 * Pass `file` from an `<input type="file">` — only name/size are used today.
 */
export function classifyPhotoMock(input: {
  fileName: string;
  fileSize?: number;
  /** Optional typed hint from the shopper */
  note?: string;
  limit?: number;
}): VisionResult {
  const haystack = `${input.fileName} ${input.note ?? ""}`.trim();
  const cueScores = pickCueScores(haystack);
  const limit = input.limit ?? 4;

  let productIds: string[] = [];
  let categoryHint: string | null = null;

  if (cueScores.length > 0) {
    categoryHint = cueScores[0].cue.category;
    for (const { cue } of cueScores) {
      for (const id of cue.productIds) {
        if (!productIds.includes(id)) productIds.push(id);
      }
    }
  } else {
    // Deterministic fallback from filename length so demos feel consistent
    const seed = (input.fileName.length + (input.fileSize ?? 0)) % FALLBACK_IDS.length;
    productIds = [
      ...FALLBACK_IDS.slice(seed),
      ...FALLBACK_IDS.slice(0, seed),
    ];
    categoryHint = "Accessories";
  }

  productIds = productIds.slice(0, Math.max(limit, 4));
  const products = productsByIds(productIds).slice(0, limit);
  const labels = buildLabels(cueScores, categoryHint);
  const topLabel = labels[0]?.label ?? "eco product";

  const summary =
    cueScores.length > 0
      ? `I spotted something like “${topLabel}” in your photo. Here are similar Forest Buddies finds.`
      : `Couldn’t read a clear object name from the file — here are close eco matches while vision is still mock. Try a filename like bottle.jpg or tote.png.`;

  return {
    labels,
    summary,
    picks: craftVisionPicks(products, labels, categoryHint),
    productIds: products.map((p) => p.id),
    categoryHint,
    sourceName: input.fileName,
    engine: "mock",
  };
}

export async function classifyPhotoMockAsync(
  input: {
    fileName: string;
    fileSize?: number;
    note?: string;
    limit?: number;
  },
  delayMs = 900
): Promise<VisionResult> {
  await new Promise((r) => setTimeout(r, delayMs));
  return classifyPhotoMock(input);
}

/** Demo filenames that trigger strong mock matches (for chips / hints). */
export const VISION_DEMO_HINTS = [
  { label: "Water bottle", fileName: "reusable-water-bottle.jpg" },
  { label: "Tote bag", fileName: "organic-cotton-tote.png" },
  { label: "Rain jacket", fileName: "recycled-rain-jacket.jpg" },
  { label: "Kitchen wraps", fileName: "beeswax-food-wraps.jpg" },
  { label: "Hemp tee", fileName: "organic-hemp-tshirt.jpg" },
];
