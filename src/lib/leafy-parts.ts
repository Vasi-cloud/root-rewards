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
  | "volkswagen"
  | "bmw"
  | "tesla";

export type VehicleDetails = {
  makeId: VehicleMakeId | "";
  modelId: string;
  year: string;
  vin: string;
};

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
      { id: "rav4", label: "RAV4" },
      { id: "camry", label: "Camry" },
      { id: "prius", label: "Prius" },
    ],
  },
  honda: {
    label: "Honda",
    models: [
      { id: "civic", label: "Civic" },
      { id: "cr-v", label: "CR-V" },
      { id: "accord", label: "Accord" },
      { id: "fit", label: "Fit / Jazz" },
    ],
  },
  ford: {
    label: "Ford",
    models: [
      { id: "focus", label: "Focus" },
      { id: "escape", label: "Escape / Kuga" },
      { id: "f-150", label: "F-150" },
      { id: "mustang", label: "Mustang" },
    ],
  },
  volkswagen: {
    label: "Volkswagen",
    models: [
      { id: "golf", label: "Golf" },
      { id: "tiguan", label: "Tiguan" },
      { id: "passat", label: "Passat" },
      { id: "id4", label: "ID.4" },
    ],
  },
  bmw: {
    label: "BMW",
    models: [
      { id: "3-series", label: "3 Series" },
      { id: "x3", label: "X3" },
      { id: "5-series", label: "5 Series" },
      { id: "i4", label: "i4" },
    ],
  },
  tesla: {
    label: "Tesla",
    models: [
      { id: "model-3", label: "Model 3" },
      { id: "model-y", label: "Model Y" },
      { id: "model-s", label: "Model S" },
    ],
  },
};

export const YEAR_OPTIONS = Array.from({ length: 26 }, (_, i) =>
  String(2026 - i)
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
      badge: "Best for the planet",
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
      badge: "Recommended",
      highlight: true,
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
      badge: "New",
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
