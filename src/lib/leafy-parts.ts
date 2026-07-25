/**
 * Leafy Parts Finder — identification helpers + product mapping.
 *
 * Photos stay on-device. Call `identifyPartFromImages` from the UI —
 * that is the stable seam for swapping mock vision for a real API
 * (e.g. Grok Vision) later.
 */

import type { Product } from "@/types";
import {
  VEHICLE_CATALOG,
  formatVehicleLabel,
  type VehicleMakeId,
} from "@/lib/leafy-parts-vehicle-catalog";

export type { VehicleMakeId, VehicleModel } from "@/lib/leafy-parts-vehicle-catalog";
export {
  YEAR_MIN,
  YEAR_MAX,
  YEAR_OPTIONS,
  VEHICLE_CATALOG,
  VEHICLE_MAKE_IDS,
  modelsForMake,
  yearsForModel,
  formatVehicleLabel,
} from "@/lib/leafy-parts-vehicle-catalog";

export type PartCondition = "recycled" | "remanufactured" | "new";

export type VehicleDetails = {
  makeId: VehicleMakeId | "";
  modelId: string;
  year: string;
  vin: string;
  /** Optional OEM / aftermarket part number typed by the user */
  partNumber: string;
};

export type IdentifiedPart = {
  id: string;
  name: string;
  oemNumber: string;
  /** True when the displayed OEM came from the user's part-number field */
  oemFromUser: boolean;
  category: string;
  confidencePercent: number;
  summary: string;
  /** Short plain-language reason for the match */
  matchExplanation: string;
  fitmentNote: string;
  kind: PartKind;
};

export type PartOption = {
  id: string;
  condition: PartCondition;
  name: string;
  description: string;
  price: number;
  sustainabilityScore: number;
  /** Higher = more eco-preferred for sorting / highlight */
  ecoRank: number;
  badge: string;
  highlight: boolean;
  treesEstimate: number;
  amazonSearch: string;
};

export type PartIdentificationResult = {
  identified: IdentifiedPart;
  vehicleLabel: string;
  options: PartOption[];
  generatedAt: string;
};

export const MAX_PART_PHOTOS = 4;

export const PARTS_AI_DISCLAIMER =
  "Leafy’s photo identification is helpful but not 100% accurate. Always double-check part numbers and vehicle compatibility before ordering.";

export const PARTS_COMPAT_DISCLAIMER =
  "Confirm fitment with your VIN, OEM number, or a trusted mechanic — especially for safety-critical parts like brakes and steering.";

export const PARTS_MOCK_AI_NOTE =
  "This is currently mock AI for demonstration. Real vision AI will be connected later — you can override the part type anytime.";

export type PartKind =
  | "thermostat"
  | "brake_pads_front"
  | "brake_pads_rear"
  | "oil_filter"
  | "air_filter"
  | "cabin_filter"
  | "spark_plugs"
  | "alternator"
  | "starter_motor"
  | "radiator"
  | "water_pump"
  | "oxygen_sensor"
  | "abs_sensor"
  | "temp_sensor"
  | "maf_sensor"
  | "wiper_blades"
  | "battery"
  | "fuel_filter";

export const PART_KIND_OPTIONS: { id: PartKind; label: string }[] = [
  { id: "thermostat", label: "Thermostat / Coolant thermostat" },
  { id: "brake_pads_front", label: "Brake pads (front)" },
  { id: "brake_pads_rear", label: "Brake pads (rear)" },
  { id: "oil_filter", label: "Oil filter" },
  { id: "air_filter", label: "Air filter" },
  { id: "cabin_filter", label: "Cabin filter" },
  { id: "fuel_filter", label: "Fuel filter" },
  { id: "spark_plugs", label: "Spark plugs" },
  { id: "alternator", label: "Alternator" },
  { id: "starter_motor", label: "Starter motor" },
  { id: "radiator", label: "Radiator" },
  { id: "water_pump", label: "Water pump" },
  { id: "oxygen_sensor", label: "Oxygen sensor" },
  { id: "abs_sensor", label: "ABS sensor" },
  { id: "temp_sensor", label: "Temperature sensor" },
  { id: "maf_sensor", label: "MAF / air-flow sensor" },
  { id: "wiper_blades", label: "Wiper blades" },
  { id: "battery", label: "Battery" },
];

/** Parts where a wrong fit can affect braking, stability, or visibility. */
export const SAFETY_CRITICAL_PART_KINDS: readonly PartKind[] = [
  "brake_pads_front",
  "brake_pads_rear",
  "abs_sensor",
  "wiper_blades",
];

export const PARTS_SAFETY_WARNING =
  "This identification is for guidance only. For brakes, ABS, and other safety-related parts, a wrong fit can be dangerous. Always confirm the exact part against your vehicle with a trusted mechanic or official OEM / parts sources before you buy or install.";

export function isSafetyCriticalPart(kind: PartKind): boolean {
  return (SAFETY_CRITICAL_PART_KINDS as readonly string[]).includes(kind);
}

export type PhotoHintInput = {
  previewUrl: string;
  name: string;
};

/** Stable input contract for Leafy Parts identification (UI → lib). */
export type IdentifyPartInput = {
  photos: PhotoHintInput[];
  details: VehicleDetails;
  /**
   * Optional OEM / part number. When set, mock (and later real AI) can
   * boost confidence and prefer this number in results.
   */
  partNumber?: string;
  /**
   * Optional close-up of the stamped / printed part number.
   * Used to improve mock matching (and later real OCR / vision).
   */
  partNumberPhoto?: PhotoHintInput | null;
  /** When set, skip vision and build results for this part type */
  kindOverride?: PartKind;
};

type PartTemplate = {
  kind: PartKind;
  name: string;
  category: string;
  summary: string;
  basePrice: number;
  /** Fallback OEM when make-specific map has no entry */
  defaultOem: string;
};

