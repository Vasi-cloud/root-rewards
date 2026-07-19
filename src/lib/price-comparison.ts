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

/** Demo competitor prices vs Forest Buddies (mock Amazon / Target / REI / Etsy / etc.). */
const COMPETITOR_PRICES: Record<string, CompetitorPrice[]> = {
  "1": [
    { store: "Amazon", price: 34 },
    { store: "Target", price: 32 },
    { store: "Etsy", price: 36 },
  ],
  "2": [
    { store: "Amazon", price: 22 },
    { store: "Target", price: 20 },
    { store: "Walmart", price: 19 },
  ],
  "3": [
    { store: "Amazon", price: 18 },
    { store: "Target", price: 17 },
    { store: "Walmart", price: 16 },
  ],
  "4": [
    { store: "Amazon", price: 79 },
    { store: "REI", price: 72 },
    { store: "Etsy", price: 84 },
  ],
  "5": [
    { store: "Amazon", price: 16 },
    { store: "Target", price: 14 },
    { store: "Etsy", price: 18 },
  ],
  "6": [
    { store: "Amazon", price: 18 },
    { store: "Etsy", price: 17 },
    { store: "Target", price: 19 },
  ],
  "7": [
    { store: "Amazon", price: 11 },
    { store: "Target", price: 10 },
    { store: "Etsy", price: 12 },
  ],
  "8": [
    { store: "Amazon", price: 42 },
    { store: "REI", price: 39 },
    { store: "Walmart", price: 44 },
  ],
  "9": [
    { store: "Amazon", price: 29 },
    { store: "Target", price: 27 },
    { store: "REI", price: 30 },
  ],
  "10": [
    { store: "Amazon", price: 19 },
    { store: "Target", price: 18 },
    { store: "Etsy", price: 20 },
  ],
  "11": [
    { store: "Amazon", price: 38 },
    { store: "REI", price: 42 },
    { store: "Etsy", price: 40 },
  ],
  "12": [
    { store: "Amazon", price: 34 },
    { store: "Target", price: 33 },
    { store: "Etsy", price: 36 },
  ],
  "13": [
    { store: "Amazon", price: 24 },
    { store: "Etsy", price: 22 },
    { store: "Target", price: 25 },
  ],
  "14": [
    { store: "Amazon", price: 48 },
    { store: "Target", price: 52 },
    { store: "Etsy", price: 55 },
  ],
  "15": [
    { store: "Amazon", price: 14 },
    { store: "Target", price: 13 },
    { store: "Etsy", price: 15 },
  ],
  "16": [
    { store: "Amazon", price: 18 },
    { store: "Walmart", price: 16 },
    { store: "Target", price: 17 },
  ],
  "17": [
    { store: "Amazon", price: 89 },
    { store: "REI", price: 95 },
    { store: "Etsy", price: 98 },
  ],
  "18": [
    { store: "Amazon", price: 35 },
    { store: "Target", price: 33 },
    { store: "Walmart", price: 32 },
  ],
};

export function getPriceComparison(product: Product): PriceComparison | null {
  const competitors = COMPETITOR_PRICES[product.id];
  if (!competitors?.length) return null;

  const lowestCompetitor = Math.min(...competitors.map((c) => c.price));
  const savings = Math.max(
    0,
    Math.round((lowestCompetitor - product.price) * 100) / 100
  );
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
