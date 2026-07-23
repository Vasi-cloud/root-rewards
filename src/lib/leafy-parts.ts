/**
 * Leafy Parts Finder — vehicle part ID helpers + mock results (v1).
 * Photos stay on-device; identification is placeholder until a real vision API.
 */

import type { Product } from "@/types";

export type PartCondition = "recycled" | "remanufactured" | "new";

export type VehicleMakeId =
  | "toyota"
  | "honda"
  | "ford"
  | "chevrolet"
  | "nissan"
  | "hyundai"
  | "volkswagen"
  | "bmw"
  | "mercedes"
  | "mazda"
  | "subaru"
  | "kia"
  | "tesla"
  | "renault"
  | "peugeot"
  | "citroen"
  | "audi"
  | "skoda"
  | "seat"
  | "volvo"
  | "land-rover"
  | "jaguar"
  | "fiat"
  | "alfa-romeo"
  | "dacia";

export type VehicleDetails = {
  makeId: VehicleMakeId | "";
  modelId: string;
  year: string;
  vin: string;
};

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2026;

export type IdentifiedPart = {
  id: string;
  name: string;
  oemNumber: string;
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

export const VEHICLE_CATALOG: Record<
  VehicleMakeId,
  { label: string; models: { id: string; label: string }[] }
> = {
  toyota: {
    label: "Toyota",
    models: [
      { id: "corolla", label: "Corolla" },
      { id: "camry", label: "Camry" },
      { id: "rav4", label: "RAV4" },
      { id: "prius", label: "Prius" },
      { id: "highlander", label: "Highlander" },
      { id: "tacoma", label: "Tacoma" },
    ],
  },
  honda: {
    label: "Honda",
    models: [
      { id: "civic", label: "Civic" },
      { id: "accord", label: "Accord" },
      { id: "cr-v", label: "CR-V" },
      { id: "hr-v", label: "HR-V" },
      { id: "pilot", label: "Pilot" },
      { id: "fit", label: "Fit / Jazz" },
    ],
  },
  ford: {
    label: "Ford",
    models: [
      { id: "f-150", label: "F-150" },
      { id: "escape", label: "Escape / Kuga" },
      { id: "explorer", label: "Explorer" },
      { id: "focus", label: "Focus" },
      { id: "mustang", label: "Mustang" },
      { id: "bronco", label: "Bronco" },
    ],
  },
  chevrolet: {
    label: "Chevrolet",
    models: [
      { id: "silverado", label: "Silverado" },
      { id: "equinox", label: "Equinox" },
      { id: "malibu", label: "Malibu" },
      { id: "traverse", label: "Traverse" },
      { id: "bolt", label: "Bolt EV" },
      { id: "tahoe", label: "Tahoe" },
    ],
  },
  nissan: {
    label: "Nissan",
    models: [
      { id: "altima", label: "Altima" },
      { id: "rogue", label: "Rogue / X-Trail" },
      { id: "sentra", label: "Sentra" },
      { id: "pathfinder", label: "Pathfinder" },
      { id: "leaf", label: "Leaf" },
      { id: "frontier", label: "Frontier" },
    ],
  },
  hyundai: {
    label: "Hyundai",
    models: [
      { id: "tucson", label: "Tucson" },
      { id: "santa-fe", label: "Santa Fe" },
      { id: "elantra", label: "Elantra" },
      { id: "sonata", label: "Sonata" },
      { id: "ioniq-5", label: "Ioniq 5" },
      { id: "kona", label: "Kona" },
    ],
  },
  volkswagen: {
    label: "Volkswagen",
    models: [
      { id: "golf", label: "Golf" },
      { id: "tiguan", label: "Tiguan" },
      { id: "jetta", label: "Jetta" },
      { id: "passat", label: "Passat" },
      { id: "atlas", label: "Atlas" },
      { id: "id4", label: "ID.4" },
    ],
  },
  bmw: {
    label: "BMW",
    models: [
      { id: "3-series", label: "3 Series" },
      { id: "5-series", label: "5 Series" },
      { id: "x3", label: "X3" },
      { id: "x5", label: "X5" },
      { id: "i4", label: "i4" },
      { id: "x1", label: "X1" },
    ],
  },
  mercedes: {
    label: "Mercedes-Benz",
    models: [
      { id: "c-class", label: "C-Class" },
      { id: "e-class", label: "E-Class" },
      { id: "gla", label: "GLA" },
      { id: "glc", label: "GLC" },
      { id: "a-class", label: "A-Class" },
      { id: "eqb", label: "EQB" },
    ],
  },
  mazda: {
    label: "Mazda",
    models: [
      { id: "mazda3", label: "Mazda3" },
      { id: "mazda6", label: "Mazda6" },
      { id: "cx-5", label: "CX-5" },
      { id: "cx-30", label: "CX-30" },
      { id: "cx-50", label: "CX-50" },
      { id: "mx-5", label: "MX-5 Miata" },
    ],
  },
  subaru: {
    label: "Subaru",
    models: [
      { id: "outback", label: "Outback" },
      { id: "forester", label: "Forester" },
      { id: "crosstrek", label: "Crosstrek" },
      { id: "impreza", label: "Impreza" },
      { id: "ascent", label: "Ascent" },
      { id: "legacy", label: "Legacy" },
    ],
  },
  kia: {
    label: "Kia",
    models: [
      { id: "sportage", label: "Sportage" },
      { id: "sorento", label: "Sorento" },
      { id: "forte", label: "Forte / Cerato" },
      { id: "telluride", label: "Telluride" },
      { id: "ev6", label: "EV6" },
      { id: "soul", label: "Soul" },
    ],
  },
  tesla: {
    label: "Tesla",
    models: [
      { id: "model-3", label: "Model 3" },
      { id: "model-y", label: "Model Y" },
      { id: "model-s", label: "Model S" },
      { id: "model-x", label: "Model X" },
    ],
  },
  renault: {
    label: "Renault",
    models: [
      { id: "clio", label: "Clio" },
      { id: "twingo", label: "Twingo" },
      { id: "megane", label: "Megane" },
      { id: "scenic", label: "Scenic" },
      { id: "megane-scenic", label: "Megane Scenic" },
      { id: "captur", label: "Captur" },
      { id: "kadjar", label: "Kadjar" },
      { id: "arkana", label: "Arkana" },
      { id: "austral", label: "Austral" },
      { id: "koleos", label: "Koleos" },
      { id: "talisman", label: "Talisman" },
      { id: "zoe", label: "Zoe" },
    ],
  },
  peugeot: {
    label: "Peugeot",
    models: [
      { id: "208", label: "208" },
      { id: "308", label: "308" },
      { id: "2008", label: "2008" },
      { id: "3008", label: "3008" },
      { id: "5008", label: "5008" },
      { id: "508", label: "508" },
      { id: "e-208", label: "e-208" },
    ],
  },
  citroen: {
    label: "Citroën",
    models: [
      { id: "c3", label: "C3" },
      { id: "c4", label: "C4" },
      { id: "c5-aircross", label: "C5 Aircross" },
      { id: "berlingo", label: "Berlingo" },
      { id: "c3-aircross", label: "C3 Aircross" },
      { id: "ami", label: "Ami" },
    ],
  },
  audi: {
    label: "Audi",
    models: [
      { id: "a3", label: "A3" },
      { id: "a4", label: "A4" },
      { id: "a6", label: "A6" },
      { id: "q3", label: "Q3" },
      { id: "q5", label: "Q5" },
      { id: "q7", label: "Q7" },
      { id: "e-tron", label: "Q4 e-tron" },
    ],
  },
  skoda: {
    label: "Škoda",
    models: [
      { id: "octavia", label: "Octavia" },
      { id: "fabia", label: "Fabia" },
      { id: "superb", label: "Superb" },
      { id: "kodiaq", label: "Kodiaq" },
      { id: "karoq", label: "Karoq" },
      { id: "enyaq", label: "Enyaq" },
    ],
  },
  seat: {
    label: "SEAT",
    models: [
      { id: "ibiza", label: "Ibiza" },
      { id: "leon", label: "León" },
      { id: "ateca", label: "Ateca" },
      { id: "arona", label: "Arona" },
      { id: "tarraco", label: "Tarraco" },
      { id: "born", label: "Born" },
    ],
  },
  volvo: {
    label: "Volvo",
    models: [
      { id: "xc40", label: "XC40" },
      { id: "xc60", label: "XC60" },
      { id: "xc90", label: "XC90" },
      { id: "v60", label: "V60" },
      { id: "s60", label: "S60" },
      { id: "c40", label: "C40 Recharge" },
    ],
  },
  "land-rover": {
    label: "Land Rover",
    models: [
      { id: "defender", label: "Defender" },
      { id: "discovery", label: "Discovery" },
      { id: "discovery-sport", label: "Discovery Sport" },
      { id: "range-rover", label: "Range Rover" },
      { id: "range-rover-sport", label: "Range Rover Sport" },
      { id: "range-rover-evoque", label: "Range Rover Evoque" },
    ],
  },
  jaguar: {
    label: "Jaguar",
    models: [
      { id: "xe", label: "XE" },
      { id: "xf", label: "XF" },
      { id: "f-pace", label: "F-PACE" },
      { id: "e-pace", label: "E-PACE" },
      { id: "i-pace", label: "I-PACE" },
      { id: "f-type", label: "F-TYPE" },
    ],
  },
  fiat: {
    label: "Fiat",
    models: [
      { id: "500", label: "500" },
      { id: "500x", label: "500X" },
      { id: "panda", label: "Panda" },
      { id: "tipo", label: "Tipo" },
      { id: "punto", label: "Punto" },
      { id: "doblo", label: "Doblo" },
    ],
  },
  "alfa-romeo": {
    label: "Alfa Romeo",
    models: [
      { id: "giulia", label: "Giulia" },
      { id: "stelvio", label: "Stelvio" },
      { id: "tonale", label: "Tonale" },
      { id: "giulietta", label: "Giulietta" },
      { id: "mito", label: "MiTo" },
      { id: "junior", label: "Junior" },
    ],
  },
  dacia: {
    label: "Dacia",
    models: [
      { id: "sandero", label: "Sandero" },
      { id: "duster", label: "Duster" },
      { id: "jogger", label: "Jogger" },
      { id: "spring", label: "Spring" },
      { id: "logan", label: "Logan" },
      { id: "bigster", label: "Bigster" },
    ],
  },
};

/** Newest → oldest, inclusive (2000–2026). */
export const YEAR_OPTIONS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => String(YEAR_MAX - i)
);

