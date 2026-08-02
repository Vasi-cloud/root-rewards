/**
 * Admin-only cause / tree contribution ledger (localStorage).
 * Internal batching view — not public. Fed by donate + checkout cause gifts.
 */

import {
  CAUSES,
  selectionCost,
  selectionTotalUnits,
  type CauseId,
  type CauseSelection,
} from "@/lib/causes";

const KEY = "forest-buddies-admin-causes";
const EVENT = "forest-buddies-admin-causes-updated";

export type CauseContributionSource = "donate" | "checkout";
export type CauseContributionStatus = "pending" | "recorded";

export type AdminCauseContribution = {
  id: string;
  causeId: CauseId;
  causeName: string;
  units: number;
  amount: number;
  createdAt: string;
  source: CauseContributionSource;
  status: CauseContributionStatus;
  /** Optional batch key from parent donation */
  batchId: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeAdminCauses(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function loadRaw(): AdminCauseContribution[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminCauseContribution[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(rows: AdminCauseContribution[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 1000)));
    emit();
  } catch {
    // ignore
  }
}

export function loadAdminCauseContributions(): AdminCauseContribution[] {
  return loadRaw().sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

/** Sum of contribution amounts in the current calendar month. */
export function sumAdminCausesThisMonth(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth();
  return loadAdminCauseContributions()
    .filter((row) => {
      const d = new Date(row.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((sum, row) => sum + row.amount, 0);
}

export function recordAdminCauseContribution(
  selection: CauseSelection,
  opts: {
    source: CauseContributionSource;
    status?: CauseContributionStatus;
    createdAt?: string;
  }
): AdminCauseContribution[] {
  if (selectionTotalUnits(selection) < 1) return [];

  const createdAt = opts.createdAt ?? new Date().toISOString();
  const status = opts.status ?? "recorded";
  const batchId = `batch-${Date.now()}`;
  const rows = loadRaw();
  const created: AdminCauseContribution[] = [];

  for (const cause of CAUSES) {
    const units = selection[cause.id] || 0;
    if (units <= 0) continue;
    const row: AdminCauseContribution = {
      id: `cause-${Date.now()}-${cause.id}-${Math.random().toString(36).slice(2, 6)}`,
      causeId: cause.id,
      causeName: cause.name,
      units,
      amount: units * cause.unitPrice,
      createdAt,
      source: opts.source,
      status,
      batchId,
    };
    created.push(row);
  }

  if (created.length === 0) return [];
  saveRaw([...created, ...rows]);
  return created;
}

export function totalSelectionAmount(selection: CauseSelection): number {
  return selectionCost(selection);
}
