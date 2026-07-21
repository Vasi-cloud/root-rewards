import { CAUSES } from "@/lib/causes";

const TREE_CAUSE = CAUSES.find((c) => c.id === "trees") ?? CAUSES[0];

/** Rough tree estimate from cart subtotal (checkout still lets shoppers choose). */
export function estimateTreesFromSubtotal(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.max(1, Math.floor(subtotal / TREE_CAUSE.unitPrice));
}

export function estimateCo2FromTrees(trees: number): number {
  return Math.round(trees * TREE_CAUSE.co2PerUnit);
}

export function formatCartMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function treeUnitPrice(): number {
  return TREE_CAUSE.unitPrice;
}
