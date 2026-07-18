import type { Product } from "@/types";

export interface CompetitorPrice {
  store: string;
  price: number;
}

export interface PriceComparison {
  competitors: CompetitorPrice[];
  lowestCompetitor: number;
  savings: number;
  isBestDeal: boolean;
}

/** Demo competitor prices vs Forest Buddies (mock Amazon / Target / etc.). */
const COMPETITOR_PRICES: Record<string, CompetitorPrice[]> = {
  "1": [
    { store: "Amazon", price: 34 },
    { store: "Target", price: 32 },
  ],
  "2": [
    { store: "Amazon", price: 22 },
    { store: "Walmart", price: 19 },
  ],
  "3": [
    { store: "Amazon", price: 18 },
    { store: "Whole Foods", price: 16 },
  ],
  "4": [
    { store: "Amazon", price: 79 },
    { store: "REI", price: 72 },
  ],
  "5": [
    { store: "Amazon", price: 16 },
    { store: "Target", price: 14 },
  ],
  "6": [
    { store: "Amazon", price: 18 },
    { store: "Staples", price: 17 },
  ],
  "7": [
    { store: "Amazon", price: 11 },
    { store: "Sephora", price: 12 },
  ],
  "8": [
    { store: "Amazon", price: 42 },
    { store: "REI", price: 39 },
  ],
  "9": [
    { store: "Amazon", price: 29 },
    { store: "Target", price: 27 },
  ],
  "10": [
    { store: "Amazon", price: 19 },
    { store: "Target", price: 18 },
  ],
  "11": [
    { store: "Amazon", price: 38 },
    { store: "Patagonia", price: 45 },
  ],
  "12": [
    { store: "Amazon", price: 34 },
    { store: "Anthropologie", price: 36 },
  ],
  "13": [
    { store: "Amazon", price: 24 },
    { store: "Etsy", price: 22 },
  ],
  "14": [
    { store: "Amazon", price: 48 },
    { store: "Williams Sonoma", price: 55 },
  ],
  "15": [
    { store: "Amazon", price: 14 },
    { store: "Target", price: 13 },
  ],
  "16": [
    { store: "Amazon", price: 18 },
    { store: "Walmart", price: 16 },
  ],
  "17": [
    { store: "Amazon", price: 89 },
    { store: "REI", price: 95 },
  ],
  "18": [
    { store: "Amazon", price: 35 },
    { store: "IKEA", price: 32 },
  ],
};

export function getPriceComparison(product: Product): PriceComparison | null {
  const competitors = COMPETITOR_PRICES[product.id];
  if (!competitors?.length) return null;

  const lowestCompetitor = Math.min(...competitors.map((c) => c.price));
  const savings = Math.max(0, Math.round((lowestCompetitor - product.price) * 100) / 100);
  const isBestDeal = product.price < lowestCompetitor;

  return {
    competitors,
    lowestCompetitor,
    savings,
    isBestDeal,
  };
}

export function isBestDealProduct(product: Product): boolean {
  return getPriceComparison(product)?.isBestDeal ?? false;
}
