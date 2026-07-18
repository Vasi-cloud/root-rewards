import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-catalog";
import type { Product } from "@/types";

export interface RecommendInput {
  /** Free-text occasion / vibe, e.g. "gift for birthday" */
  query: string;
  /** Soft budget ceiling in USD (0 = no limit) */
  budget?: number;
  /** How many picks to return */
  limit?: number;
}

export interface ProductRecommendation {
  product: Product;
  score: number;
  /** Short, friendly why-this-pick copy */
  reason: string;
  /** Match tags for UI chips */
  matchTags: string[];
}

export interface RecommendResult {
  picks: ProductRecommendation[];
  /** Agent narration */
  message: string;
  parsed: {
    budget: number | null;
    themes: string[];
    isGift: boolean;
  };
  /** Swap this flag when wiring Grok later */
  engine: "mock" | "grok";
}

type Theme = {
  id: string;
  labels: string[];
  categories: string[];
  keywords: string[];
  giftBoost?: boolean;
};

const THEMES: Theme[] = [
  {
    id: "kitchen",
    labels: ["kitchen", "cooking", "chef", "food", "zero-waste kitchen", "pantry"],
    categories: ["Kitchen"],
    keywords: [
      "cutlery",
      "wrap",
      "bottle",
      "jar",
      "skillet",
      "sponge",
      "dishwasher",
      "cook",
    ],
  },
  {
    id: "home",
    labels: ["home", "housewarming", "apartment", "clean", "laundry", "candle"],
    categories: ["Home"],
    keywords: ["cleaner", "lantern", "candle", "dryer", "home"],
  },
  {
    id: "beauty",
    labels: ["beauty", "self-care", "spa", "skincare", "wellness"],
    categories: ["Beauty"],
    keywords: ["balm", "toothbrush", "cotton", "beauty", "lip"],
  },
  {
    id: "gift",
    labels: [
      "gift",
      "present",
      "birthday",
      "anniversary",
      "thank you",
      "hostess",
      "stocking",
    ],
    categories: ["Stationery", "Beauty", "Accessories", "Home"],
    keywords: ["card", "candle", "tote", "balm", "wrap", "notebook"],
    giftBoost: true,
  },
  {
    id: "outdoors",
    labels: ["camping", "outdoors", "hike", "travel", "adventure", "picnic"],
    categories: ["Home", "Accessories", "Apparel", "Kitchen"],
    keywords: ["lantern", "backpack", "bottle", "cutlery", "jacket", "solar"],
  },
  {
    id: "office",
    labels: ["office", "desk", "work", "student", "school"],
    categories: ["Stationery", "Accessories"],
    keywords: ["notebook", "tote", "card", "paper"],
  },
  {
    id: "apparel",
    labels: ["clothes", "wear", "fashion", "outfit", "jacket", "shirt"],
    categories: ["Apparel"],
    keywords: ["shirt", "jacket", "backpack", "hemp", "cotton"],
  },
];

const FUN_OPENERS = [
  "Leafy brain engaged — here's what I'd put in your basket:",
  "I sniffed the forest catalog so you don't have to. Top picks:",
  "Budget-friendly, planet-kind, and a little delightful:",
  "Your eco stylist reporting for duty:",
];

function extractBudget(text: string, explicit?: number): number | null {
  if (explicit && explicit > 0) return explicit;
  const under = text.match(
    /(?:under|below|max|less than|up to|budget(?:\s+of)?)\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  if (under) return Number(under[1]);
  const dollar = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollar) return Number(dollar[1]);
  return null;
}

function detectThemes(query: string): Theme[] {
  const q = query.toLowerCase();
  return THEMES.filter(
    (t) =>
      t.labels.some((l) => q.includes(l)) ||
      t.keywords.some((k) => q.includes(k))
  );
}