/** Stable A–Z order for Make dropdown. */
export const VEHICLE_MAKE_IDS = (
  Object.keys(VEHICLE_CATALOG) as VehicleMakeId[]
).sort((a, b) =>
  VEHICLE_CATALOG[a].label.localeCompare(VEHICLE_CATALOG[b].label)
);

export const PARTS_AI_DISCLAIMER =
  "Leafy’s photo identification is helpful but not 100% accurate. Always double-check part numbers and vehicle compatibility before ordering.";

export const PARTS_COMPAT_DISCLAIMER =
  "Confirm fitment with your VIN, OEM number, or a trusted mechanic — especially for safety-critical parts like brakes and steering.";

export const PARTS_MOCK_AI_NOTE =
  "This is currently mock AI for demonstration. Real vision AI will be connected later — you can override the part type anytime.";

export type PartKind =
  | "thermostat"
  | "brake_pads"
  | "air_filter"
  | "cabin_filter"
  | "alternator"
  | "oxygen_sensor"
  | "maf_sensor";

export const PART_KIND_OPTIONS: { id: PartKind; label: string }[] = [
  { id: "thermostat", label: "Thermostat / Coolant thermostat" },
  { id: "brake_pads", label: "Front brake pad set" },
  { id: "air_filter", label: "Engine air filter" },
  { id: "cabin_filter", label: "Cabin pollen filter" },
  { id: "alternator", label: "Alternator assembly" },
  { id: "oxygen_sensor", label: "Oxygen / lambda sensor" },
  { id: "maf_sensor", label: "MAF / air-flow sensor" },
];