const PART_TEMPLATES: Record<PartKind, PartTemplate> = {
  thermostat: {
    kind: "thermostat",
    name: "Coolant thermostat",
    category: "Cooling",
    summary:
      "Round metal thermostat with a central wax-pellet / spring assembly — controls coolant flow to the radiator.",
    /** Typical new retail (GBP-style) — condition prices derive from this */
    basePrice: 38,
    defaultOem: "82 00 277 070",
  },
  brake_pads_front: {
    kind: "brake_pads_front",
    name: "Front brake pad set",
    category: "Brakes",
    summary:
      "Flat friction pads with backing plates — typical front axle brake pad set.",
    basePrice: 68,
    defaultOem: "77 01 207 822",
  },
  brake_pads_rear: {
    kind: "brake_pads_rear",
    name: "Rear brake pad set",
    category: "Brakes",
    summary:
      "Compact flat friction pads — typical rear axle brake pad set (often smaller than front).",
    basePrice: 58,
    defaultOem: "77 01 208 114",
  },
  oil_filter: {
    kind: "oil_filter",
    name: "Oil filter",
    category: "Filters",
    summary:
      "Cylindrical spin-on or cartridge oil filter — common service item for oil changes.",
    basePrice: 12,
    defaultOem: "82 00 432 598",
  },
  fuel_filter: {
    kind: "fuel_filter",
    name: "Fuel filter",
    category: "Filters",
    summary:
      "In-line or cartridge fuel filter — typically a compact cylinder with hose fittings.",
    basePrice: 28,
    defaultOem: "82 00 167 542",
  },
  air_filter: {
    kind: "air_filter",
    name: "Engine air filter",
    category: "Filters",
    summary:
      "Panel air filter with pleated media and foam end seals — engine intake filter cartridge.",
    basePrice: 18,
    defaultOem: "82 00 432 179",
  },
  cabin_filter: {
    kind: "cabin_filter",
    name: "Cabin pollen filter",
    category: "Filters",
    summary:
      "Cabin / pollen filter cartridge — layered media for HVAC air quality.",
    basePrice: 16,
    defaultOem: "27 27 7 508 237",
  },
  spark_plugs: {
    kind: "spark_plugs",
    name: "Spark plugs (set)",
    category: "Ignition",
    summary:
      "Threaded ceramic/metal spark plugs — ignition tips for petrol engines.",
    basePrice: 42,
    defaultOem: "77 00 274 175",
  },
  alternator: {
    kind: "alternator",
    name: "Alternator",
    category: "Electrical",
    summary:
      "Cylindrical alternator housing with pulley — charging unit for the battery.",
    basePrice: 255,
    defaultOem: "77 11 135 588",
  },
  starter_motor: {
    kind: "starter_motor",
    name: "Starter motor",
    category: "Electrical",
    summary:
      "Compact cylindrical starter with gear nose — engages the flywheel to crank the engine.",
    basePrice: 220,
    defaultOem: "77 11 135 902",
  },
  radiator: {
    kind: "radiator",
    name: "Radiator",
    category: "Cooling",
    summary:
      "Large finned cooling core with plastic end tanks — engine coolant radiator.",
    basePrice: 185,
    defaultOem: "82 00 041 218",
  },
  water_pump: {
    kind: "water_pump",
    name: "Water pump",
    category: "Cooling",
    summary:
      "Metal pump body with impeller / pulley flange — circulates engine coolant.",
    basePrice: 95,
    defaultOem: "77 01 474 714",
  },
  oxygen_sensor: {
    kind: "oxygen_sensor",
    name: "Oxygen / lambda sensor",
    category: "Sensors",
    summary:
      "Threaded probe-style sensor with a wiring pigtail — exhaust oxygen (lambda) sensor.",
    basePrice: 82,
    defaultOem: "77 00 107 095",
  },
  abs_sensor: {
    kind: "abs_sensor",
    name: "ABS wheel-speed sensor",
    category: "Sensors",
    summary:
      "Slim sensor with mounting tab and harness — ABS / wheel-speed pickup.",
    basePrice: 52,
    defaultOem: "47 91 015 57R",
  },
  temp_sensor: {
    kind: "temp_sensor",
    name: "Coolant temperature sensor",
    category: "Sensors",
    summary:
      "Small threaded sensor with electrical connector — coolant temperature sender.",
    basePrice: 22,
    defaultOem: "82 00 167 288",
  },
  maf_sensor: {
    kind: "maf_sensor",
    name: "MAF / air-flow sensor",
    category: "Sensors",
    summary:
      "Plastic sensor housing with an electrical connector — mass air-flow unit.",
    basePrice: 110,
    defaultOem: "82 00 041 644",
  },
  wiper_blades: {
    kind: "wiper_blades",
    name: "Wiper blades",
    category: "Body",
    summary:
      "Long rubber wiping edge on a metal / plastic frame — windscreen wiper blades.",
    basePrice: 28,
    defaultOem: "28 89 015 58R",
  },
  battery: {
    kind: "battery",
    name: "Car battery",
    category: "Electrical",
    summary:
      "Rectangular case with top terminals — 12V lead-acid or AGM starter battery.",
    basePrice: 135,
    defaultOem: "77 11 135 001",
  },
};

/** Plausible OEM-style refs per make for common parts (mock / demo). */
const OEM_BY_MAKE: Partial<
  Record<VehicleMakeId, Partial<Record<PartKind, string>>>
