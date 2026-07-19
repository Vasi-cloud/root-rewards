import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-catalog";
import type { ProductRecommendation } from "@/lib/recommendation-agent";
import type { VisionLabel } from "@/lib/vision/types";
import type { Product } from "@/types";

export type CatalogSlice = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  ecoScore: number;
};

/** Compact catalog for the vision model (keeps prompts lean). */
export function catalogForVisionPrompt(limit = 40): CatalogSlice[] {
  return MARKETPLACE_PRODUCTS.filter((p) => p.listingType !== "service")
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description.slice(0, 120),
      price: p.price,
      ecoScore: p.sustainabilityScore,
    }));
}

export function productsByIds(ids: string[]): Product[] {
  const map = new Map(MARKETPLACE_PRODUCTS.map((p) => [p.id, p]));
  const out: Product[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p && !out.some((x) => x.id === p.id)) out.push(p);
  }
  return out;
}

/** Keyword / category fallback when Grok doesn't return valid IDs. */
export function matchProductsByKeywords(
  keywords: string[],
  categoryHint: string | null,
  limit: number
): Product[] {
  const tokens = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 1);
  const scored = MARKETPLACE_PRODUCTS.filter(
    (p) => p.listingType !== "service"
  ).map((p) => {
    const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += t.length > 4 ? 3 : 2;
    }
    if (categoryHint && p.category === categoryHint) score += 4;
    if (p.sustainabilityScore >= 90) score += 1;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score || b.p.sustainabilityScore - a.p.sustainabilityScore);
  const hits = scored.filter((s) => s.score > 0).map((s) => s.p);
  if (hits.length >= limit) return hits.slice(0, limit);
  const fillers = scored
    .filter((s) => !hits.some((h) => h.id === s.p.id))
    .map((s) => s.p);
  return [...hits, ...fillers].slice(0, limit);
}

export function craftVisionPicks(
  products: Product[],
  labels: VisionLabel[],
  categoryHint: string | null,
  matchScores?: number[]
): ProductRecommendation[] {
  const labelText = labels.map((l) => l.label).join(", ");
  return products.map((product, i) => {
    const sameCat = categoryHint && product.category === categoryHint;
    const visualSimilarity = Math.max(
      48,
      Math.min(
        98,
        matchScores?.[i] ??
          Math.round(94 - i * 7 + (sameCat ? 5 : 0) + (labels[0]?.confidence ?? 0.5) * 8)
      )
    );
    const tags = ["vision match", ...(sameCat ? [categoryHint.toLowerCase()] : [])];
    if (product.sustainabilityScore >= 90) tags.push("eco standout");
    return {
      product,
      score: visualSimilarity,
      reason: `Leafy sees a ~${visualSimilarity}% visual kinship${
        sameCat ? ` in ${categoryHint}` : ""
      }. Spotted: ${labelText || "eco everyday goods"}.`,
      matchTags: [...new Set(tags)],
    } satisfies ProductRecommendation;
  });
}
