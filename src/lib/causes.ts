export type CauseId =
  | "trees"
  | "ocean"
  | "animals"
  | "education"
  | "climate";

export interface Cause {
  id: CauseId;
  name: string;
  tagline: string;
  /** Unit label for quantity, e.g. "tree", "reef clean" */
  unitSingular: string;
  unitPlural: string;
  unitPrice: number;
  /** Approximate kg CO₂ equivalent impact per unit (demo) */
  co2PerUnit: number;
  /** Accent for eco UI */
  accentClass: string;
  /** Lucide icon name key used by UI */
  icon: "trees" | "waves" | "paw" | "book" | "sun";
}

export const CAUSES: Cause[] = [
  {
    id: "trees",
    name: "Trees",
    tagline: "Plant forests that clean the air we share.",
    unitSingular: "tree",
    unitPlural: "trees",
    unitPrice: 5,
    co2PerUnit: 22,
    accentClass: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
    icon: "trees",
  },
  {
    id: "ocean",
    name: "Ocean",
    tagline: "Fund cleanups that protect reefs and coasts.",
    unitSingular: "cleanup kit",
    unitPlural: "cleanup kits",
    unitPrice: 4,
    co2PerUnit: 8,
    accentClass: "bg-sky-50/80 border-sky-200 text-sky-900",
    icon: "waves",
  },
  {
    id: "animals",
    name: "Animals",
    tagline: "Support habitats for wildlife at risk.",
    unitSingular: "habitat day",
    unitPlural: "habitat days",
    unitPrice: 6,
    co2PerUnit: 5,
    accentClass: "bg-amber-50/70 border-amber-200 text-amber-950",
    icon: "paw",
  },
  {
    id: "education",
    name: "Education",
    tagline: "Teach kids how to care for the planet.",
    unitSingular: "lesson pack",
    unitPlural: "lesson packs",
    unitPrice: 3,
    co2PerUnit: 3,
    accentClass: "bg-violet-50/70 border-violet-200 text-violet-950",
    icon: "book",
  },
  {
    id: "climate",
    name: "Climate",
    tagline: "Accelerate clean energy for communities.",
    unitSingular: "kWh funded",
    unitPlural: "kWh funded",
    unitPrice: 3,
    co2PerUnit: 12,
    accentClass: "bg-lime-50/80 border-lime-200 text-lime-950",
    icon: "sun",
  },
];

export function getCause(id: CauseId | string): Cause | undefined {
  return CAUSES.find((c) => c.id === id);
}

export function formatCauseUnits(cause: Cause, units: number): string {
  if (units === 1) return `1 ${cause.unitSingular}`;
  return `${units} ${cause.unitPlural}`;
}

export type CauseSelection = Record<CauseId, number>;

/** GBP gift amounts per cause (0 = not selected). Used for cart / donate charging. */
export type CauseGiftAmounts = Record<CauseId, number>;

/** Quick picks for Support a cause / cart gifts */
export const CAUSE_GIFT_PRESETS = [5, 10, 25] as const;
export const CAUSE_GIFT_MIN_GBP = 1;

export function emptyCauseSelection(): CauseSelection {
  return {
    trees: 0,
    ocean: 0,
    animals: 0,
    education: 0,
    climate: 0,
  };
}

export function emptyCauseGifts(): CauseGiftAmounts {
  return emptyCauseSelection();
}

export function selectionCost(selection: CauseSelection): number {
  return CAUSES.reduce(
    (sum, cause) => sum + (selection[cause.id] || 0) * cause.unitPrice,
    0
  );
}

/** Sum of exact £ gifts (cart / donate money UX). */
export function giftTotal(gifts: CauseGiftAmounts): number {
  return CAUSES.reduce((sum, cause) => {
    const n = Number(gifts[cause.id]) || 0;
    return sum + (n > 0 ? n : 0);
  }, 0);
}

export function giftSelectedCount(gifts: CauseGiftAmounts): number {
  return CAUSES.filter((c) => (Number(gifts[c.id]) || 0) >= CAUSE_GIFT_MIN_GBP)
    .length;
}

/** Convert a GBP donation into whole units for a cause (floor). */
export function dollarsToUnits(cause: Cause, dollars: number): number {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.floor(dollars / cause.unitPrice);
}