> = {
  renault: {
    thermostat: "82 00 277 070",
    brake_pads_front: "41 06 085 79R",
    brake_pads_rear: "44 06 047 72R",
    oil_filter: "82 00 432 598",
    fuel_filter: "82 00 167 542",
    air_filter: "82 00 432 179",
    cabin_filter: "27 27 7 508 237",
    spark_plugs: "77 00 274 175",
    alternator: "77 11 135 588",
    starter_motor: "77 11 135 902",
    oxygen_sensor: "77 00 107 095",
    maf_sensor: "82 00 041 644",
    battery: "77 11 135 001",
  },
  peugeot: {
    thermostat: "1338.A6",
    brake_pads_front: "4254.22",
    brake_pads_rear: "4254.34",
    oil_filter: "1109.AK",
    fuel_filter: "1567.C6",
    air_filter: "1444.TJ",
    cabin_filter: "6447.TF",
    oxygen_sensor: "1628.KR",
    maf_sensor: "1920.GW",
  },
  citroen: {
    thermostat: "1338.A6",
    brake_pads_front: "4254.22",
    oil_filter: "1109.AK",
    air_filter: "1444.TJ",
    oxygen_sensor: "1628.KR",
  },
  dacia: {
    thermostat: "82 00 277 070",
    oil_filter: "82 00 432 598",
    air_filter: "82 00 432 179",
    cabin_filter: "27 27 7 508 237",
    brake_pads_front: "41 06 085 79R",
  },
  volkswagen: {
    thermostat: "03C 121 111",
    brake_pads_front: "1K0 698 151",
    brake_pads_rear: "1K0 698 451",
    air_filter: "1K0 129 620",
    cabin_filter: "1K0 819 644",
    oil_filter: "03C 115 561",
    fuel_filter: "1K0 127 401",
    oxygen_sensor: "03G 906 262",
    maf_sensor: "06A 906 461",
  },
  audi: {
    thermostat: "06A 121 111",
    brake_pads_front: "8E0 698 151",
    oil_filter: "06J 115 403",
    air_filter: "8K0 133 843",
    oxygen_sensor: "06A 906 262",
  },
  skoda: {
    thermostat: "03C 121 111",
    brake_pads_front: "1K0 698 151",
    oil_filter: "03C 115 561",
    air_filter: "1K0 129 620",
    cabin_filter: "1K0 819 644",
  },
  seat: {
    thermostat: "03C 121 111",
    brake_pads_front: "1K0 698 151",
    oil_filter: "03C 115 561",
    air_filter: "1K0 129 620",
  },
  cupra: {
    oil_filter: "03C 115 561",
    brake_pads_front: "1K0 698 151",
    cabin_filter: "1K0 819 644",
  },
  ford: {
    thermostat: "1 339 017",
    brake_pads_front: "1 787 511",
    oxygen_sensor: "1 748 860",
    oil_filter: "1 719 437",
    air_filter: "1 488 805",
    cabin_filter: "1 704 079",
  },
  toyota: {
    thermostat: "90916-03100",
    brake_pads_front: "04465-0R090",
    air_filter: "17801-0V020",
    oil_filter: "90915-YZZD4",
    cabin_filter: "87139-YZZ08",
    oxygen_sensor: "89465-0D090",
  },
  honda: {
    thermostat: "19301-PAA-A01",
    brake_pads_front: "45022-S5A-J00",
    oxygen_sensor: "36531-PAA-A01",
    oil_filter: "15400-PLM-A02",
    air_filter: "17220-RNA-A00",
  },
  bmw: {
    thermostat: "11 53 7 547 415",
    brake_pads_front: "34 11 6 857 827",
    oxygen_sensor: "11 78 7 566 347",
    oil_filter: "11 42 7 566 327",
    cabin_filter: "64 31 9 224 380",
  },
  mercedes: {
    thermostat: "A 271 200 00 15",
    brake_pads_front: "A 000 420 13 00",
    oil_filter: "A 271 180 00 09",
    cabin_filter: "A 212 830 03 18",
  },
  opel: {
    thermostat: "13 38 06",
    oil_filter: "56 50 359",
    air_filter: "58 36 023",
    brake_pads_front: "16 05 980",
  },
  mini: {
    oil_filter: "11 42 7 566 327",
    brake_pads_front: "34 11 6 857 827",
    cabin_filter: "64 31 9 224 380",
  },
  porsche: {
    oil_filter: "958 107 222 00",
    brake_pads_front: "958 351 939 11",
    cabin_filter: "958 573 737 00",
  },
  suzuki: {
    oil_filter: "16510-67J10",
    air_filter: "13780-63J00",
    brake_pads_front: "55810-65J00",
  },
  volvo: {
    oil_filter: "31330049",
    cabin_filter: "31471203",
    brake_pads_front: "31471334",
  },
};

/** Tree impact from order value — keep in sync across recycled / reman / new. */
function treesForPrice(price: number): number {
  if (price <= 0) return 1;
  return Math.max(1, Math.min(8, Math.floor(price / 28) || 1));
}

/**
 * Mock retail ladder from a typical *new* street price:
 * - Recycled / used ≈ 35–40% (breaker / take-back)
 * - Remanufactured ≈ 60–65% (refurbished core)
 * - New ≈ full retail
 */
function pricesForConditions(newRetail: number): {
  recycled: number;
  remanufactured: number;
  new: number;
} {
  const retail = Math.max(8, newRetail);
  const money = (n: number) => Math.round(n * 100) / 100;
  return {
    new: money(retail),
    remanufactured: money(Math.max(6, retail * 0.62)),
    recycled: money(Math.max(4, retail * 0.38)),
  };
}

function oemForMake(makeId: VehicleMakeId | "", kind: PartKind): string {
  if (makeId && OEM_BY_MAKE[makeId]?.[kind]) {
    return OEM_BY_MAKE[makeId]![kind]!;
  }
  return PART_TEMPLATES[kind].defaultOem;
}

/** Normalise OEM / part numbers for comparison (strip spaces, dashes, dots). */
export function normalizePartNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.\-_\/]/g, "");
}

/**
 * MOCK helper — map a typed OEM / part number to a part kind when it matches
 * known catalog refs (or loose keyword cues). Returns null if unknown.
 */
function kindFromPartNumber(
  partNumber: string,
  makeId: VehicleMakeId | ""
): PartKind | null {
  const normalized = normalizePartNumber(partNumber);
  if (normalized.length < 4) return null;

  const tryMatch = (oem: string) => {
    const n = normalizePartNumber(oem);
    return (
      n.length >= 4 &&
      (normalized === n ||
        normalized.includes(n) ||
        n.includes(normalized))
    );
  };

  // Prefer make-specific OEM map first
  if (makeId && OEM_BY_MAKE[makeId]) {
    for (const [kind, oem] of Object.entries(OEM_BY_MAKE[makeId]!) as [
      PartKind,
      string,
    ][]) {
      if (tryMatch(oem)) return kind;
    }
  }

  // Any make in the catalog
  for (const makeMap of Object.values(OEM_BY_MAKE)) {
    if (!makeMap) continue;
    for (const [kind, oem] of Object.entries(makeMap) as [PartKind, string][]) {
      if (tryMatch(oem)) return kind;
    }
  }

  // Template defaults
  for (const template of Object.values(PART_TEMPLATES)) {
    if (tryMatch(template.defaultOem)) return template.kind;
  }

  // Loose keyword cues in free-typed numbers / notes
  const lower = partNumber.toLowerCase();
  if (/thermo|thermostat/.test(lower)) return "thermostat";
  if (/brake.?pad|plaquette/.test(lower)) {
    return /rear|arriere|arrière/.test(lower)
      ? "brake_pads_rear"
      : "brake_pads_front";
  }
  if (/oil.?filter|filtre.?huile/.test(lower)) return "oil_filter";
  if (/fuel.?filter|filtre.?carburant/.test(lower)) return "fuel_filter";
  if (/cabin|pollen|habitacle/.test(lower)) return "cabin_filter";
  if (/air.?filter|filtre.?air/.test(lower)) return "air_filter";
  if (/spark|bougie/.test(lower)) return "spark_plugs";
  if (/alternat/.test(lower)) return "alternator";
  if (/starter|demarreur|démarreur/.test(lower)) return "starter_motor";
  if (/radiator|radiateur/.test(lower)) return "radiator";
  if (/water.?pump|pompe.?eau/.test(lower)) return "water_pump";
  if (/oxygen|lambda|o2/.test(lower)) return "oxygen_sensor";
  if (/\babs\b/.test(lower)) return "abs_sensor";
  if (/temp.?sensor|coolant.?temp/.test(lower)) return "temp_sensor";
  if (/\bmaf\b|air.?flow/.test(lower)) return "maf_sensor";
  if (/wiper|balai/.test(lower)) return "wiper_blades";
  if (/battery|batterie/.test(lower)) return "battery";

  return null;
}