function scoreProduct(
  product: Product,
  query: string,
  themes: Theme[],
  budget: number | null,
  isGift: boolean
): { score: number; tags: string[]; reasonBits: string[] } {
  const q = query.toLowerCase();
  const hay = `${product.name} ${product.description} ${product.category}`.toLowerCase();
  let score = product.sustainabilityScore / 10; // 8–9.9 base from eco
  const tags: string[] = [];
  const reasonBits: string[] = [];

  // Keyword overlap
  const words = q
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !["for", "the", "and", "under", "with"].includes(w));
  let hits = 0;
  for (const w of words) {
    if (hay.includes(w)) hits += 1;
  }
  score += hits * 4;
  if (hits > 0) {
    tags.push("keyword match");
    reasonBits.push("matches what you described");
  }

  // Theme / category
  for (const theme of themes) {
    if (theme.categories.includes(product.category)) {
      score += 12;
      tags.push(theme.id);
      reasonBits.push(`fits your ${theme.id} vibe`);
    }
    for (const kw of theme.keywords) {
      if (hay.includes(kw)) score += 3;
    }
  }

  if (isGift && product.price <= 40 && product.sustainabilityScore >= 88) {
    score += 8;
    tags.push("gift-ready");
    reasonBits.push("wraps up beautifully as a gift");
  }

  // Budget fit
  if (budget != null) {
    if (product.price <= budget) {
      const headroom = (budget - product.price) / budget;
      score += 6 + headroom * 6;
      tags.push("in budget");
      reasonBits.push(`comfortably under $${budget}`);
    } else {
      score -= 40;
    }
  }

  // Prefer high eco
  if (product.sustainabilityScore >= 95) {
    score += 5;
    tags.push("eco standout");
    reasonBits.push(`${product.sustainabilityScore}% eco score`);
  } else if (product.sustainabilityScore >= 90) {
    score += 2;
  }

  return { score, tags: [...new Set(tags)], reasonBits };
}

function craftReason(product: Product, bits: string[]): string {
  const unique = [...new Set(bits)].slice(0, 2);
  if (unique.length === 0) {
    return `${product.name} is a solid eco pick at $${product.price}.`;
  }
  return `${unique.join(" · ")}.`;
}

function craftMessage(
  picks: ProductRecommendation[],
  parsed: RecommendResult["parsed"],
  query: string
): string {
  const opener = FUN_OPENERS[Math.floor(Math.random() * FUN_OPENERS.length)];
  if (picks.length === 0) {
    return parsed.budget
      ? `Hmm — nothing clear under $${parsed.budget} for “${query}”. Try raising the budget or widening the occasion.`
      : `I couldn't find a strong match for “${query}”. Try “eco kitchen under $50” or “birthday gift”.`;
  }
  const total = picks.reduce((s, p) => s + p.product.price, 0);
  const budgetNote =
    parsed.budget != null
      ? ` Combined ≈ $${total.toFixed(0)} of your $${parsed.budget} budget.`
      : ` Combined ≈ $${total.toFixed(0)}.`;
  return `${opener}${budgetNote}`;
}

/**
 * Mock recommendation agent. Replace body with Grok API later;
 * keep RecommendInput / RecommendResult stable.
 */
export function recommendProducts(input: RecommendInput): RecommendResult {
  const query = input.query.trim() || "eco favorites";
  const budget = extractBudget(query, input.budget);
  const themes = detectThemes(query);
  const isGift =
    /\bgift|present|birthday|anniversary|thank you\b/i.test(query) ||
    themes.some((t) => t.giftBoost);

  const scored = MARKETPLACE_PRODUCTS.map((product) => {
    const { score, tags, reasonBits } = scoreProduct(
      product,
      query,
      themes,
      budget,
      isGift
    );
    return {
      product,
      score,
      reason: craftReason(product, reasonBits),
      matchTags: tags,
    } satisfies ProductRecommendation;
  })
    .filter((r) => (budget != null ? r.product.price <= budget : true))
    .sort((a, b) => b.score - a.score);

  const limit = input.limit ?? 4;
  const picks = scored.slice(0, limit).filter((p) => p.score > 5);

  // If too strict, relax to top eco under budget
  const finalPicks =
    picks.length > 0
      ? picks
      : MARKETPLACE_PRODUCTS.filter((p) =>
          budget != null ? p.price <= budget : true
        )
          .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
          .slice(0, limit)
          .map((product) => ({
            product,
            score: product.sustainabilityScore,
            reason: "High eco score fallback while I learn your vibe.",
            matchTags: ["eco standout"],
          }));

  const parsed = {
    budget,
    themes: themes.map((t) => t.id),
    isGift,
  };

  return {
    picks: finalPicks,
    message: craftMessage(finalPicks, parsed, query),
    parsed,
    engine: "mock",
  };
}

/** Simulated thinking delay for the UI. */
export async function recommendProductsAsync(
  input: RecommendInput,
  delayMs = 700
): Promise<RecommendResult> {
  await new Promise((r) => setTimeout(r, delayMs));
  return recommendProducts(input);
}

export const SUGGESTED_PROMPTS = [
  { label: "Birthday gift under $30", query: "gift for birthday", budget: 30 },
  { label: "Eco kitchen under $50", query: "eco kitchen under $50", budget: 50 },
  { label: "Housewarming vibes", query: "housewarming home gift", budget: 40 },
  { label: "Camping weekend", query: "camping outdoors adventure", budget: 80 },
  { label: "Self-care set", query: "beauty self-care spa", budget: 35 },
];
