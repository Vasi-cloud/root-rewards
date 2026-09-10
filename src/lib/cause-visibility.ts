/**
 * Soft-launch visibility for donate programmes.
 * Catalogue rows live in `CAUSES`; this overlay toggles which appear on /donate.
 * Default: all catalogue causes are active.
 */

import { CAUSES, type Cause, type CauseId } from "@/lib/causes";

export const CAUSE_ACTIVE_STORAGE_KEY = "forest-buddies-cause-active";
export const CAUSE_ACTIVE_EVENT = "forest-buddies-cause-active-updated";

type ActiveMap = Partial<Record<CauseId, boolean>>;

function readMap(): ActiveMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CAUSE_ACTIVE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: ActiveMap = {};
    for (const cause of CAUSES) {
      const v = (parsed as Record<string, unknown>)[cause.id];
      if (typeof v === "boolean") out[cause.id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: ActiveMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CAUSE_ACTIVE_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CAUSE_ACTIVE_EVENT));
  } catch {
    /* ignore */
  }
}

/** True unless explicitly turned off in admin Programmes. */
export function isCauseActiveOnDonate(id: CauseId | string): boolean {
  const cause = CAUSES.find((c) => c.id === id);
  if (!cause) return false;
  const map = readMap();
  const v = map[cause.id];
  return v !== false;
}

export function setCauseActiveOnDonate(id: CauseId, active: boolean): void {
  const map = readMap();
  map[id] = active;
  writeMap(map);
}

/** Full catalogue with effective active flag (for admin Programmes). */
export function listCauseProgrammes(): Array<Cause & { activeOnDonate: boolean }> {
  const map = readMap();
  return CAUSES.map((cause) => ({
    ...cause,
    activeOnDonate: map[cause.id] !== false,
  }));
}

/** Causes shown on /donate and in CauseGiftPicker. */
export function listDonateCauses(): Cause[] {
  return listCauseProgrammes()
    .filter((c) => c.activeOnDonate)
    .map(({ activeOnDonate: _a, ...cause }) => cause);
}

export function illustrativeUnitNote(cause: Cause): string {
  return `${cause.name} £${cause.unitPrice} ≈ 1 ${cause.unitSingular} — illustrative`;
}

export function subscribeCauseActive(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => onChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === CAUSE_ACTIVE_STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener(CAUSE_ACTIVE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CAUSE_ACTIVE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