function formatUserPartNumber(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed.toUpperCase() : trimmed;
}

/** Pull OEM-like tokens from a filename (mock stand-in for OCR). */
function oemHintsFromFilename(name: string): string[] {
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  const chunks = base.match(/[A-Za-z0-9][A-Za-z0-9.\-_ ]{3,}/g) ?? [];
  return chunks
    .map((c) => c.trim())
    .filter((c) => normalizePartNumber(c).length >= 5)
    .slice(0, 4);
}

type PartNumberPhotoCue = {
  /** Kind inferred from the part-number close-up alone */
  inference: PartInference | null;
  /** True when the close-up looks like a readable label plate */
  labelBoost: boolean;
};

/**
 * MOCK: use a dedicated part-number close-up (filename / OEM cues) before
 * falling back to general shape matching on the main photos.
 */
async function inferFromPartNumberPhoto(
  photo: PhotoHintInput,
  makeId: VehicleMakeId | ""
): Promise<PartNumberPhotoCue> {
  const fromName = kindFromFilenames([photo]);
  if (fromName) {
    const label =
      PART_KIND_OPTIONS.find((o) => o.id === fromName)?.label ?? fromName;
    return {
      inference: {
        kind: fromName,
        reason: `Part-number photo filename cues matched “${label}”.`,
        scoreStrength: 0.95,
      },
      labelBoost: true,
    };
  }

  for (const hint of oemHintsFromFilename(photo.name)) {
    const fromOem = kindFromPartNumber(hint, makeId);
    if (fromOem) {
      const label =
        PART_KIND_OPTIONS.find((o) => o.id === fromOem)?.label ?? fromOem;
      return {
        inference: {
          kind: fromOem,
          reason: `Part-number photo suggested OEM-style ref “${formatUserPartNumber(hint)}” for ${label}.`,
          scoreStrength: 0.93,
        },
        labelBoost: true,
      };
    }
  }

  const signals = await sampleImageSignals(photo.previewUrl);
  const labelBoost = Boolean(
    signals &&
      (signals.lightPleatShare > 0.12 || signals.centerVsEdgeContrast > 0.18)
  );

  return { inference: null, labelBoost };
}

function kindFromFilenames(photos: PhotoHintInput[]): PartKind | null {
  const blob = photos.map((p) => p.name).join(" ").toLowerCase();
  if (/thermo|wax.?pellet/.test(blob)) return "thermostat";
  if (/rear.*brake|brake.*rear|plaquette.?arriere/.test(blob))
    return "brake_pads_rear";
  if (/front.*brake|brake.*front|brake|pad|plaquette/.test(blob))
    return "brake_pads_front";
  if (/oil.?filter|filtre.?huile/.test(blob)) return "oil_filter";
  if (/fuel.?filter|filtre.?carburant|filtre.?essence/.test(blob))
    return "fuel_filter";
  if (/cabin|pollen|habitacle/.test(blob)) return "cabin_filter";
  if (/air.?filter|filtre.?air/.test(blob)) return "air_filter";
  if (/spark|bougie|plug/.test(blob)) return "spark_plugs";
  if (/alternat|dynamo/.test(blob)) return "alternator";
  if (/starter|demarreur|démarreur/.test(blob)) return "starter_motor";
  if (/radiator|radiateur/.test(blob)) return "radiator";
  if (/water.?pump|pompe.?eau/.test(blob)) return "water_pump";
  if (/maf|mass.?air|air.?flow/.test(blob)) return "maf_sensor";
  if (/o2|oxygen|lambda|sonde.?lambda/.test(blob)) return "oxygen_sensor";
  if (/abs|wheel.?speed/.test(blob)) return "abs_sensor";
  if (/temp.?sensor|coolant.?temp|cts/.test(blob)) return "temp_sensor";
  if (/wiper|balai|essuie/.test(blob)) return "wiper_blades";
  if (/battery|batterie|accu/.test(blob)) return "battery";
  if (/coolant/.test(blob)) return "thermostat";
  if (/\bsensor\b/.test(blob)) return "oxygen_sensor";
  return null;
}

type ImageSignals = {
  metallicShare: number;
  copperShare: number;
  darkFlatShare: number;
  lightPleatShare: number;
  centerVsEdgeContrast: number;
  blackPlasticShare: number;
  connectorHueShare: number;
  rubberShare: number;
  yellowShare: number;
  elongatedShare: number;
  /** Round flange / spring housing (thermostat-like). */
  circularityShare: number;
  /** Compact cylinder profile (oil / fuel filter). */
  cylindricalShare: number;
  /** Flat rectangular panel (brake pad / panel filter). */
  flatPanelShare: number;
};

