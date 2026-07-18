import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-catalog";
import type { Product } from "@/types";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface UserLocationOption {
  id: string;
  label: string;
  region: string;
  lat: number;
  lng: number;
}

/** Mock “where you are” — swap for geolocation / Maps later. */
export const USER_LOCATION_OPTIONS: UserLocationOption[] = [
  {
    id: "portland",
    label: "Portland, OR",
    region: "Pacific Northwest",
    lat: 45.5152,
    lng: -122.6784,
  },
  {
    id: "san-diego",
    label: "San Diego, CA",
    region: "Southern California",
    lat: 32.7157,
    lng: -117.1611,
  },
  {
    id: "austin",
    label: "Austin, TX",
    region: "Central Texas",
    lat: 30.2672,
    lng: -97.7431,
  },
];

export interface LocalMaker {
  id: string;
  name: string;
  city: string;
  blurb: string;
  lat: number;
  lng: number;
  /** Marketplace product ids this maker carries locally */
  productIds: string[];
  /** Optional public shop slug */
  shopSlug?: string;
  /** Local services (pickup, workshops, etc.) */
  services: string[];
  tags: string[];
}

/** Eco makers with mock coordinates near demo cities. */
export const LOCAL_MAKERS: LocalMaker[] = [
  {
    id: "maker-grove",
    name: "Green Grove Goods",
    city: "Portland, OR",
    blurb: "Regenerative kitchen tools — pickup Saturdays at the Alberta makers market.",
    lat: 45.559,
    lng: -122.65,
    productIds: ["2", "5", "9", "14", "18"],
    shopSlug: "green-grove",
    services: ["Local pickup", "Zero-waste refill"],
    tags: ["kitchen", "handmade"],
  },
  {
    id: "maker-cedar",
    name: "Cedar & Steam Co-op",
    city: "Portland, OR",
    blurb: "Plant-based cleaners and home staples made within city limits.",
    lat: 45.504,
    lng: -122.675,
    productIds: ["3", "12", "16"],
    services: ["Same-day bike delivery", "Workshop nights"],
    tags: ["home", "co-op"],
  },
  {
    id: "maker-tide",
    name: "Tide Line Collective",
    city: "San Diego, CA",
    blurb: "Ocean-bound plastic remade into daily gear — shore cleanups every month.",
    lat: 32.74,
    lng: -117.2,
    productIds: ["1", "4", "9", "17"],
    shopSlug: "tide-line",
    services: ["Beach pickup hub", "Repair clinic"],
    tags: ["ocean", "recycled"],
  },
  {
    id: "maker-canyon",
    name: "Canyon Light Studio",
    city: "San Diego, CA",
    blurb: "Solar lanterns and trail kits for coastal hikers.",
    lat: 32.84,
    lng: -117.1,
    productIds: ["8", "10"],
    services: ["Trailhead meetup"],
    tags: ["outdoors", "solar"],
  },
  {
    id: "maker-pecan",
    name: "Pecan Street Provisions",
    city: "Austin, TX",
    blurb: "Fair-trade apparel and plantable cards from a riverside studio.",
    lat: 30.29,
    lng: -97.74,
    productIds: ["6", "11", "13", "7"],
    services: ["Studio open house", "Gift wrapping"],
    tags: ["gifts", "apparel"],
  },
  {
    id: "maker-barton",
    name: "Barton Creek Botanicals",
    city: "Austin, TX",
    blurb: "Organic balms and cotton rounds from a small East Austin workshop.",
    lat: 30.25,
    lng: -97.77,
    productIds: ["7", "15", "10"],
    services: ["Curbside pickup"],
    tags: ["beauty", "local"],
  },
];

export const DISTANCE_OPTIONS_MI = [10, 25, 50, 100, 500] as const;