export type PhotoHintInput = {
  previewUrl: string;
  name: string;
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
      "Round metal thermostat housing with a central wax-pellet / spring assembly — matches the circular metal part in your photos. Controls coolant flow to the radiator.",
    basePrice: 34,
    defaultOem: "82 00 277 070",
  },
  brake_pads: {
    kind: "brake_pads",
    name: "Front brake pad set",
    category: "Brakes",
    summary:
      "Flat friction pads with backing plates — shape and wear pattern match a front brake pad set.",
    basePrice: 48,
    defaultOem: "77 01 207 822",
  },
  air_filter: {
    kind: "air_filter",
    name: "Engine air filter",
    category: "Filters",
    summary:
      "Panel air filter with pleated media and foam end seals — typical engine intake filter cartridge.",
    basePrice: 22,
    defaultOem: "82 00 432 179",
  },
  cabin_filter: {
    kind: "cabin_filter",
    name: "Cabin pollen filter",
    category: "Filters",
    summary:
      "Cabin / pollen filter cartridge — size and layered media cues match HVAC cabin filters.",
    basePrice: 19,
    defaultOem: "27 27 7 508 237",
  },
  alternator: {
    kind: "alternator",
    name: "Alternator assembly",
    category: "Electrical",
    summary:
      "Cylindrical alternator housing with pulley — reman-friendly electrical charging unit.",
    basePrice: 189,
    defaultOem: "77 11 135 588",
  },
  oxygen_sensor: {
    kind: "oxygen_sensor",
    name: "Oxygen / lambda sensor",
    category: "Sensors",
    summary:
      "Threaded probe-style sensor with a wiring pigtail — typical oxygen (lambda) sensor used in the exhaust.",
    basePrice: 56,
    defaultOem: "77 00 107 095",
  },
  maf_sensor: {
    kind: "maf_sensor",
    name: "MAF / air-flow sensor",
    category: "Sensors",
    summary:
      "Plastic sensor housing with an electrical connector — mass air-flow style unit for the intake tract.",
    basePrice: 78,
    defaultOem: "82 00 041 644",
  },
};

