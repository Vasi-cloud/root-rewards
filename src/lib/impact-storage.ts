/**
 * Personal impact ledger (localStorage) — causes, eco purchases, light activity.
 * Honest estimates when derived; never overclaims live LCA.
 */

import {
  CAUSES,
  type CauseId,
  type CauseSelection,
  emptyCauseSelection,
  getCause,
  selectionCo2,
  selectionCost,
  selectionTotalUnits,
} from "@/lib/causes";
import { recordAdminCauseContribution } from "@/lib/admin-causes-ledger";
import { loadKitchenHistory } from "@/lib/leafy-kitchen-history";

const IMPACT_KEY = "forest-buddies-impact";
const LAST_DONATION_KEY = "forest-buddies-last-donation";
const ACTIVITY_KEY = "forest-buddies-impact-activity";
const EVENT = "forest-buddies-impact-updated";

export interface CauseImpact {
  units: number;
  cost: number;
}

export interface UserImpact {
  byCause: Record<CauseId, CauseImpact>;
  /** Completed eco checkouts / purchases that contributed */
  ecoPurchases: number;
  /** Cart add / update actions (lightweight engagement signal) */
  cartActions: number;
  updatedAt: string;
}

export interface LastDonation {
  selection: CauseSelection;
  totalCost: number;
  totalCo2: number;
  createdAt: string;
}

export type ImpactActivityKind =
  | "cause"
  | "purchase"
  | "cart"
  | "kitchen"
  | "estimate";

export type ImpactActivity = {
  id: string;
  kind: ImpactActivityKind;
  title: string;
  detail: string;
  at: string;
  co2Kg?: number;
};

export type PersonalImpactSummary = {
  treesEquivalent: number;
  co2Kg: number;
  byCause: Array<{
    id: CauseId;
    name: string;
    units: number;
    cost: number;
    co2Kg: number;
  }>;
  ecoPurchases: number;
  cartActions: number;
  recent: ImpactActivity[];
  /** True when some figures include soft estimates */
  isEstimated: boolean;
  hasActivity: boolean;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeUserImpact(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function emptyImpact(): UserImpact {
  return {
    byCause: {
      trees: { units: 0, cost: 0 },
      ocean: { units: 0, cost: 0 },
      animals: { units: 0, cost: 0 },
      education: { units: 0, cost: 0 },
      climate: { units: 0, cost: 0 },
    },
    ecoPurchases: 0,
    cartActions: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserImpact(): UserImpact {
  if (typeof window === "undefined") return emptyImpact();
  try {
    const raw = localStorage.getItem(IMPACT_KEY);
    if (!raw) return emptyImpact();
    const parsed = JSON.parse(raw) as Partial<UserImpact>;
    const base = emptyImpact();
    for (const cause of CAUSES) {
      const row = parsed.byCause?.[cause.id];
      if (row) {
        base.byCause[cause.id] = {
          units: Number(row.units) || 0,
          cost: Number(row.cost) || 0,
        };
      }
    }
    base.ecoPurchases = Math.max(0, Math.floor(Number(parsed.ecoPurchases) || 0));
    base.cartActions = Math.max(0, Math.floor(Number(parsed.cartActions) || 0));
    base.updatedAt = parsed.updatedAt || base.updatedAt;
    return base;
  } catch {
    return emptyImpact();
  }
}

export function saveUserImpact(impact: UserImpact) {
  try {
    localStorage.setItem(IMPACT_KEY, JSON.stringify(impact));
    emit();
  } catch {
    // ignore
  }
}

function loadActivity(): ImpactActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a): a is ImpactActivity => {
        if (!a || typeof a !== "object") return false;
        const item = a as Partial<ImpactActivity>;
        return (
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.detail === "string" &&
          typeof item.at === "string" &&
          typeof item.kind === "string"
        );
      })
      .slice(0, 24);
  } catch {
    return [];
  }
}

function saveActivity(items: ImpactActivity[]) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items.slice(0, 24)));
    emit();
  } catch {
    // ignore
  }
}

export function pushImpactActivity(
  entry: Omit<ImpactActivity, "id" | "at"> & { at?: string }
) {
  const items = loadActivity();
  const next: ImpactActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    co2Kg: entry.co2Kg,
  };
  saveActivity([next, ...items]);
  return next;
}

/** Persist a checkout donation into lifetime impact totals. */
export function recordDonation(selection: CauseSelection): UserImpact {
  const impact = loadUserImpact();
  let addedUnits = 0;
  let addedCo2 = 0;
  const funded: string[] = [];
  for (const cause of CAUSES) {
    const units = selection[cause.id] || 0;
    if (units <= 0) continue;
    impact.byCause[cause.id].units += units;
    impact.byCause[cause.id].cost += units * cause.unitPrice;
    addedUnits += units;
    addedCo2 += units * cause.co2PerUnit;
    funded.push(cause.name);
  }
  impact.updatedAt = new Date().toISOString();
  saveUserImpact(impact);
  if (addedUnits > 0) {
    pushImpactActivity({
      kind: "cause",
      title: "Cause contribution",
      detail: `Funded ${funded.join(", ")} · ${addedUnits} unit${addedUnits === 1 ? "" : "s"}`,
      co2Kg: Math.round(addedCo2),
    });
  }
  return impact;
}