/** Haversine distance in miles. */
export function milesBetween(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface LocalListing {
  maker: LocalMaker;
  product: Product;
  distanceMi: number;
  availability: LocalProductAvailability;
}

/** Simulated shelf status — not live inventory. */
export type LocalAvailabilityStatus =
  | "in_stock"
  | "limited"
  | "pickup_only"
  | "out_of_stock";

export interface LocalProductAvailability {
  status: LocalAvailabilityStatus;
  /** Approximate units when simulated as limited / in stock */
  qtyHint?: number;
  /** Short shopper-facing note */
  etaNote: string;
}

export interface LocalProductMatch {
  product: Product;
  availability: LocalProductAvailability;
}

export const STOCK_SIMULATION_DISCLAIMER =
  "Local availability is simulated for this demo — live store inventory and real-time stock checks come later.";

const AVAILABILITY_RANK: Record<LocalAvailabilityStatus, number> = {
  in_stock: 0,
  limited: 1,
  pickup_only: 2,
  out_of_stock: 3,
};

/** Curated demo overrides so common vision matches feel intentional. */
const AVAILABILITY_OVERRIDES: Record<
  string,
  Omit<LocalProductAvailability, "etaNote"> & { etaNote?: string }
> = {
  "maker-grove:9": {
    status: "in_stock",
    qtyHint: 8,
    etaNote: "On shelf · Saturday market pickup",
  },
  "maker-grove:5": {
    status: "limited",
    qtyHint: 3,
    etaNote: "3 left · refill station",
  },
  "maker-tide:1": {
    status: "limited",
    qtyHint: 2,
    etaNote: "2 left at beach hub",
  },
  "maker-tide:9": {
    status: "in_stock",
    qtyHint: 12,
    etaNote: "Ready for same-day beach pickup",
  },
  "maker-tide:17": {
    status: "pickup_only",
    qtyHint: 4,
    etaNote: "Reserve jacket · pickup only",
  },
  "maker-pecan:11": {
    status: "in_stock",
    qtyHint: 6,
    etaNote: "Studio rack · try-on available",
  },
  "maker-barton:7": {
    status: "limited",
    qtyHint: 2,
    etaNote: "Fresh batch · 2 tins left",
  },
  "maker-cedar:3": {
    status: "pickup_only",
    qtyHint: 5,
    etaNote: "Bike delivery or co-op pickup",
  },
  "maker-canyon:8": {
    status: "in_stock",
    qtyHint: 4,
    etaNote: "Trailhead meetup stock",
  },
};

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Deterministic mock shelf status for a maker × product.
 * Stable across reloads so demos feel consistent.
 */
export function simulateLocalAvailability(
  makerId: string,
  productId: string
): LocalProductAvailability {
  const key = `${makerId}:${productId}`;
  const override = AVAILABILITY_OVERRIDES[key];
  if (override) {
    return {
      status: override.status,
      qtyHint: override.qtyHint,
      etaNote:
        override.etaNote ??
        defaultEta(override.status, override.qtyHint),
    };
  }

  const h = hashKey(key);
  const bucket = h % 10;
  if (bucket <= 4) {
    const qtyHint = 5 + (h % 10);
    return {
      status: "in_stock",
      qtyHint,
      etaNote: defaultEta("in_stock", qtyHint),
    };
  }
  if (bucket <= 6) {
    const qtyHint = 1 + (h % 3);
    return {
      status: "limited",
      qtyHint,
      etaNote: defaultEta("limited", qtyHint),
    };
  }
  if (bucket <= 8) {
    const qtyHint = 2 + (h % 4);
    return {
      status: "pickup_only",
      qtyHint,
      etaNote: defaultEta("pickup_only", qtyHint),
    };
  }
  return {
    status: "out_of_stock",
    etaNote: defaultEta("out_of_stock"),
  };
}

function defaultEta(
  status: LocalAvailabilityStatus,
  qtyHint?: number
): string {
  switch (status) {
    case "in_stock":
      return qtyHint != null
        ? `~${qtyHint} on hand · ready today`
        : "Ready today (simulated)";
    case "limited":
      return qtyHint != null
        ? `Only ${qtyHint} left · confirm before visiting`
        : "Low stock · confirm before visiting";
    case "pickup_only":
      return "Reserve for same-day pickup (simulated)";
    case "out_of_stock":
      return "Out this week · restock simulated soon";
  }
}

export function availabilityLabel(status: LocalAvailabilityStatus): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "limited":
      return "Limited";
    case "pickup_only":
      return "Pickup only";
    case "out_of_stock":
      return "Out of stock";
  }
}