/** Plausible OEM-style refs per make for common parts (mock / demo). */
const OEM_BY_MAKE: Partial<
  Record<VehicleMakeId, Partial<Record<PartKind, string>>>
> = {
  renault: {
    thermostat: "82 00 277 070",
    brake_pads: "41 06 085 79R",
    air_filter: "82 00 432 179",
    cabin_filter: "27 27 7 508 237",
    alternator: "77 11 135 588",
    oxygen_sensor: "77 00 107 095",
    maf_sensor: "82 00 041 644",
  },
  peugeot: {
    thermostat: "1338.A6",
    brake_pads: "4254.22",
    air_filter: "1444.TJ",
    oxygen_sensor: "1628.KR",
    maf_sensor: "1920.GW",
  },
  citroen: {
    thermostat: "1338.A6",
    brake_pads: "4254.22",
    oxygen_sensor: "1628.KR",
  },
  volkswagen: {
    thermostat: "03C 121 111",
    brake_pads: "1K0 698 151",
    air_filter: "1K0 129 620",
    oxygen_sensor: "03G 906 262",
    maf_sensor: "06A 906 461",
  },
  audi: {
    thermostat: "06A 121 111",
    brake_pads: "8E0 698 151",
    oxygen_sensor: "06A 906 262",
  },
  ford: {
    thermostat: "1 339 017",
    brake_pads: "1 787 511",
    oxygen_sensor: "1 748 860",
  },
  toyota: {
    thermostat: "90916-03100",
    brake_pads: "04465-0R090",
    air_filter: "17801-0V020",
    oxygen_sensor: "89465-0D090",
  },
  honda: {
    thermostat: "19301-PAA-A01",
    brake_pads: "45022-S5A-J00",
    oxygen_sensor: "36531-PAA-A01",
  },
  bmw: {
    thermostat: "11 53 7 547 415",
    brake_pads: "34 11 6 857 827",
    oxygen_sensor: "11 78 7 566 347",
  },
};

function treesForPrice(price: number): number {
  if (price <= 0) return 1;
  return Math.max(1, Math.min(8, Math.floor(price / 28) || 1));
}

function oemForMake(makeId: VehicleMakeId | "", kind: PartKind): string {
  if (makeId && OEM_BY_MAKE[makeId]?.[kind]) {
    return OEM_BY_MAKE[makeId]![kind]!;
  }
  return PART_TEMPLATES[kind].defaultOem;
}

