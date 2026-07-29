/**
 * Standalone cause donations (no cart) — pending payload for success page.
 */

import {
  emptyCauseSelection,
  type CauseSelection,
} from "@/lib/causes";

const PENDING_KEY = "fb-pending-donation";

export type PendingDonation = {
  selection: CauseSelection;
  email?: string;
  name?: string;
  /** True when impact was already written (demo submit). */
  recorded: boolean;
  createdAt: string;
};

export function savePendingDonation(payload: PendingDonation) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadPendingDonation(): PendingDonation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingDonation>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      selection: {
        ...emptyCauseSelection(),
        ...(parsed.selection ?? {}),
      },
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      recorded: Boolean(parsed.recorded),
      createdAt:
        typeof parsed.createdAt === "string"
          ? parsed.createdAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearPendingDonation() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

/** Parse Stripe metadata causeSelection JSON (client-safe). */
export function parseDonationCauseSelection(
  raw: string | null | undefined
): CauseSelection {
  const base = emptyCauseSelection();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const id of Object.keys(base) as Array<keyof CauseSelection>) {
      const n = Number(parsed[id]);
      if (Number.isFinite(n) && n > 0) base[id] = Math.floor(n);
    }
  } catch {
    // ignore
  }
  return base;
}
