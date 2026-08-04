/**
 * Buy Local search prefs (radius + distance unit) — device localStorage.
 */

import type { DistanceUnit } from "@/lib/local-commerce";

export type { DistanceUnit };

export type LocalPrefs = {
  maxMiles?: number;
  distanceUnit?: DistanceUnit;
  locationId?: string;
};

export const LOCAL_PREFS_KEY = "fb-local-prefs";

/** Buy Local quick chips + slider bounds (miles, internal). */
export const BUY_LOCAL_DISTANCE_OPTIONS_MI = [1, 5, 10, 25] as const;
export const BUY_LOCAL_MIN_MILES = 1;
export const BUY_LOCAL_MAX_MILES = 50;
export const BUY_LOCAL_DEFAULT_MILES = 10;

function clampMiles(n: number): number {
  if (!Number.isFinite(n)) return BUY_LOCAL_DEFAULT_MILES;
  return Math.min(
    BUY_LOCAL_MAX_MILES,
    Math.max(BUY_LOCAL_MIN_MILES, Math.round(n))
  );
}

export function getLocalPrefs(): LocalPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const p = parsed as Partial<LocalPrefs>;
    const out: LocalPrefs = {};
    if (typeof p.maxMiles === "number") out.maxMiles = clampMiles(p.maxMiles);
    if (p.distanceUnit === "mi" || p.distanceUnit === "km") {
      out.distanceUnit = p.distanceUnit;
    }
    if (typeof p.locationId === "string" && p.locationId.trim()) {
      out.locationId = p.locationId.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export function setLocalPrefs(patch: Partial<LocalPrefs>): LocalPrefs {
  if (typeof window === "undefined") return {};
  const prev = getLocalPrefs();
  const next: LocalPrefs = { ...prev };
  if (typeof patch.maxMiles === "number") {
    next.maxMiles = clampMiles(patch.maxMiles);
  }
  if (patch.distanceUnit === "mi" || patch.distanceUnit === "km") {
    next.distanceUnit = patch.distanceUnit;
  }
  if (typeof patch.locationId === "string") {
    next.locationId = patch.locationId;
  }
  window.localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(next));
  return next;
}

export function nextExpandMiles(current: number): number | null {
  const steps = [...BUY_LOCAL_DISTANCE_OPTIONS_MI, BUY_LOCAL_MAX_MILES];
  return steps.find((m) => m > current) ?? null;
}
