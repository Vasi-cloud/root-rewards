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
  | "battery";

export const PART_KIND_OPTIONS: { id: PartKind; label: string }[] = [
  { id: "thermostat", label: "Thermostat / Coolant thermostat" },
  { id: "brake_pads_front", label: "Brake pads (front)" },
  { id: "brake_pads_rear", label: "Brake pads (rear)" },
  { id: "oil_filter", label: "Oil filter" },
  { id: "air_filter", label: "Engine air filter" },
  { id: "cabin_filter", label: "Cabin / pollen filter" },
  { id: "spark_plugs", label: "Spark plugs" },
  { id: "alternator", label: "Alternator" },
  { id: "starter_motor", label: "Starter motor" },
  { id: "radiator", label: "Radiator" },
  { id: "water_pump", label: "Water pump" },
  { id: "oxygen_sensor", label: "Oxygen / lambda sensor" },
  { id: "abs_sensor", label: "ABS wheel-speed sensor" },
  { id: "temp_sensor", label: "Coolant temperature sensor" },
  { id: "maf_sensor", label: "MAF / air-flow sensor" },
  { id: "wiper_blades", label: "Wiper blades" },
  { id: "battery", label: "Car battery" },
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
      "Round metal thermostat with a central wax-pellet / spring assembly — controls coolant flow to the radiator.",
    basePrice: 34,
    defaultOem: "82 00 277 070",
  },
  brake_pads_front: {
    kind: "brake_pads_front",
    name: "Front brake pad set",
    category: "Brakes",
    summary:
      "Flat friction pads with backing plates — typical front axle brake pad set.",
    basePrice: 48,
    defaultOem: "77 01 207 822",
  },
  brake_pads_rear: {
    kind: "brake_pads_rear",
    name: "Rear brake pad set",
    category: "Brakes",
    summary:
      "Compact flat friction pads — typical rear axle brake pad set (often smaller than front).",
    basePrice: 42,
    defaultOem: "77 01 208 114",
  },
  oil_filter: {
    kind: "oil_filter",
    name: "Oil filter",
    category: "Filters",
    summary:
      "Cylindrical spin-on or cartridge oil filter — common service item for oil changes.",
    basePrice: 14,
    defaultOem: "82 00 432 598",
  },
  air_filter: {
    kind: "air_filter",
    name: "Engine air filter",
    category: "Filters",
    summary:
      "Panel air filter with pleated media and foam end seals — engine intake filter cartridge.",
    basePrice: 22,
    defaultOem: "82 00 432 179",
  },
  cabin_filter: {
    kind: "cabin_filter",
    name: "Cabin pollen filter",
    category: "Filters",
    summary:
      "Cabin / pollen filter cartridge — layered media for HVAC air quality.",
    basePrice: 19,
    defaultOem: "27 27 7 508 237",
  },
  spark_plugs: {
    kind: "spark_plugs",
    name: "Spark plugs (set)",
    category: "Ignition",
    summary:
      "Threaded ceramic/metal spark plugs — ignition tips for petrol engines.",
    basePrice: 28,
    defaultOem: "77 00 274 175",
  },
  alternator: {
    kind: "alternator",
    name: "Alternator",
    category: "Electrical",
    summary:
      "Cylindrical alternator housing with pulley — charging unit for the battery.",
    basePrice: 189,
    defaultOem: "77 11 135 588",
  },
  starter_motor: {
    kind: "starter_motor",
    name: "Starter motor",
    category: "Electrical",
    summary:
      "Compact cylindrical starter with gear nose — engages the flywheel to crank the engine.",
    basePrice: 165,
    defaultOem: "77 11 135 902",
  },
  radiator: {
    kind: "radiator",
    name: "Radiator",
    category: "Cooling",
    summary:
      "Large finned cooling core with plastic end tanks — engine coolant radiator.",
    basePrice: 145,
    defaultOem: "82 00 041 218",
  },
  water_pump: {
    kind: "water_pump",
    name: "Water pump",
    category: "Cooling",
    summary:
      "Metal pump body with impeller / pulley flange — circulates engine coolant.",
    basePrice: 72,
    defaultOem: "77 01 474 714",
  },
  oxygen_sensor: {
    kind: "oxygen_sensor",
    name: "Oxygen / lambda sensor",
    category: "Sensors",
    summary:
      "Threaded probe-style sensor with a wiring pigtail — exhaust oxygen (lambda) sensor.",
    basePrice: 56,
    defaultOem: "77 00 107 095",
  },
  abs_sensor: {
    kind: "abs_sensor",
    name: "ABS wheel-speed sensor",
    category: "Sensors",
    summary:
      "Slim sensor with mounting tab and harness — ABS / wheel-speed pickup.",
    basePrice: 38,
    defaultOem: "47 91 015 57R",
  },
  temp_sensor: {
    kind: "temp_sensor",
    name: "Coolant temperature sensor",
    category: "Sensors",
    summary:
      "Small threaded sensor with electrical connector — coolant temperature sender.",
    basePrice: 24,
    defaultOem: "82 00 167 288",
  },
  maf_sensor: {
    kind: "maf_sensor",
    name: "MAF / air-flow sensor",
    category: "Sensors",
    summary:
      "Plastic sensor housing with an electrical connector — mass air-flow unit.",
    basePrice: 78,
    defaultOem: "82 00 041 644",
  },
  wiper_blades: {
    kind: "wiper_blades",
    name: "Wiper blades",
    category: "Body",
    summary:
      "Long rubber wiping edge on a metal / plastic frame — windscreen wiper blades.",
    basePrice: 26,
    defaultOem: "28 89 015 58R",
  },
  battery: {
    kind: "battery",
    name: "Car battery",
    category: "Electrical",
    summary:
      "Rectangular case with top terminals — 12V lead-acid or AGM starter battery.",
    basePrice: 110,
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
    oil_filter: "1109.AK",
    air_filter: "1444.TJ",
    oxygen_sensor: "1628.KR",
    maf_sensor: "1920.GW",
  },
  citroen: {
    thermostat: "1338.A6",
    brake_pads_front: "4254.22",
    oxygen_sensor: "1628.KR",
  },
  volkswagen: {
    thermostat: "03C 121 111",
    brake_pads_front: "1K0 698 151",
    air_filter: "1K0 129 620",
    oil_filter: "03C 115 561",
    oxygen_sensor: "03G 906 262",
    maf_sensor: "06A 906 461",
  },
  audi: {
    thermostat: "06A 121 111",
    brake_pads_front: "8E0 698 151",
    oxygen_sensor: "06A 906 262",
  },
  ford: {
    thermostat: "1 339 017",
    brake_pads_front: "1 787 511",
    oxygen_sensor: "1 748 860",
    oil_filter: "1 719 437",
  },
  toyota: {
    thermostat: "90916-03100",
    brake_pads_front: "04465-0R090",
    air_filter: "17801-0V020",
    oil_filter: "90915-YZZD4",
    oxygen_sensor: "89465-0D090",
  },
  honda: {
    thermostat: "19301-PAA-A01",
    brake_pads_front: "45022-S5A-J00",
    oxygen_sensor: "36531-PAA-A01",
    oil_filter: "15400-PLM-A02",
  },
  bmw: {
    thermostat: "11 53 7 547 415",
    brake_pads_front: "34 11 6 857 827",
    oxygen_sensor: "11 78 7 566 347",
    oil_filter: "11 42 7 566 327",
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
  if (/thermo|wax.?pellet/.test(blob)) return "thermostat";
  if (/rear.*brake|brake.*rear|plaquette.?arriere/.test(blob))
    return "brake_pads_rear";
  if (/front.*brake|brake.*front|brake|pad|plaquette/.test(blob))
    return "brake_pads_front";
  if (/oil.?filter|filtre.?huile/.test(blob)) return "oil_filter";
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
      }
    }

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
  brake_pads_front:
    "Dark, flat friction surfaces — typical front brake pad faces.",
  brake_pads_rear:
    "Compact dark flat pads — typical rear brake pad set.",
  oil_filter:
    "Compact cylindrical metal can — typical spin-on oil filter.",
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
    }
  );

  const scores: Record<PartKind, number> = {
    thermostat:
      avg.metallicShare * 1.5 +
      avg.copperShare * 2.1 +
      avg.centerVsEdgeContrast * 1.5 -
      avg.darkFlatShare * 0.5 -
      avg.lightPleatShare * 0.35,
    brake_pads_front:
      avg.darkFlatShare * 1.9 -
      avg.metallicShare * 0.55 -
      avg.lightPleatShare * 0.4 -
      avg.connectorHueShare * 0.3,
    brake_pads_rear:
      avg.darkFlatShare * 1.55 -
      avg.metallicShare * 0.5 -
      avg.lightPleatShare * 0.35 -
      avg.elongatedShare * 0.2,
    oil_filter:
      avg.metallicShare * 1.05 +
      avg.blackPlasticShare * 0.35 -
      avg.lightPleatShare * 0.45 -
      avg.elongatedShare * 0.25,
    air_filter:
      avg.lightPleatShare * 2.0 -
      avg.metallicShare * 0.5 -
      avg.darkFlatShare * 0.3,
    cabin_filter:
      avg.lightPleatShare * 1.55 -
      avg.metallicShare * 0.4 -
      avg.copperShare * 0.2,
    spark_plugs:
      avg.metallicShare * 0.7 +
      avg.copperShare * 0.55 +
      avg.centerVsEdgeContrast * 0.4 -
      avg.elongatedShare * 0.3 -
      avg.lightPleatShare * 0.4,
    alternator:
      avg.metallicShare * 1.15 +
      avg.darkFlatShare * 0.35 -
      avg.lightPleatShare * 0.5 -
      avg.copperShare * 0.15,
    starter_motor:
      avg.metallicShare * 1.05 +
      avg.darkFlatShare * 0.45 -
      avg.lightPleatShare * 0.45 -
      avg.yellowShare * 0.2,
    radiator:
      avg.elongatedShare * 1.4 +
      avg.metallicShare * 0.55 +
      avg.blackPlasticShare * 0.35 -
      avg.copperShare * 0.15,
    water_pump:
      avg.metallicShare * 1.2 +
      avg.copperShare * 0.45 -
      avg.lightPleatShare * 0.4 -
      avg.yellowShare * 0.15,
    oxygen_sensor:
      avg.metallicShare * 0.95 +
      avg.blackPlasticShare * 0.55 +
      avg.connectorHueShare * 0.85 -
      avg.lightPleatShare * 0.4,
    abs_sensor:
      avg.blackPlasticShare * 0.9 +
      avg.connectorHueShare * 0.75 +
      avg.metallicShare * 0.35 -
      avg.lightPleatShare * 0.35,
    temp_sensor:
      avg.metallicShare * 0.65 +
      avg.connectorHueShare * 0.9 +
      avg.copperShare * 0.35 -
      avg.elongatedShare * 0.25,
    maf_sensor:
      avg.blackPlasticShare * 1.65 +
      avg.connectorHueShare * 1.45 -
      avg.lightPleatShare * 0.3 -
      avg.copperShare * 0.2,
    wiper_blades:
      avg.rubberShare * 1.7 +
      avg.elongatedShare * 1.35 -
      avg.lightPleatShare * 0.35 -
      avg.copperShare * 0.25,
    battery:
      avg.blackPlasticShare * 0.9 +
      avg.yellowShare * 1.6 +
      avg.elongatedShare * 0.35 -
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
 * Today this runs the mock vision pipeline. Later, swap the body to call a
 * real vision API and map the response into PartIdentificationResult —
 * keep the same function signature so the UI does not need to change.
 */
export async function identifyPartFromImages(input: {
  photos: PhotoHintInput[];
  details: VehicleDetails;
  /** When set, skip vision and build results for this part type */
  kindOverride?: PartKind;
}): Promise<PartIdentificationResult> {
  const { photos, details, kindOverride } = input;

  // --- Future: replace this block with a real vision API call ---
  // const apiResult = await fetch('/api/parts/identify', { ... })
  // return mapVisionApiToResult(apiResult, details)
  const inference = kindOverride
    ? {
        kind: kindOverride,
        reason: "",
        scoreStrength: 0.9,
      }
    : await inferPartKindFromPhotos(photos);

  return mockIdentifyPart({
    details,
    photoCount: photos.length,
    kind: inference.kind,
    inferReason: inference.reason,
    scoreStrength: inference.scoreStrength,
    overridden: Boolean(kindOverride),
  });
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
