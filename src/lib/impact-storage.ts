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

const IMPACT_KEY = "forest-buddies-impact";
const LAST_DONATION_KEY = "forest-buddies-last-donation";

export interface CauseImpact {
  units: number;
  cost: number;
}

export interface UserImpact {
  byCause: Record<CauseId, CauseImpact>;
  updatedAt: string;
}

export interface LastDonation {
  selection: CauseSelection;
  totalCost: number;
  totalCo2: number;
  createdAt: string;
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
    updatedAt: new Date().toISOString(),
  };
}

export function loadUserImpact(): UserImpact {
  if (typeof window === "undefined") return emptyImpact();
  try {
    const raw = localStorage.getItem(IMPACT_KEY);
    if (!raw) return emptyImpact();
    const parsed = JSON.parse(raw) as UserImpact;
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
    base.updatedAt = parsed.updatedAt || base.updatedAt;
    return base;
  } catch {
    return emptyImpact();
  }
}

export function saveUserImpact(impact: UserImpact) {
  try {
    localStorage.setItem(IMPACT_KEY, JSON.stringify(impact));
  } catch {
    // ignore
  }
}

/** Persist a checkout donation into lifetime impact totals. */
export function recordDonation(selection: CauseSelection): UserImpact {
  const impact = loadUserImpact();
  for (const cause of CAUSES) {
    const units = selection[cause.id] || 0;
    if (units <= 0) continue;
    impact.byCause[cause.id].units += units;
    impact.byCause[cause.id].cost += units * cause.unitPrice;
  }
  impact.updatedAt = new Date().toISOString();
  saveUserImpact(impact);
  return impact;
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

export function saveLastDonation(selection: CauseSelection) {
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
    } else {
      localStorage.removeItem(LAST_DONATION_KEY);
    }
    // Migrate away from legacy key
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

    // Legacy tree-only donation
    const legacy = localStorage.getItem("lastTreeDonation");
    if (legacy) {
      localStorage.removeItem("lastTreeDonation");
      const parsed = JSON.parse(legacy) as { trees?: number; cost?: number };
      const selection = emptyCauseSelection();
      selection.trees = parsed.trees ?? 0;
      return {
        selection,
        totalCost: parsed.cost ?? selection.trees * (getCause("trees")?.unitPrice ?? 8),
        totalCo2: selection.trees * (getCause("trees")?.co2PerUnit ?? 22),
        createdAt: new Date().toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export { LAST_DONATION_KEY, IMPACT_KEY };