/** Record a completed eco marketplace purchase (checkout). */
export function recordEcoPurchase(input?: {
  itemCount?: number;
  productName?: string;
}): UserImpact {
  const impact = loadUserImpact();
  const count = Math.max(1, Math.floor(input?.itemCount ?? 1));
  impact.ecoPurchases += 1;
  impact.updatedAt = new Date().toISOString();
  saveUserImpact(impact);
  pushImpactActivity({
    kind: "purchase",
    title: "Eco purchase",
    detail: input?.productName
      ? `${input.productName}${count > 1 ? ` · ${count} items` : ""}`
      : `${count} item${count === 1 ? "" : "s"} from Forest Buddies®`,
  });
  return impact;
}

/** Lightweight cart engagement counter (does not claim cause impact). */
export function recordCartAction(productName?: string): void {
  const impact = loadUserImpact();
  impact.cartActions += 1;
  impact.updatedAt = new Date().toISOString();
  saveUserImpact(impact);
  // Only log occasional cart activity to avoid noise
  if (impact.cartActions === 1 || impact.cartActions % 5 === 0) {
    pushImpactActivity({
      kind: "cart",
      title: "Cart activity",
      detail: productName
        ? `Added ${productName} · ${impact.cartActions} cart actions so far`
        : `${impact.cartActions} cart actions on this device`,
    });
  }
}

export function totalImpactUnits(impact: UserImpact = loadUserImpact()): number {
  return CAUSES.reduce((sum, c) => sum + impact.byCause[c.id].units, 0);
}

export function totalImpactCost(impact: UserImpact = loadUserImpact()): number {
  return CAUSES.reduce((sum, c) => sum + impact.byCause[c.id].cost, 0);
}

export function totalImpactCo2(impact: UserImpact = loadUserImpact()): number {
  return CAUSES.reduce(
    (sum, c) => sum + impact.byCause[c.id].units * c.co2PerUnit,
    0
  );
}

/**
 * Build a personal impact summary for the dashboard.
 * Uses real local totals; soft tree-equivalent from CO₂ when trees weren’t funded directly.
 */
export function getPersonalImpactSummary(): PersonalImpactSummary {
  const impact = loadUserImpact();
  const co2Kg = Math.round(totalImpactCo2(impact) * 10) / 10;
  const treesDirect = impact.byCause.trees.units;
  const treesFromCo2 =
    treesDirect > 0 ? 0 : Math.round((co2Kg / 22) * 10) / 10;
  const treesEquivalent =
    treesDirect > 0 ? treesDirect : treesFromCo2 > 0 ? treesFromCo2 : 0;
  const isEstimated = treesDirect === 0 && treesFromCo2 > 0;

  const byCause = CAUSES.map((cause) => ({
    id: cause.id,
    name: cause.name,
    units: impact.byCause[cause.id].units,
    cost: impact.byCause[cause.id].cost,
    co2Kg:
      Math.round(
        impact.byCause[cause.id].units * cause.co2PerUnit * 10
      ) / 10,
  })).filter((row) => row.units > 0);

  const stored = loadActivity();
  const kitchen = loadKitchenHistory().slice(0, 3).map((item) => ({
    id: `kitchen-${item.id}`,
    kind: "kitchen" as const,
    title: "Leafy Kitchen",
    detail: `Planned “${item.title}” · ${item.ingredients.length} ingredients`,
    at: item.usedAt,
  }));

  const recent = [...stored, ...kitchen]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);

  const hasActivity =
    totalImpactUnits(impact) > 0 ||
    impact.ecoPurchases > 0 ||
    impact.cartActions > 0 ||
    recent.length > 0;

  return {
    treesEquivalent,
    co2Kg,
    byCause,
    ecoPurchases: impact.ecoPurchases,
    cartActions: impact.cartActions,
    recent,
    isEstimated,
    hasActivity,
  };
}

export function saveLastDonation(
  selection: CauseSelection,
  opts?: {
    source?: "donate" | "checkout";
    status?: "pending" | "recorded";
    userEmail?: string | null;
  }
) {
  const donation: LastDonation = {
    selection,
    totalCost: selectionCost(selection),
    totalCo2: selectionCo2(selection),
    createdAt: new Date().toISOString(),
  };
  try {
    if (selectionTotalUnits(selection) > 0) {
      localStorage.setItem(LAST_DONATION_KEY, JSON.stringify(donation));
      recordDonation(selection);
      recordAdminCauseContribution(selection, {
        source: opts?.source ?? "checkout",
        status: opts?.status ?? "recorded",
        createdAt: donation.createdAt,
        userEmail: opts?.userEmail ?? null,
      });
    } else {
      localStorage.removeItem(LAST_DONATION_KEY);
    }
    localStorage.removeItem("lastTreeDonation");
  } catch {
    // ignore
  }
  return donation;
}

export function consumeLastDonation(): LastDonation | null {
  if (typeof window === "undefined") return null;
  try {
    const modern = localStorage.getItem(LAST_DONATION_KEY);
    if (modern) {
      localStorage.removeItem(LAST_DONATION_KEY);
      return JSON.parse(modern) as LastDonation;
    }

    const legacy = localStorage.getItem("lastTreeDonation");
    if (legacy) {
      localStorage.removeItem("lastTreeDonation");
      const parsed = JSON.parse(legacy) as { trees?: number; cost?: number };
      const selection = emptyCauseSelection();
      selection.trees = parsed.trees ?? 0;
      return {
        selection,
        totalCost:
          parsed.cost ??
          selection.trees * (getCause("trees")?.unitPrice ?? 8),
        totalCo2:
          selection.trees * (getCause("trees")?.co2PerUnit ?? 22),
        createdAt: new Date().toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export { LAST_DONATION_KEY, IMPACT_KEY };