async function sampleImageSignals(url: string): Promise<ImageSignals | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  try {
    const img = await loadImage(url);
    const size = 72;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let metallic = 0;
    let copper = 0;
    let darkFlat = 0;
    let lightPleat = 0;
    let blackPlastic = 0;
    let connectorHue = 0;
    let rubber = 0;
    let yellow = 0;
    let elongated = 0;
    let centerLum = 0;
    let edgeLum = 0;
    let centerN = 0;
    let edgeN = 0;
    let ringContent = 0;
    let ringSlots = 0;
    let cornerContent = 0;
    let cornerSlots = 0;
    let midBandContent = 0;
    let midBandSlots = 0;
    let contentPixels = 0;
    const colHits = new Array(size).fill(0);
    const rowHits = new Array(size).fill(0);
    const total = size * size;
    const cx = size / 2;
    const cy = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / (size / 2);
        const isCenter = dist < size * 0.28;
        const isEdge = dist > size * 0.38;
        const isContent = lum < 200 || sat > 0.12;

        if (isCenter) {
          centerLum += lum;
          centerN++;
        } else if (isEdge) {
          edgeLum += lum;
          edgeN++;
        }

        if (sat < 0.18 && lum > 85 && lum < 210 && Math.abs(r - g) < 22) {
          metallic++;
        }
        if (r > 120 && r > g + 15 && g > b + 5 && lum > 70 && lum < 200) {
          copper++;
        }
        if (lum < 70 && sat < 0.25) {
          darkFlat++;
        }
        if (lum > 170 && sat < 0.2) {
          lightPleat++;
        }
        if (lum < 55 && sat < 0.2) {
          blackPlastic++;
        }
        if (sat > 0.25 && lum > 40 && lum < 180 && (b > r + 20 || g > r + 15)) {
          connectorHue++;
        }
        // Dark rubber / wiper edge
        if (lum < 45 && sat < 0.15) {
          rubber++;
        }
        // Battery case yellows / labels
        if (r > 160 && g > 130 && b < 100 && sat > 0.25) {
          yellow++;
        }
        // Elongated horizontal structures (wipers, radiator fins)
        if (Math.abs(dx) > Math.abs(dy) * 1.4 && lum < 140) {
          elongated++;
        }

        // Annular ring — thermostat flange / spring housing
        if (normDist > 0.22 && normDist < 0.55) {
          ringSlots++;
          if (isContent) ringContent++;
        }

        // Corner fill — high for rectangles, low for round parts
        if (
          (x < size * 0.18 || x > size * 0.82) &&
          (y < size * 0.18 || y > size * 0.82)
        ) {
          cornerSlots++;
          if (isContent) cornerContent++;
        }

        // Horizontal mid-band — strong for side-on cylinders
        if (y > size * 0.32 && y < size * 0.68) {
          midBandSlots++;
          if (isContent) midBandContent++;
        }

        if (isContent) {
          contentPixels++;
          colHits[x] += 1;
          rowHits[y] += 1;
        }
      }
    }

    let contentCols = 0;
    let contentRows = 0;
    for (const h of colHits) if (h > size * 0.12) contentCols += 1;
    for (const h of rowHits) if (h > size * 0.12) contentRows += 1;

    const centerAvg = centerN ? centerLum / centerN : 128;
    const edgeAvg = edgeN ? edgeLum / edgeN : 128;
    const contrast = Math.abs(centerAvg - edgeAvg) / 255;
    const ringDensity = ringSlots ? ringContent / ringSlots : 0;
    const cornerDensity = cornerSlots ? cornerContent / cornerSlots : 0;
    const midBandDensity = midBandSlots ? midBandContent / midBandSlots : 0;
    const fillRatio = contentPixels / total;
    const aspect = contentRows > 0 ? contentCols / contentRows : 1;

    // Round thermostat: dense ring, sparse corners, strong centre vs rim
    const circularityShare = Math.max(
      0,
      Math.min(
        1,
        ringDensity * 1.1 +
          (1 - cornerDensity) * 0.5 +
          contrast * 0.85 -
          Math.abs(aspect - 1) * 0.3
      )
    );

    // Spin-on / cartridge filter: mid-band body, metallic, lower spring contrast
    const cylindricalShare = Math.max(
      0,
      Math.min(
        1,
        midBandDensity * 0.8 +
          metallic / total +
          (1 - contrast) * 0.4 +
          (aspect > 0.75 && aspect < 1.45 ? 0.22 : 0) -
          cornerDensity * 0.18
      )
    );

    // Flat pad / panel: corner content, not round
    const flatPanelShare = Math.max(
      0,
      Math.min(
        1,
        cornerDensity * 0.85 +
          fillRatio * 0.3 +
          (aspect > 1.12 || aspect < 0.88 ? 0.28 : 0.08) +
          (1 - ringDensity) * 0.3 -
          contrast * 0.15
      )
    );

    return {
      metallicShare: metallic / total,
      copperShare: copper / total,
      darkFlatShare: darkFlat / total,
      lightPleatShare: lightPleat / total,
      blackPlasticShare: blackPlastic / total,
      connectorHueShare: connectorHue / total,
      rubberShare: rubber / total,
      yellowShare: yellow / total,
      elongatedShare: elongated / total,
      centerVsEdgeContrast: contrast,
      circularityShare,
      cylindricalShare,
      flatPanelShare,
    };
  } catch {
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}

export type PartInference = {
  kind: PartKind;
  reason: string;
  /** 0–1 relative strength of the winning score */
  scoreStrength: number;
};

const MATCH_REASONS: Record<PartKind, string> = {
  thermostat:
    "Round metallic body with centre/spring contrast — typical coolant thermostat.",
  brake_pads_front:
    "Dark, flat friction surfaces — typical front brake pad faces.",
  brake_pads_rear:
    "Compact dark flat pads — typical rear brake pad set.",
  oil_filter:
    "Compact cylindrical metal can — typical spin-on oil filter.",
  fuel_filter:
    "Compact cylinder with darker housing cues — typical in-line fuel filter.",
  air_filter:
    "Light pleated media and soft edges — typical engine air filter.",
  cabin_filter:
    "Light layered filter media in a compact cartridge — cabin / pollen filter.",
  spark_plugs:
    "Small threaded ceramic tips — spark plug set cues.",
  alternator:
    "Dense metal housing with cylindrical mass — alternator-style assembly.",
  starter_motor:
    "Compact metal cylinder with gear nose cues — starter motor.",
  radiator:
    "Wide finned / elongated cooling core — radiator assembly.",
  water_pump:
    "Metal pump body with flange / impeller cues — water pump.",
  oxygen_sensor:
    "Probe-like metal tip with wiring cues — oxygen / lambda sensor.",
  abs_sensor:
    "Slim sensor body with harness cues — ABS wheel-speed sensor.",
  temp_sensor:
    "Small threaded sensor with connector — coolant temperature sensor.",
  maf_sensor:
    "Dark plastic housing with connector colour — mass air-flow sensor.",
  wiper_blades:
    "Long dark rubber edge on a slim frame — wiper blade.",
  battery:
    "Rectangular case with yellow/label tones — 12V car battery.",
};

