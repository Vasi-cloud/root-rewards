/**
 * Personal Garage — saved Leafy Parts Finder identifications (localStorage).
 */

import type {
  IdentifiedPart,
  PartKind,
  VehicleDetails,
} from "@/lib/leafy-parts";
import { formatVehicleLabel } from "@/lib/leafy-parts-vehicle-catalog";

export const LEAFY_PARTS_GARAGE_KEY = "fb-leafy-parts-garage";
const MAX_GARAGE_ITEMS = 40;
const EVENT = "fb-leafy-parts-garage-updated";

export type GaragePartItem = {
  id: string;
  partName: string;
  kind: PartKind;
  oemNumber: string;
  category: string;
  summary: string;
  matchExplanation: string;
  fitmentNote: string;
  confidencePercent: number;
  vehicleLabel: string;
  makeId: string;
  modelId: string;
  year: string;
  /** Optional typed OEM at save time */
  partNumber: string;
  savedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeGarage(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function isGarageItem(raw: unknown): raw is GaragePartItem {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<GaragePartItem>;
  return Boolean(
    typeof item.id === "string" &&
      typeof item.partName === "string" &&
      typeof item.kind === "string" &&
      typeof item.vehicleLabel === "string" &&
      typeof item.savedAt === "string"
  );
}

export function loadGarageParts(): GaragePartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEAFY_PARTS_GARAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isGarageItem)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, MAX_GARAGE_ITEMS);
  } catch {
    return [];
  }
}

function saveGarageParts(items: GaragePartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LEAFY_PARTS_GARAGE_KEY,
      JSON.stringify(items.slice(0, MAX_GARAGE_ITEMS))
    );
    emit();
  } catch {
    // ignore quota errors
  }
}

export function getGaragePart(id: string): GaragePartItem | null {
  return loadGarageParts().find((item) => item.id === id) ?? null;
}

/** True if the same part + vehicle was already saved. */
export function findMatchingGarageItem(
  identified: IdentifiedPart,
  vehicleLabel: string
): GaragePartItem | null {
  return (
    loadGarageParts().find(
      (item) =>
        item.kind === identified.kind &&
        item.oemNumber === identified.oemNumber &&
        item.vehicleLabel === vehicleLabel
    ) ?? null
  );
}

export function savePartToGarage(input: {
  identified: IdentifiedPart;
  details: VehicleDetails;
  vehicleLabel?: string;
}): GaragePartItem {
  const vehicleLabel =
    input.vehicleLabel?.trim() || formatVehicleLabel(input.details);
  const existing = findMatchingGarageItem(input.identified, vehicleLabel);
  if (existing) return existing;

  const item: GaragePartItem = {
    id: `garage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    partName: input.identified.name,
    kind: input.identified.kind,
    oemNumber: input.identified.oemNumber,
    category: input.identified.category,
    summary: input.identified.summary,
    matchExplanation: input.identified.matchExplanation,
    fitmentNote: input.identified.fitmentNote,
    confidencePercent: input.identified.confidencePercent,
    vehicleLabel,
    makeId: input.details.makeId || "",
    modelId: input.details.modelId || "",
    year: input.details.year || "",
    partNumber: input.details.partNumber?.trim() || "",
    savedAt: new Date().toISOString(),
  };

  saveGarageParts([item, ...loadGarageParts()]);
  return item;
}

export function removePartFromGarage(id: string): void {
  saveGarageParts(loadGarageParts().filter((item) => item.id !== id));
}

export function clearGarage(): void {
  saveGarageParts([]);
}

export function formatGarageDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