export function unitsToDollars(cause: Cause, units: number): number {
  return Math.max(0, units) * cause.unitPrice;
}

export function giftLines(gifts: CauseGiftAmounts) {
  return CAUSES.filter(
    (c) => (Number(gifts[c.id]) || 0) >= CAUSE_GIFT_MIN_GBP
  ).map((cause) => {
    const amount = Number(gifts[cause.id]) || 0;
    const units = dollarsToUnits(cause, amount);
    return {
      cause,
      amount,
      units,
      co2: units * cause.co2PerUnit,
    };
  });
}

/** Map £ gifts → illustrative unit counts for impact storage / copy. */
export function giftsToIllustrativeUnits(
  gifts: CauseGiftAmounts
): CauseSelection {
  const next = emptyCauseSelection();
  for (const cause of CAUSES) {
    const amount = Number(gifts[cause.id]) || 0;
    if (amount >= CAUSE_GIFT_MIN_GBP) {
      next[cause.id] = Math.max(1, dollarsToUnits(cause, amount));
    }
  }
  return next;
}

export function clampCauseGiftGbp(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const rounded = Math.round(raw * 100) / 100;
  if (rounded > 0 && rounded < CAUSE_GIFT_MIN_GBP) return 0;
  return Math.min(10_000, rounded);
}

export function selectionCo2(selection: CauseSelection): number {
  return CAUSES.reduce(
    (sum, cause) => sum + (selection[cause.id] || 0) * cause.co2PerUnit,
    0
  );
}

export function selectionTotalUnits(selection: CauseSelection): number {
  return CAUSES.reduce((sum, cause) => sum + (selection[cause.id] || 0), 0);
}

export function selectionLines(selection: CauseSelection) {
  return CAUSES.filter((c) => (selection[c.id] || 0) > 0).map((cause) => ({
    cause,
    units: selection[cause.id],
    cost: selection[cause.id] * cause.unitPrice,
    co2: selection[cause.id] * cause.co2PerUnit,
  }));
}

const IMPACT_VERBS: Record<CauseId, string> = {
  trees: "plants",
  ocean: "funds",
  animals: "supports",
  education: "funds",
  climate: "powers",
};

/**
 * Live checkout copy, e.g.
 * "£15 plants 3 trees"
 * "£15 plants 2 trees and funds 2 cleanup kits"
 */
export function formatLiveImpactSummary(selection: CauseSelection): string | null {
  const lines = selectionLines(selection);
  if (lines.length === 0) return null;

  const total = selectionCost(selection);
  const money = `£${total % 1 === 0 ? total.toFixed(0) : total.toFixed(2)}`;

  const phrases = lines.map(({ cause, units }) => {
    const verb = IMPACT_VERBS[cause.id];
    const unitText = formatCauseUnits(cause, units);
    return `${verb} ${unitText}`;
  });

  let impactPhrase: string;
  if (phrases.length === 1) {
    impactPhrase = phrases[0];
  } else if (phrases.length === 2) {
    impactPhrase = `${phrases[0]} and ${phrases[1]}`;
  } else {
    impactPhrase = `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
  }

  return `${money} ${impactPhrase}`;
}

/** Honest gift summary from exact £ amounts. */
export function formatGiftImpactSummary(gifts: CauseGiftAmounts): string | null {
  return formatLiveImpactSummary(giftsToIllustrativeUnits(gifts));
}

const CART_GIFTS_KEY = "forest-buddies-cart-cause-gifts";

export function saveCartCauseGifts(gifts: CauseGiftAmounts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_GIFTS_KEY, JSON.stringify(gifts));
  } catch {
    /* ignore */
  }
}

export function loadCartCauseGifts(): CauseGiftAmounts {
  if (typeof window === "undefined") return emptyCauseGifts();
  try {
    const raw = localStorage.getItem(CART_GIFTS_KEY);
    if (!raw) return emptyCauseGifts();
    return parseCauseGifts(JSON.parse(raw));
  } catch {
    return emptyCauseGifts();
  }
}

export function parseCauseGifts(raw: unknown): CauseGiftAmounts {
  const base = emptyCauseGifts();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const cause of CAUSES) {
    base[cause.id] = clampCauseGiftGbp(Number(obj[cause.id]) || 0);
  }
  return base;
}