/**
 * Mock vision inference from filenames + lightweight colour/shape cues.
 * Swap this internals when wiring a real vision model.
 */
export async function inferPartKindFromPhotos(
  photos: PhotoHintInput[]
): Promise<PartInference> {
  const fromName = kindFromFilenames(photos);
  if (fromName) {
    return {
      kind: fromName,
      reason: `Filename cues matched “${PART_KIND_OPTIONS.find((o) => o.id === fromName)?.label ?? fromName}”.`,
      scoreStrength: 0.92,
    };
  }

  const samples = (
    await Promise.all(
      photos.slice(0, 4).map((p) => sampleImageSignals(p.previewUrl))
    )
  ).filter((s): s is ImageSignals => s != null);

  if (samples.length === 0) {
    return {
      kind: "air_filter",
      reason: "Could not read image pixels — defaulted to a common service part.",
      scoreStrength: 0.35,
    };
  }

  const n = samples.length;
  const avg = samples.reduce(
    (acc, s) => ({
      metallicShare: acc.metallicShare + s.metallicShare / n,
      copperShare: acc.copperShare + s.copperShare / n,
      darkFlatShare: acc.darkFlatShare + s.darkFlatShare / n,
      lightPleatShare: acc.lightPleatShare + s.lightPleatShare / n,
      blackPlasticShare: acc.blackPlasticShare + s.blackPlasticShare / n,
      connectorHueShare: acc.connectorHueShare + s.connectorHueShare / n,
      rubberShare: acc.rubberShare + s.rubberShare / n,
      yellowShare: acc.yellowShare + s.yellowShare / n,
      elongatedShare: acc.elongatedShare + s.elongatedShare / n,
      centerVsEdgeContrast: acc.centerVsEdgeContrast + s.centerVsEdgeContrast / n,
      circularityShare: acc.circularityShare + s.circularityShare / n,
      cylindricalShare: acc.cylindricalShare + s.cylindricalShare / n,
      flatPanelShare: acc.flatPanelShare + s.flatPanelShare / n,
    }),
    {
      metallicShare: 0,
      copperShare: 0,
      darkFlatShare: 0,
      lightPleatShare: 0,
      blackPlasticShare: 0,
      connectorHueShare: 0,
      rubberShare: 0,
      yellowShare: 0,
      elongatedShare: 0,
      centerVsEdgeContrast: 0,
      circularityShare: 0,
      cylindricalShare: 0,
      flatPanelShare: 0,
    }
  );

  const scores: Record<PartKind, number> = {
    // Round metal + spring / wax capsule contrast
    thermostat:
      avg.circularityShare * 2.1 +
      avg.metallicShare * 1.15 +
      avg.copperShare * 1.7 +
      avg.centerVsEdgeContrast * 1.35 -
      avg.flatPanelShare * 0.7 -
      avg.lightPleatShare * 0.35,
    // Flat rectangular friction faces
    brake_pads_front:
      avg.flatPanelShare * 1.45 +
      avg.darkFlatShare * 1.7 -
      avg.circularityShare * 0.85 -
      avg.cylindricalShare * 0.35 -
      avg.lightPleatShare * 0.4 -
      avg.connectorHueShare * 0.25,
    brake_pads_rear:
      avg.flatPanelShare * 1.25 +
      avg.darkFlatShare * 1.45 -
      avg.circularityShare * 0.75 -
      avg.metallicShare * 0.35 -
      avg.elongatedShare * 0.2,
    // Cylindrical metal can
    oil_filter:
      avg.cylindricalShare * 1.85 +
      avg.metallicShare * 1.15 +
      avg.blackPlasticShare * 0.25 -
      avg.circularityShare * 0.45 -
      avg.lightPleatShare * 0.45 -
      avg.flatPanelShare * 0.3,
    // Compact cylinder, often darker plastic / metal
    fuel_filter:
      avg.cylindricalShare * 1.55 +
      avg.blackPlasticShare * 0.85 +
      avg.metallicShare * 0.55 +
      avg.darkFlatShare * 0.35 -
      avg.circularityShare * 0.4 -
      avg.lightPleatShare * 0.4 -
      avg.flatPanelShare * 0.25,
    // Light pleated panel
    air_filter:
      avg.lightPleatShare * 1.85 +
      avg.flatPanelShare * 0.75 -
      avg.metallicShare * 0.5 -
      avg.circularityShare * 0.35 -
      avg.darkFlatShare * 0.25,
    cabin_filter:
      avg.lightPleatShare * 1.45 +
      avg.flatPanelShare * 0.6 -
      avg.metallicShare * 0.4 -
      avg.copperShare * 0.2,
    spark_plugs:
      avg.metallicShare * 0.7 +
      avg.copperShare * 0.55 +
      avg.centerVsEdgeContrast * 0.4 -
      avg.elongatedShare * 0.25 -
      avg.flatPanelShare * 0.25 -
      avg.lightPleatShare * 0.4,
    alternator:
      avg.metallicShare * 1.1 +
      avg.cylindricalShare * 0.65 +
      avg.darkFlatShare * 0.3 -
      avg.lightPleatShare * 0.5 -
      avg.circularityShare * 0.2,
    starter_motor:
      avg.metallicShare * 1.0 +
      avg.cylindricalShare * 0.55 +
      avg.darkFlatShare * 0.4 -
      avg.lightPleatShare * 0.45 -
      avg.yellowShare * 0.2,
    radiator:
      avg.elongatedShare * 1.35 +
      avg.flatPanelShare * 0.55 +
      avg.metallicShare * 0.5 +
      avg.blackPlasticShare * 0.3 -
      avg.circularityShare * 0.25,
    water_pump:
      avg.metallicShare * 1.1 +
      avg.circularityShare * 0.55 +
      avg.copperShare * 0.4 -
      avg.lightPleatShare * 0.4 -
      avg.yellowShare * 0.15,
    oxygen_sensor:
      avg.metallicShare * 0.9 +
      avg.blackPlasticShare * 0.5 +
      avg.connectorHueShare * 0.85 +
      avg.elongatedShare * 0.35 -
      avg.flatPanelShare * 0.3 -
      avg.lightPleatShare * 0.4,
    abs_sensor:
      avg.blackPlasticShare * 0.9 +
      avg.connectorHueShare * 0.75 +
      avg.metallicShare * 0.35 +
      avg.elongatedShare * 0.25 -
      avg.lightPleatShare * 0.35,
    temp_sensor:
      avg.metallicShare * 0.65 +
      avg.connectorHueShare * 0.9 +
      avg.copperShare * 0.35 -
      avg.elongatedShare * 0.2 -
      avg.flatPanelShare * 0.2,
    maf_sensor:
      avg.blackPlasticShare * 1.55 +
      avg.connectorHueShare * 1.4 +
      avg.flatPanelShare * 0.25 -
      avg.lightPleatShare * 0.3 -
      avg.copperShare * 0.2,
    wiper_blades:
      avg.rubberShare * 1.7 +
      avg.elongatedShare * 1.4 -
      avg.circularityShare * 0.4 -
      avg.lightPleatShare * 0.35 -
      avg.copperShare * 0.25,
    battery:
      avg.blackPlasticShare * 0.85 +
      avg.yellowShare * 1.55 +
      avg.flatPanelShare * 0.55 +
      avg.elongatedShare * 0.25 -
      avg.circularityShare * 0.3 -
      avg.copperShare * 0.15,
  };

  let best: PartKind = "cabin_filter";
  let bestScore = -Infinity;
  let second = -Infinity;
  for (const kind of Object.keys(scores) as PartKind[]) {
    const s = scores[kind];
    if (s > bestScore) {
      second = bestScore;
      bestScore = s;
      best = kind;
    } else if (s > second) {
      second = s;
    }
  }

  const margin = bestScore - second;
  const scoreStrength = Math.max(
    0.35,
    Math.min(0.95, 0.45 + bestScore * 0.35 + margin * 0.5)
  );

  return {
    kind: best,
    reason: MATCH_REASONS[best],
    scoreStrength,
  };
}