function kindFromFilenames(photos: PhotoHintInput[]): PartKind | null {
  const blob = photos.map((p) => p.name).join(" ").toLowerCase();
  if (/thermo|coolant|wax.?pellet/.test(blob)) return "thermostat";
  if (/brake|pad|plaquette/.test(blob)) return "brake_pads";
  if (/cabin|pollen|habitacle/.test(blob)) return "cabin_filter";
  if (/maf|mass.?air|air.?flow/.test(blob)) return "maf_sensor";
  if (/o2|oxygen|lambda|sonde/.test(blob)) return "oxygen_sensor";
  if (/air.?filter|filtre.?air/.test(blob)) return "air_filter";
  if (/alternat|dynamo/.test(blob)) return "alternator";
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
    let centerLum = 0;
    let edgeLum = 0;
    let centerN = 0;
    let edgeN = 0;
    const total = size * size;

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
        const dx = x - size / 2;
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isCenter = dist < size * 0.28;
        const isEdge = dist > size * 0.38;

        if (isCenter) {
          centerLum += lum;
          centerN++;
        } else if (isEdge) {
          edgeLum += lum;
          edgeN++;
        }

        // Silver / steel thermostat body
        if (sat < 0.18 && lum > 85 && lum < 210 && Math.abs(r - g) < 22) {
          metallic++;
        }
        // Brass / copper flange tones common on thermostats
        if (r > 120 && r > g + 15 && g > b + 5 && lum > 70 && lum < 200) {
          copper++;
        }
        // Dark flat brake-pad like surface
        if (lum < 70 && sat < 0.25) {
          darkFlat++;
        }
        // Light paper / filter media
        if (lum > 170 && sat < 0.2) {
          lightPleat++;
        }
        // Matte black plastic housings (MAF / sensors)
        if (lum < 55 && sat < 0.2) {
          blackPlastic++;
        }
        // Coloured connector plastics (blue / green / teal)
        if (sat > 0.25 && lum > 40 && lum < 180 && (b > r + 20 || g > r + 15)) {
          connectorHue++;
        }
      }
    }

    return {
      metallicShare: metallic / total,
      copperShare: copper / total,
      darkFlatShare: darkFlat / total,
      lightPleatShare: lightPleat / total,
      blackPlasticShare: blackPlastic / total,
      connectorHueShare: connectorHue / total,
      centerVsEdgeContrast:
        centerN && edgeN
          ? Math.abs(centerLum / centerN - edgeLum / edgeN) / 255
          : 0,
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
  brake_pads:
    "Dark, flat friction surfaces with low shine — typical brake pad faces.",
  air_filter:
    "Light pleated media and soft edges — typical engine air filter.",
  cabin_filter:
    "Light layered filter media in a compact cartridge — cabin / pollen filter.",
  alternator:
    "Dense metal housing with cylindrical mass — alternator-style assembly.",
  oxygen_sensor:
    "Probe-like metal tip with wiring cues — oxygen / lambda sensor.",
  maf_sensor:
    "Dark plastic housing with connector colour — mass air-flow sensor.",
};

