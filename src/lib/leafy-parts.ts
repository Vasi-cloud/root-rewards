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
  fitmentNote: string;
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

const MOCK_PART_TEMPLATES: Omit<
  IdentifiedPart,
  "id" | "confidencePercent" | "fitmentNote"
>[] = [
  {
    name: "Front brake pad set",
    oemNumber: "04465-0R090",
    category: "Brakes",
    summary:
      "Ceramic-style front pad set matching the wear pattern and backing plate shape in your photos.",
  },
  {
    name: "Engine air filter",
    oemNumber: "17801-0V020",
    category: "Filters",
    summary:
      "Panel air filter with the same pleat count and end-seal profile visible in your snaps.",
  },
  {
    name: "Cabin pollen filter",
    oemNumber: "87139-YZZ20",
    category: "Filters",
    summary:
      "Cabin filter cartridge — size and carbon layer cues match common OEM replacements.",
  },
  {
    name: "Alternator assembly",
    oemNumber: "27060-0R040",
    category: "Electrical",
    summary:
      "Reman-friendly alternator housing and pulley orientation consistent with your images.",
  },
];

function treesForPrice(price: number): number {
  if (price <= 0) return 1;
  return Math.max(1, Math.min(8, Math.floor(price / 28) || 1));
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

/** Deterministic mock ID from vehicle + photo count (feels consistent on re-submit). */
export function mockIdentifyPart(input: {
  details: VehicleDetails;
  photoCount: number;
}): PartIdentificationResult {
  const { details, photoCount } = input;
  const seed =
    (details.makeId?.length ?? 0) +
    (details.modelId?.length ?? 0) +
    Number(details.year || 0) +
    photoCount * 3 +
    (details.vin.trim().length > 0 ? 5 : 0);

  const template = MOCK_PART_TEMPLATES[seed % MOCK_PART_TEMPLATES.length];
  const vehicleLabel = formatVehicleLabel(details);
  const makeLabel = details.makeId
    ? VEHICLE_CATALOG[details.makeId].label
    : "OEM";

  const confidence = Math.min(
    94,
    72 + photoCount * 4 + (details.vin.trim().length >= 11 ? 6 : 0)
  );

  const identified: IdentifiedPart = {
    id: `id-${template.oemNumber}-${seed}`,
    name: template.name,
    oemNumber: template.oemNumber,
    category: template.category,
    confidencePercent: confidence,
    summary: template.summary,
    fitmentNote: `Likely fit for ${vehicleLabel}. Cross-check OEM ${template.oemNumber} before purchase.`,
  };

  const basePrice =
    template.category === "Brakes"
      ? 48
      : template.category === "Electrical"
        ? 189
        : 22;

  const recycledPrice = Math.round(basePrice * 0.55 * 100) / 100;
  const remanPrice = Math.round(basePrice * 0.78 * 100) / 100;
  const newPrice = Math.round(basePrice * 1.15 * 100) / 100;

  const options: PartOption[] = [
    {
      id: `opt-recycled-${identified.id}`,
      condition: "recycled",
      name: `Recycled / used ${template.name}`,
      description: `Tested take-back ${makeLabel} part — lowest impact when condition is sound. Includes basic warranty from partner yard.`,
      price: recycledPrice,
      sustainabilityScore: 94,
      ecoRank: 3,
      badge: "Best eco choice",
      highlight: true,
      treesEstimate: treesForPrice(recycledPrice),
      amazonSearch: `${makeLabel} ${template.name} used recycled`,
    },
    {
      id: `opt-reman-${identified.id}`,
      condition: "remanufactured",
      name: `Remanufactured ${template.name}`,
      description:
        "Factory-refurb core with new wear surfaces — strong eco choice with OEM-like performance.",
      price: remanPrice,
      sustainabilityScore: 88,
      ecoRank: 2,
      badge: "Strong eco pick",
      highlight: false,
      treesEstimate: treesForPrice(remanPrice),
      amazonSearch: `${makeLabel} ${template.name} remanufactured`,
    },
    {
      id: `opt-new-${identified.id}`,
      condition: "new",
      name: `New OEM-spec ${template.name}`,
      description:
        "Brand-new aftermarket / OEM-spec unit when you need maximum lifespan or a warranty-first pick.",
      price: newPrice,
      sustainabilityScore: 62,
      ecoRank: 1,
      badge: "Longest lifespan",
      highlight: false,
      treesEstimate: treesForPrice(newPrice),
      amazonSearch: `${makeLabel} ${template.name} OEM`,
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

export function partOptionToCartProduct(
  option: PartOption,
  identified: IdentifiedPart,
  vehicleLabel: string
): Product {
  return {
    id: `parts-${option.id}`,
    name: option.name,
    description: `${option.description} Fitment: ${vehicleLabel}. OEM ref ${identified.oemNumber}.`,
    price: option.price,
    imageUrl:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#e8f0ea" width="160" height="160"/><text x="80" y="92" text-anchor="middle" font-size="42">🔧</text></svg>`
      ),
    category: "Auto Parts",
    sustainabilityScore: option.sustainabilityScore,
    affiliateCommissionPercent: 4,
    availabilityNote: `${option.condition} · confirm compatibility before install`,
  };
}

export const CONDITION_LABELS: Record<PartCondition, string> = {
  recycled: "Recycled / Used",
  remanufactured: "Remanufactured",
  new: "New",
};
