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

/** Demo “where you are” — pair with browser geolocation later. */
export const USER_LOCATION_OPTIONS: UserLocationOption[] = [
  {
    id: "portland",
    label: "Portland, OR — Pearl District",
    region: "Pacific Northwest",
    lat: 45.5308,
    lng: -122.6815,
  },
  {
    id: "san-diego",
    label: "San Diego, CA — North Park",
    region: "Southern California",
    lat: 32.7442,
    lng: -117.1295,
  },
  {
    id: "austin",
    label: "Austin, TX — South Congress",
    region: "Central Texas",
    lat: 30.2495,
    lng: -97.7501,
  },
  {
    id: "seattle",
    label: "Seattle, WA — Capitol Hill",
    region: "Pacific Northwest",
    lat: 47.6253,
    lng: -122.3222,
  },
  {
    id: "denver",
    label: "Denver, CO — RiNo",
    region: "Front Range",
    lat: 39.7675,
    lng: -104.9798,
  },
];

export interface LocalMaker {
  id: string;
  name: string;
  city: string;
  /** Street-level address for Maps / directions */
  address?: string;
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
  /** Shopper-facing hours hint */
  hoursHint?: string;
}

/** Eco makers with realistic neighborhood coordinates near demo cities. */
export const LOCAL_MAKERS: LocalMaker[] = [
  {
    id: "maker-grove",
    name: "Green Grove Goods",
    city: "Portland, OR",
    address: "1624 NE Alberta St, Portland, OR 97211",
    blurb:
      "Regenerative kitchen tools — Saturday pickup at the Alberta makers market stall.",
    lat: 45.5591,
    lng: -122.6487,
    productIds: ["2", "5", "9", "14", "18"],
    shopSlug: "green-grove",
    services: ["Local pickup", "Zero-waste refill"],
    tags: ["kitchen", "handmade", "refill"],
    hoursHint: "Sat 9am–2pm market · Tue–Fri by appointment",
  },
  {
    id: "maker-cedar",
    name: "Cedar & Steam Co-op",
    city: "Portland, OR",
    address: "820 NW 23rd Ave, Portland, OR 97210",
    blurb: "Plant-based cleaners and home staples made within city limits.",
    lat: 45.5289,
    lng: -122.6984,
    productIds: ["3", "12", "16"],
    services: ["Same-day bike delivery", "Workshop nights"],
    tags: ["home", "co-op", "cleaners"],
    hoursHint: "Daily 10am–6pm",
  },
  {
    id: "maker-hawthorne",
    name: "Hawthorne Refill Bar",
    city: "Portland, OR",
    address: "3538 SE Hawthorne Blvd, Portland, OR 97214",
    blurb: "Bulk oils, soaps, and jar-friendly pantry staples on Hawthorne.",
    lat: 45.5122,
    lng: -122.6281,
    productIds: ["3", "5", "9", "18"],
    services: ["Bring-your-own jar", "Curbside"],
    tags: ["kitchen", "refill", "zero-waste"],
    hoursHint: "Mon–Sat 11am–7pm",
  },
  {
    id: "maker-tide",
    name: "Tide Line Collective",
    city: "San Diego, CA",
    address: "3010 Upas St, San Diego, CA 92104",
    blurb:
      "Ocean-bound plastic remade into daily gear — shore cleanups every month.",
    lat: 32.7418,
    lng: -117.1299,
    productIds: ["1", "4", "9", "17"],
    shopSlug: "tide-line",
    services: ["Beach pickup hub", "Repair clinic"],
    tags: ["ocean", "recycled", "outdoors"],
    hoursHint: "Wed–Sun 11am–6pm",
  },
  {
    id: "maker-canyon",
    name: "Canyon Light Studio",
    city: "San Diego, CA",
    address: "2228 Bacon St, San Diego, CA 92107",
    blurb: "Solar lanterns and trail kits for coastal hikers in OB.",
    lat: 32.7477,
    lng: -117.2491,
    productIds: ["8", "10"],
    services: ["Trailhead meetup"],
    tags: ["outdoors", "solar", "camping"],
    hoursHint: "Fri–Sun 10am–5pm",
  },
  {
    id: "maker-libra",
    name: "Libra Zero Waste",
    city: "San Diego, CA",
    address: "3811 30th St, San Diego, CA 92104",
    blurb: "Package-free grocery and beauty refills in North Park.",
    lat: 32.7456,
    lng: -117.1302,
    productIds: ["5", "7", "10", "15", "16"],
    services: ["Refill bar", "Local delivery"],
    tags: ["beauty", "grocery", "refill"],
    hoursHint: "Daily 10am–7pm",
  },
  {
    id: "maker-pecan",
    name: "Pecan Street Provisions",
    city: "Austin, TX",
    address: "1700 S Congress Ave, Austin, TX 78704",
    blurb: "Fair-trade apparel and plantable cards from a riverside studio.",
    lat: 30.2479,
    lng: -97.7505,
    productIds: ["6", "11", "13", "7"],
    services: ["Studio open house", "Gift wrapping"],
    tags: ["gifts", "apparel", "stationery"],
    hoursHint: "Tue–Sun 11am–6pm",
  },
  {
    id: "maker-barton",
    name: "Barton Creek Botanicals",
    city: "Austin, TX",
    address: "1401 E 7th St, Austin, TX 78702",
    blurb: "Organic balms and cotton rounds from a small East Austin workshop.",
    lat: 30.2651,
    lng: -97.7274,
    productIds: ["7", "15", "10"],
    services: ["Curbside pickup"],
    tags: ["beauty", "local", "skincare"],
    hoursHint: "Wed–Sat 12pm–6pm",
  },
  {
    id: "maker-wildflower",
    name: "Wildflower Supply Co.",
    city: "Austin, TX",
    address: "2110 S Lamar Blvd, Austin, TX 78704",
    blurb: "Reusable kitchen kits and beeswax wraps near Zilker.",
    lat: 30.2488,
    lng: -97.7699,
    productIds: ["2", "5", "9", "14"],
    services: ["In-store demos", "Pickup locker"],
    tags: ["kitchen", "zero-waste"],
    hoursHint: "Mon–Sat 10am–7pm · Sun 11am–5pm",
  },
  {
    id: "maker-pine",
    name: "Pine & Parcel Market",
    city: "Seattle, WA",
    address: "516 Broadway E, Seattle, WA 98102",
    blurb: "Capitol Hill hub for hemp apparel and durable outdoor bottles.",
    lat: 47.6236,
    lng: -122.3208,
    productIds: ["1", "4", "9", "11", "17"],
    services: ["Same-day courier", "Repair nights"],
    tags: ["apparel", "outdoors", "kitchen"],
    hoursHint: "Daily 10am–8pm",
  },
  {
    id: "maker-front",
    name: "Front Range Refillery",
    city: "Denver, CO",
    address: "3350 Brighton Blvd, Denver, CO 80216",
    blurb: "RiNo refill shop for cleaners, balms, and jar pantry goods.",
    lat: 39.7698,
    lng: -104.9789,
    productIds: ["3", "5", "7", "15", "16"],
    services: ["BYO containers", "Bike delivery"],
    tags: ["home", "beauty", "refill"],
    hoursHint: "Tue–Sat 10am–6pm",
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

function categoryTokens(categoryHint?: string | null, labels?: string[]): string[] {
  const raw = [
    categoryHint ?? "",
    ...(labels ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  return [...new Set(raw)];
}

/**
 * Vision-aware nearest Forest Buddies makers: prefer product id matches,
 * then category / label affinity. Pair with Google Places via /api/places/nearby.
 */
export function findNearestStoresForVision(input: {
  productIds: string[];
  categoryHint?: string | null;
  labels?: string[];
  user: GeoPoint;
  maxMiles: number;
  limit?: number;
}): LocalStoreMatch[] {
  const limit = input.limit ?? 5;
  const byProduct = findLocalStoresForProducts(
    input.productIds,
    input.user,
    input.maxMiles
  );
  if (byProduct.length >= 2) return byProduct.slice(0, limit);

  const tokens = categoryTokens(input.categoryHint, input.labels);
  const byId = new Map(MARKETPLACE_PRODUCTS.map((p) => [p.id, p]));
  const seen = new Set(byProduct.map((m) => m.maker.id));
  const extras: LocalStoreMatch[] = [];

  for (const maker of LOCAL_MAKERS) {
    if (seen.has(maker.id)) continue;
    const distanceMi = milesBetween(input.user, maker);
    if (distanceMi > input.maxMiles) continue;

    const hay = `${maker.name} ${maker.blurb} ${maker.tags.join(" ")} ${maker.services.join(" ")}`.toLowerCase();
    const tagHit =
      tokens.length === 0
        ? 0
        : tokens.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);

    const relatedProducts: LocalProductMatch[] = maker.productIds
      .map((id) => {
        const product = byId.get(id);
        if (!product) return null;
        const productHay =
          `${product.name} ${product.category} ${product.description}`.toLowerCase();
        const productHit = tokens.reduce(
          (n, t) => (productHay.includes(t) ? n + 1 : n),
          0
        );
        const categoryHit =
          input.categoryHint &&
          product.category.toLowerCase() === input.categoryHint.toLowerCase()
            ? 2
            : 0;
        if (tagHit + productHit + categoryHit === 0 && tokens.length > 0) {
          return null;
        }
        // When no vision tokens, keep closest makers with any stock
        if (tokens.length === 0 && extras.length >= limit) return null;
        return {
          product,
          availability: simulateLocalAvailability(maker.id, id),
        };
      })
      .filter((row): row is LocalProductMatch => Boolean(row))
      .slice(0, 3);

    if (relatedProducts.length === 0) continue;

    extras.push({
      maker,
      distanceMi,
      matchingProducts: relatedProducts,
      bestAvailability:
        relatedProducts[0]?.availability.status ?? "out_of_stock",
    });
    seen.add(maker.id);
  }

  extras.sort((a, b) => a.distanceMi - b.distanceMi);

  return [...byProduct, ...extras]
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, limit);
}

export type NearbyStoreSource = "forest-buddies" | "google";

/** Unified card for Find Nearest Store (makers + Google Places). */
export interface NearbyStore {
  id: string;
  name: string;
  city: string;
  address?: string;
  distanceMi: number;
  lat: number;
  lng: number;
  blurb: string;
  source: NearbyStoreSource;
  openNow?: boolean | null;
  rating?: number;
  hoursHint?: string;
  availabilityHint: string;
  matchingProductNames: string[];
  shopSlug?: string;
  placeId?: string;
  mapsUrl: string;
  directionsUrl: string;
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsStoreUrl(maker: Pick<LocalMaker, "name" | "city" | "address" | "lat" | "lng">): string {
  if (maker.address) return googleMapsSearchUrl(maker.address);
  return googleMapsSearchUrl(`${maker.name} ${maker.city}`);
}

/** Directions link — works for makers and Google Places coords. */
export function googleMapsDirectionsUrl(
  dest: { lat: number; lng: number; name?: string },
  from?: GeoPoint
): string {
  const destination = `${dest.lat},${dest.lng}`;
  if (from) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${destination}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function localMatchToNearbyStore(
  match: LocalStoreMatch,
  from: GeoPoint
): NearbyStore {
  const { maker, distanceMi, matchingProducts, bestAvailability } = match;
  const top = matchingProducts[0];
  const availabilityHint =
    top?.availability.etaNote ??
    (bestAvailability === "in_stock"
      ? "Likely in stock (demo)"
      : bestAvailability === "limited"
        ? "Limited stock (demo)"
        : bestAvailability === "pickup_only"
          ? "Pickup available (demo)"
          : "Call ahead (demo)");

  return {
    id: maker.id,
    name: maker.name,
    city: maker.city,
    address: maker.address,
    distanceMi,
    lat: maker.lat,
    lng: maker.lng,
    blurb: maker.blurb,
    source: "forest-buddies",
    hoursHint: maker.hoursHint,
    availabilityHint,
    matchingProductNames: matchingProducts.map((p) => p.product.name),
    shopSlug: maker.shopSlug,
    mapsUrl: googleMapsStoreUrl(maker),
    directionsUrl: googleMapsDirectionsUrl(maker, from),
  };
}

export function localMatchesToNearbyStores(
  matches: LocalStoreMatch[],
  from: GeoPoint
): NearbyStore[] {
  return matches.map((m) => localMatchToNearbyStore(m, from));
}

/** Build a practical Google Text query from vision / product context. */
export function buildPlacesSearchQuery(input: {
  categoryHint?: string | null;
  labels?: string[];
  productNames?: string[];
  cityLabel?: string;
}): string {
  const label = input.labels?.[0] ?? input.categoryHint ?? "eco products";
  const product = input.productNames?.[0];
  const city = input.cityLabel?.split("—")[0]?.trim() ?? "";
  const focus = product ? `${product}` : `${label}`;
  return `sustainable eco store ${focus} near ${city}`.replace(/\s+/g, " ").trim();
}