export function getLocalListings(
  user: GeoPoint,
  maxMiles: number
): LocalListing[] {
  const byId = new Map(MARKETPLACE_PRODUCTS.map((p) => [p.id, p]));
  const rows: LocalListing[] = [];

  for (const maker of LOCAL_MAKERS) {
    const distanceMi = milesBetween(user, maker);
    if (distanceMi > maxMiles) continue;
    for (const pid of maker.productIds) {
      const product = byId.get(pid);
      if (!product) continue;
      rows.push({
        maker,
        product,
        distanceMi,
        availability: simulateLocalAvailability(maker.id, pid),
      });
    }
  }

  return rows.sort((a, b) => {
    const rank =
      AVAILABILITY_RANK[a.availability.status] -
      AVAILABILITY_RANK[b.availability.status];
    if (rank !== 0) return rank;
    return a.distanceMi - b.distanceMi;
  });
}

export function getNearbyMakers(user: GeoPoint, maxMiles: number) {
  return LOCAL_MAKERS.map((maker) => ({
    maker,
    distanceMi: milesBetween(user, maker),
  }))
    .filter((r) => r.distanceMi <= maxMiles)
    .sort((a, b) => a.distanceMi - b.distanceMi);
}

/** Normalize lat/lng into 0–100% for a fake map pin layout. */
export function pinPosition(
  point: GeoPoint,
  bounds = {
    minLat: 29.5,
    maxLat: 46.5,
    minLng: -123.5,
    maxLng: -96.5,
  }
): { left: number; top: number } {
  const left =
    ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const top =
    ((bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return {
    left: Math.min(92, Math.max(8, left)),
    top: Math.min(88, Math.max(12, top)),
  };
}

export function formatDistance(mi: number): string {
  if (mi < 1) return "< 1 mi";
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export interface LocalStoreMatch {
  maker: LocalMaker;
  distanceMi: number;
  /** Catalog products from the vision/recommend set this maker carries */
  matchingProducts: LocalProductMatch[];
  /** Best availability among matching products (for sorting) */
  bestAvailability: LocalAvailabilityStatus;
}

/** Find nearby makers that carry any of the given marketplace product ids. */
export function findLocalStoresForProducts(
  productIds: string[],
  user: GeoPoint,
  maxMiles: number
): LocalStoreMatch[] {
  if (productIds.length === 0) return [];
  const want = new Set(productIds);
  const byId = new Map(MARKETPLACE_PRODUCTS.map((p) => [p.id, p]));

  return LOCAL_MAKERS.map((maker) => {
    const matchingProducts: LocalProductMatch[] = maker.productIds
      .filter((id) => want.has(id))
      .map((id) => {
        const product = byId.get(id);
        if (!product) return null;
        return {
          product,
          availability: simulateLocalAvailability(maker.id, id),
        };
      })
      .filter((row): row is LocalProductMatch => Boolean(row))
      .sort(
        (a, b) =>
          AVAILABILITY_RANK[a.availability.status] -
          AVAILABILITY_RANK[b.availability.status]
      );

    const bestAvailability =
      matchingProducts[0]?.availability.status ?? "out_of_stock";

    return {
      maker,
      distanceMi: milesBetween(user, maker),
      matchingProducts,
      bestAvailability,
    };
  })
    .filter((r) => r.matchingProducts.length > 0 && r.distanceMi <= maxMiles)
    .sort((a, b) => {
      const rank =
        AVAILABILITY_RANK[a.bestAvailability] -
        AVAILABILITY_RANK[b.bestAvailability];
      if (rank !== 0) return rank;
      return a.distanceMi - b.distanceMi;
    });
}