/**
 * Public identification entry point for Leafy Parts Finder.
 *
 * UI code should only call this function. Internals can swap from mock
 * vision to a real API (Grok Vision, etc.) without changing callers.
 */
export async function identifyPartFromImages(
  input: IdentifyPartInput
): Promise<PartIdentificationResult> {
  const partNumber =
    input.partNumber?.trim() || input.details.partNumber?.trim() || "";

  // ---------------------------------------------------------------------------
  // REAL AI HOOK (not wired yet)
  // ---------------------------------------------------------------------------
  // When ready, replace the mock call below with something like:
  //
  //   const apiResult = await fetch("/api/parts/identify", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       photoUrls: input.photos.map((p) => p.previewUrl),
  //       partNumberPhotoUrl: input.partNumberPhoto?.previewUrl,
  //       vehicle: input.details,
  //       partNumber,
  //       kindOverride: input.kindOverride,
  //     }),
  //   }).then((r) => r.json());
  //   return mapVisionApiToResult(apiResult, input.details, partNumber);
  //
  // Keep returning PartIdentificationResult so the page / cards stay unchanged.
  // ---------------------------------------------------------------------------

  return mockIdentifyPartFromImages({ ...input, partNumber });
}

/**
 * TEMPORARY MOCK PIPELINE — demo vision + OEM cues until real AI ships.
 * Do not call from UI; use `identifyPartFromImages` instead.
 */
async function mockIdentifyPartFromImages(
  input: IdentifyPartInput & { partNumber: string }
): Promise<PartIdentificationResult> {
  const { photos, details, kindOverride, partNumber, partNumberPhoto } = input;

  let inference: PartInference | null = null;
  let partNumberMatchedKind = false;
  let usedPartNumberPhoto = false;

  if (kindOverride) {
    inference = {
      kind: kindOverride,
      reason: "",
      scoreStrength: 0.9,
    };
  } else {
    const fromOem = partNumber
      ? kindFromPartNumber(partNumber, details.makeId)
      : null;

    if (fromOem) {
      partNumberMatchedKind = true;
      const label =
        PART_KIND_OPTIONS.find((o) => o.id === fromOem)?.label ?? fromOem;
      inference = {
        kind: fromOem,
        reason: `Part number “${formatUserPartNumber(partNumber)}” matched catalog cues for ${label}.`,
        scoreStrength: 0.94,
      };
    } else {
      let labelBoost = false;

      if (partNumberPhoto) {
        const cue = await inferFromPartNumberPhoto(
          partNumberPhoto,
          details.makeId
        );
        labelBoost = cue.labelBoost;
        if (cue.inference) {
          usedPartNumberPhoto = true;
          partNumberMatchedKind = true;
          inference = cue.inference;
        }
      }

      if (!inference) {
        // MOCK: main photos — filename + colour / shape scoring
        // Prefer part-number close-up first in the stack when present
        const visionPhotos = partNumberPhoto
          ? [partNumberPhoto, ...photos]
          : photos;
        inference = await inferPartKindFromPhotos(visionPhotos);
        if (partNumberPhoto) {
          usedPartNumberPhoto = true;
          inference = {
            ...inference,
            reason: labelBoost
              ? `${inference.reason} Your part-number close-up looked like a clear label plate and sharpened the match.`
              : `${inference.reason} Your part-number photo was included to improve the match.`,
            scoreStrength: Math.min(
              0.97,
              inference.scoreStrength + (labelBoost ? 0.1 : 0.06)
            ),
          };
        }
      }

      if (partNumber) {
        inference = {
          ...inference,
          reason: `${inference.reason} Typed part number “${formatUserPartNumber(partNumber)}” was kept for fitment.`,
          scoreStrength: Math.min(0.97, inference.scoreStrength + 0.06),
        };
      }
    }
  }

  if (!inference) {
    inference = await inferPartKindFromPhotos(photos);
  }

  const photoCount = photos.length + (partNumberPhoto ? 1 : 0);

  return buildPartIdentificationResult({
    details,
    photoCount,
    kind: inference.kind,
    inferReason: inference.reason,
    scoreStrength: inference.scoreStrength,
    overridden: Boolean(kindOverride),
    userPartNumber: partNumber,
    partNumberMatchedKind,
    usedPartNumberPhoto,
  });
}

