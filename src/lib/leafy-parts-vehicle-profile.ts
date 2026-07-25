/**
 * Persist a default vehicle for Leafy Parts Finder (device localStorage).
 */

import {
  VEHICLE_CATALOG,
  yearsForModel,
  type VehicleMakeId,
} from "@/lib/leafy-parts-vehicle-catalog";
import type { VehicleDetails } from "@/lib/leafy-parts";

export const LEAFY_PARTS_VEHICLE_KEY = "fb-leafy-parts-vehicle";

export type SavedVehicleProfile = {
  makeId: VehicleMakeId;
  modelId: string;
  year: string;
  vin: string;
  savedAt: string;
};

function isVehicleMakeId(value: string): value is VehicleMakeId {
  return value in VEHICLE_CATALOG;
}

/** Validate and normalise a stored profile against the current catalog. */
export function sanitizeSavedVehicleProfile(
  raw: unknown
): SavedVehicleProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SavedVehicleProfile>;
  if (!data.makeId || !isVehicleMakeId(data.makeId)) return null;
  if (!data.modelId || typeof data.modelId !== "string") return null;

  const model = VEHICLE_CATALOG[data.makeId].models.find(
    (m) => m.id === data.modelId
  );
  if (!model) return null;

  const year = typeof data.year === "string" ? data.year : "";
  const years = yearsForModel(data.makeId, data.modelId);
  if (!year || !years.includes(year)) return null;

  const vin =
    typeof data.vin === "string"
      ? data.vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17)
      : "";

  return {
    makeId: data.makeId,
    modelId: data.modelId,
    year,
    vin,
    savedAt:
      typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
  };
}

export function loadSavedVehicleProfile(): SavedVehicleProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEAFY_PARTS_VEHICLE_KEY);
    if (!raw) return null;
    return sanitizeSavedVehicleProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Save Make / Model / Year (+ optional VIN). Part number is not stored —
 * it belongs to a specific search, not the vehicle profile.
 */
export function saveVehicleProfile(
  details: VehicleDetails
): SavedVehicleProfile | null {
  if (typeof window === "undefined") return null;
  if (!details.makeId || !details.modelId || !details.year) return null;

  const profile = sanitizeSavedVehicleProfile({
    makeId: details.makeId,
    modelId: details.modelId,
    year: details.year,
    vin: details.vin,
    savedAt: new Date().toISOString(),
  });
  if (!profile) return null;

  try {
    localStorage.setItem(LEAFY_PARTS_VEHICLE_KEY, JSON.stringify(profile));
  } catch {
    return null;
  }
  return profile;
}

export function clearSavedVehicleProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEAFY_PARTS_VEHICLE_KEY);
  } catch {
    // ignore
  }
}

export function savedProfileToVehicleDetails(
  profile: SavedVehicleProfile,
  partNumber = ""
): VehicleDetails {
  return {
    makeId: profile.makeId,
    modelId: profile.modelId,
    year: profile.year,
    vin: profile.vin,
    partNumber,
  };
}

export function vehicleMatchesSavedProfile(
  details: VehicleDetails,
  profile: SavedVehicleProfile | null
): boolean {
  if (!profile) return false;
  return (
    details.makeId === profile.makeId &&
    details.modelId === profile.modelId &&
    details.year === profile.year &&
    details.vin === profile.vin
  );
}