/**
 * Infer part kind from filenames + lightweight colour/shape cues in photos.
 * Scores common parts (thermostat, pads, filters, sensors, alternator).
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

  const avg = samples.reduce(
    (acc, s) => ({
      metallicShare: acc.metallicShare + s.metallicShare / samples.length,
      copperShare: acc.copperShare + s.copperShare / samples.length,
      darkFlatShare: acc.darkFlatShare + s.darkFlatShare / samples.length,
      lightPleatShare: acc.lightPleatShare + s.lightPleatShare / samples.length,
      blackPlasticShare:
        acc.blackPlasticShare + s.blackPlasticShare / samples.length,
      connectorHueShare:
        acc.connectorHueShare + s.connectorHueShare / samples.length,
      centerVsEdgeContrast:
        acc.centerVsEdgeContrast + s.centerVsEdgeContrast / samples.length,
    }),
    {
      metallicShare: 0,
      copperShare: 0,
      darkFlatShare: 0,
      lightPleatShare: 0,
      blackPlasticShare: 0,
      connectorHueShare: 0,
      centerVsEdgeContrast: 0,
    }
  );

  const scores: Record<PartKind, number> = {
    thermostat:
      avg.metallicShare * 1.5 +
      avg.copperShare * 2.0 +
      avg.centerVsEdgeContrast * 1.4 -
      avg.darkFlatShare * 0.5 -
      avg.lightPleatShare * 0.3,
    brake_pads:
      avg.darkFlatShare * 1.8 -
      avg.metallicShare * 0.6 -
      avg.lightPleatShare * 0.4 -
      avg.connectorHueShare * 0.3,
    air_filter:
      avg.lightPleatShare * 1.9 -
      avg.metallicShare * 0.5 -
      avg.darkFlatShare * 0.3,
    cabin_filter:
      avg.lightPleatShare * 1.5 -
      avg.metallicShare * 0.4 -
      avg.copperShare * 0.2,
    alternator:
      avg.metallicShare * 1.1 +
      avg.darkFlatShare * 0.4 -
      avg.lightPleatShare * 0.5 -
      avg.copperShare * 0.2,
    oxygen_sensor:
      avg.metallicShare * 0.9 +
      avg.blackPlasticShare * 0.6 +
      avg.connectorHueShare * 0.8 -
      avg.lightPleatShare * 0.4,
    maf_sensor:
      avg.blackPlasticShare * 1.6 +
      avg.connectorHueShare * 1.4 -
      avg.lightPleatShare * 0.3 -
      avg.copperShare * 0.2,
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

export function formatVehicleLabel(details: VehicleDetails): string {
  if (!details.makeId) return "your vehicle";
  const make = VEHICLE_CATALOG[details.makeId];
  const model =
    make.models.find((m) => m.id === details.modelId)?.label ?? "model";
  const year = details.year || "year";
  return `${year} ${make.label} ${model}`;
}

export function modelsForMake(makeId: VehicleMakeId | ""): {
  id: string;
  label: string;
}[] {
  if (!makeId) return [];
  return VEHICLE_CATALOG[makeId].models;
}

/** Build mock identification from vehicle + inferred part kind (photo-aware). */
export function mockIdentifyPart(input: {
  details: VehicleDetails;
  photoCount: number;
  kind: PartKind;
  inferReason?: string;
  scoreStrength?: number;
  overridden?: boolean;
}): PartIdentificationResult {
  const {
    details,
    photoCount,
    kind,
    inferReason,
    scoreStrength = 0.7,
    overridden = false,
  } = input;
  const template = PART_TEMPLATES[kind];
  const vehicleLabel = formatVehicleLabel(details);
  const makeLabel = details.makeId
    ? VEHICLE_CATALOG[details.makeId].label
    : "OEM";
  const oemNumber = oemForMake(details.makeId, kind);

  const confidence = Math.min(
    97,
    Math.round(
      58 +
        scoreStrength * 28 +
        photoCount * 4 +
        (details.vin.trim().length >= 11 ? 5 : 0) +
        (overridden ? 8 : 0)
    )
  );

  const displayName =
    PART_KIND_OPTIONS.find((o) => o.id === kind)?.label ?? template.name;

  const matchExplanation = overridden
    ? `You selected this part type manually for ${vehicleLabel}.`
    : (inferReason ?? MATCH_REASONS[kind]);

  const identified: IdentifiedPart = {
    id: `id-${kind}-${details.makeId || "gen"}-${oemNumber.replace(/\s/g, "")}`,
    name: displayName,
    oemNumber,
    category: template.category,
    confidencePercent: confidence,
    summary: template.summary,
    matchExplanation,
    fitmentNote: `Matched to ${vehicleLabel}. Cross-check OEM ${oemNumber} (or equivalent aftermarket) before install.`,
    kind,
  };

  const basePrice = template.basePrice;
  const recycledPrice = Math.round(basePrice * 0.55 * 100) / 100;
  const remanPrice = Math.round(basePrice * 0.78 * 100) / 100;
  const newPrice = Math.round(basePrice * 1.12 * 100) / 100;

  const shortName = template.name;

  const options: PartOption[] = [
    {
      id: `opt-recycled-${identified.id}`,
      condition: "recycled",
      name: shortName,
      description: `Recycled / used option for ${makeLabel} — tested take-back part with the lowest footprint when condition is sound.`,
      price: recycledPrice,
      sustainabilityScore: 94,
      ecoRank: 3,
      badge: "Best eco choice",
      highlight: true,
      treesEstimate: treesForPrice(recycledPrice),
      amazonSearch: `${makeLabel} ${shortName} ${vehicleLabel}`,
    },
    {
      id: `opt-reman-${identified.id}`,
      condition: "remanufactured",
      name: shortName,
      description:
        "Remanufactured option — refurbished core with renewed wear parts. Strong eco balance and solid reliability.",
      price: remanPrice,
      sustainabilityScore: 88,
      ecoRank: 2,
      badge: "Strong eco pick",
      highlight: false,
      treesEstimate: treesForPrice(remanPrice),
      amazonSearch: `${makeLabel} ${shortName} remanufactured`,
    },
    {
      id: `opt-new-${identified.id}`,
      condition: "new",
      name: shortName,
      description:
        "Brand-new OEM-spec option — best when you want maximum lifespan and a full parts warranty.",
      price: newPrice,
      sustainabilityScore: 62,
      ecoRank: 1,
      badge: "Longest lifespan",
      highlight: false,
      treesEstimate: treesForPrice(newPrice),
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