/** Build identification result cards from inferred / overridden part kind. */
export function mockIdentifyPart(input: {
  details: VehicleDetails;
  photoCount: number;
  kind: PartKind;
  inferReason?: string;
  scoreStrength?: number;
  overridden?: boolean;
  userPartNumber?: string;
  partNumberMatchedKind?: boolean;
  usedPartNumberPhoto?: boolean;
}): PartIdentificationResult {
  return buildPartIdentificationResult(input);
}

function buildPartIdentificationResult(input: {
  details: VehicleDetails;
  photoCount: number;
  kind: PartKind;
  inferReason?: string;
  scoreStrength?: number;
  overridden?: boolean;
  userPartNumber?: string;
  partNumberMatchedKind?: boolean;
  usedPartNumberPhoto?: boolean;
}): PartIdentificationResult {
  const {
    details,
    photoCount,
    kind,
    inferReason,
    scoreStrength = 0.7,
    overridden = false,
    userPartNumber = "",
    partNumberMatchedKind = false,
    usedPartNumberPhoto = false,
  } = input;
  const template = PART_TEMPLATES[kind];
  const vehicleLabel = formatVehicleLabel(details);
  const makeLabel = details.makeId
    ? VEHICLE_CATALOG[details.makeId].label
    : "OEM";
  const catalogOem = oemForMake(details.makeId, kind);
  const oemFromUser = normalizePartNumber(userPartNumber).length >= 4;
  const oemNumber = oemFromUser
    ? formatUserPartNumber(userPartNumber)
    : catalogOem;

  const confidence = Math.min(
    97,
    Math.round(
      58 +
        scoreStrength * 28 +
        Math.min(photoCount, 5) * 4 +
        (details.vin.trim().length >= 11 ? 5 : 0) +
        (overridden ? 8 : 0) +
        (oemFromUser ? 6 : 0) +
        (partNumberMatchedKind ? 4 : 0) +
        (usedPartNumberPhoto ? 3 : 0)
    )
  );

  const displayName =
    PART_KIND_OPTIONS.find((o) => o.id === kind)?.label ?? template.name;

  let matchExplanation = overridden
    ? `You selected this part type manually for ${vehicleLabel}.`
    : (inferReason ?? MATCH_REASONS[kind]);

  if (overridden && oemFromUser) {
    matchExplanation = `You selected this part type manually for ${vehicleLabel}. Part number “${oemNumber}” is shown on the results.`;
  }

  const identified: IdentifiedPart = {
    id: `id-${kind}-${details.makeId || "gen"}-${normalizePartNumber(oemNumber) || "na"}`,
    name: displayName,
    oemNumber,
    oemFromUser,
    category: template.category,
    confidencePercent: confidence,
    summary: template.summary,
    matchExplanation,
    fitmentNote: oemFromUser
      ? `Matched to ${vehicleLabel}. Using your part number ${oemNumber} — confirm it against the vehicle before install.`
      : `Matched to ${vehicleLabel}. Cross-check OEM ${oemNumber} (or equivalent aftermarket) before install.`,
    kind,
  };

  const prices = pricesForConditions(template.basePrice);
  const shortName = template.name;

  const options: PartOption[] = [
    {
      id: `opt-recycled-${identified.id}`,
      condition: "recycled",
      name: shortName,
      description: `Recycled / used option for ${makeLabel} — tested take-back or breaker stock with the lowest footprint when condition is sound.`,
      price: prices.recycled,
      sustainabilityScore: 94,
      ecoRank: 3,
      badge: "Best eco choice",
      highlight: true,
      treesEstimate: treesForPrice(prices.recycled),
      amazonSearch: `${makeLabel} ${shortName} ${vehicleLabel}`,
    },
    {
      id: `opt-reman-${identified.id}`,
      condition: "remanufactured",
      name: shortName,
      description:
        "Remanufactured option — refurbished core with renewed wear parts. Strong eco balance and solid reliability.",
      price: prices.remanufactured,
      sustainabilityScore: 88,
      ecoRank: 2,
      badge: "Strong eco pick",
      highlight: false,
      treesEstimate: treesForPrice(prices.remanufactured),
      amazonSearch: `${makeLabel} ${shortName} remanufactured`,
    },
    {
      id: `opt-new-${identified.id}`,
      condition: "new",
      name: shortName,
      description:
        "Brand-new OEM-spec option — best when you want maximum lifespan and a full parts warranty.",
      price: prices.new,
      sustainabilityScore: 62,
      ecoRank: 1,
      badge: "Longest lifespan",
      highlight: false,
      treesEstimate: treesForPrice(prices.new),
      amazonSearch: `${makeLabel} ${shortName} OEM ${oemNumber}`,
    },
  ];

  options.sort((a, b) => b.ecoRank - a.ecoRank);

  return {
    identified,
    vehicleLabel,
    options,
    generatedAt: new Date().toISOString(),
  };
}

export const CONDITION_LABELS: Record<PartCondition, string> = {
  recycled: "Recycled / Used",
  remanufactured: "Remanufactured",
  new: "New",
};

export function partOptionToCartProduct(
  option: PartOption,
  identified: IdentifiedPart,
  vehicleLabel: string
): Product {
  const conditionLabel = CONDITION_LABELS[option.condition];
  return {
    id: `parts-${identified.oemNumber.replace(/\s/g, "")}-${option.condition}`,
    name: `${option.name} · ${conditionLabel}`,
    description: `${option.description} Vehicle: ${vehicleLabel}. OEM ref ${identified.oemNumber}. Condition: ${conditionLabel}.`,
    price: option.price,
    imageUrl:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#e8f0ea" width="160" height="160"/><text x="80" y="92" text-anchor="middle" font-size="42">🔧</text></svg>`
      ),
    category: "Auto Parts",
    sustainabilityScore: option.sustainabilityScore,
    affiliateCommissionPercent: 4,
    availabilityNote: `${conditionLabel} · qty 1 · confirm compatibility before install`,
  };
}
