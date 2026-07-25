/**
 * Estimated delivery ranges for partner dropship (demo / illustrative).
 */

import type { PartCondition } from "@/lib/leafy-parts";
import type { CartItem, Product } from "@/types";

export type DeliveryEstimate = {
  minDays: number;
  maxDays: number;
  /** Short UI label, e.g. "Usually 1–3 days" */
  label: string;
  /** Extra context for cart / checkout */
  detail: string;
};

const PART_CONDITION_ESTIMATES: Record<PartCondition, DeliveryEstimate> = {
  recycled: {
    minDays: 1,
    maxDays: 3,
    label: "Usually 1–3 days",
    detail:
      "Recycled / used parts often ship from local or regional stock — partner dropship, typically 1–3 days.",
  },
  remanufactured: {
    minDays: 2,
    maxDays: 4,
    label: "Usually 2–4 days",
    detail:
      "Remanufactured parts ship from partner warehouses — dropship, typically 2–4 days.",
  },
  new: {
    minDays: 2,
    maxDays: 5,
    label: "Usually 2–5 days",
    detail:
      "New / OEM-spec parts ship from partner stock — dropship, typically 2–5 days.",
  },
};

const DEFAULT_ESTIMATE: DeliveryEstimate = {
  minDays: 1,
  maxDays: 3,
  label: "Usually 1–3 days",
  detail:
    "Eco partners fulfill by dropship — typically 1–3 days. Tracking arrives by email.",
};

export function deliveryEstimateForPartCondition(
  condition: PartCondition
): DeliveryEstimate {
  return PART_CONDITION_ESTIMATES[condition];
}

function parsePartsCondition(id: string): PartCondition | null {
  if (id.endsWith("-recycled")) return "recycled";
  if (id.endsWith("-remanufactured")) return "remanufactured";
  if (id.endsWith("-new")) return "new";
  return null;
}

export function deliveryEstimateForProduct(
  product: Pick<Product, "id" | "name" | "category" | "availabilityNote" | "rentalDuration">
): DeliveryEstimate {
  if (product.rentalDuration) {
    return {
      minDays: 1,
      maxDays: 2,
      label: "Usually 1–2 days",
      detail:
        "Rental items are prepared by eco partners — typically ready in 1–2 days.",
    };
  }

  const fromId = parsePartsCondition(product.id);
  if (fromId) return PART_CONDITION_ESTIMATES[fromId];

  const note = (product.availabilityNote ?? "").toLowerCase();
  const name = product.name.toLowerCase();
  if (
    note.includes("recycled") ||
    name.includes("recycled") ||
    name.includes("used")
  ) {
    return PART_CONDITION_ESTIMATES.recycled;
  }
  if (note.includes("remanufactured") || name.includes("remanufactured")) {
    return PART_CONDITION_ESTIMATES.remanufactured;
  }
  if (
    note.includes("oem") ||
    name.includes(" · new") ||
    note.includes("new /")
  ) {
    return PART_CONDITION_ESTIMATES.new;
  }

  if (product.id.startsWith("kitchen-") || product.category === "Kitchen") {
    return {
      minDays: 1,
      maxDays: 3,
      label: "Usually 1–3 days",
      detail:
        "Kitchen / pantry items ship via partner dropship — typically 1–3 days.",
    };
  }

  return DEFAULT_ESTIMATE;
}

export function deliveryEstimateForCart(
  items: CartItem[]
): DeliveryEstimate & { summary: string } {
  if (items.length === 0) {
    return {
      ...DEFAULT_ESTIMATE,
      summary: "Partner dropship · usually 1–3 days",
    };
  }

  const estimates = items.map(deliveryEstimateForProduct);
  const minDays = Math.min(...estimates.map((e) => e.minDays));
  const maxDays = Math.max(...estimates.map((e) => e.maxDays));
  const label = `Usually ${minDays}–${maxDays} day${maxDays === 1 ? "" : "s"}`;

  const uniqueRanges = new Set(estimates.map((e) => e.label));
  const mixed = uniqueRanges.size > 1;

  return {
    minDays,
    maxDays,
    label,
    detail: mixed
      ? `Partner dropship based on your basket — most items ${label.toLowerCase()}. Tracking arrives by email.`
      : `${estimates[0].detail} Tracking arrives by email.`,
    summary: mixed
      ? `Partner dropship · ${label.toLowerCase()} (mixed speeds in basket)`
      : `Partner dropship · ${label.toLowerCase()}`,
  };
}
