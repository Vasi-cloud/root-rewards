import {
  milesBetween,
  type GeoPoint,
  type NearbyStore,
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
} from "@/lib/local-commerce";

const PLACES_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_NEARBY_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

type PlacesApiPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { openNow?: boolean };
  currentOpeningHours?: { openNow?: boolean };
  types?: string[];
  websiteUri?: string;
  googleMapsUri?: string;
};

function placeTypesForCategory(categoryHint?: string | null): string[] {
  const c = (categoryHint ?? "").toLowerCase();
  if (c.includes("beauty")) return ["beauty_salon", "drugstore", "store"];
  if (c.includes("apparel")) return ["clothing_store", "shoe_store", "store"];
  if (c.includes("kitchen") || c.includes("home")) {
    return ["home_goods_store", "supermarket", "store"];
  }
  if (c.includes("outdoors") || c.includes("camp")) {
    return ["sporting_goods_store", "store"];
  }
  return ["store", "supermarket", "home_goods_store"];
}

function availabilityFromPlace(place: PlacesApiPlace): string {
  const openNow =
    place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow;
  if (openNow === true) return "Open now · stock not verified";
  if (openNow === false) return "Closed now · check hours before you go";
  if (place.rating && place.rating >= 4.3) {
    return "Well-rated nearby · call to confirm stock";
  }
  return "Nearby option · availability not verified";
}

function toNearbyStore(
  place: PlacesApiPlace,
  from: GeoPoint,
  index: number
): NearbyStore | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const name = place.displayName?.text?.trim();
  if (!name || lat == null || lng == null) return null;

  const distanceMi = milesBetween(from, { lat, lng });
  const address = place.formattedAddress?.trim();
  const city =
    address?.split(",").slice(-3, -1).join(",").trim() ||
    address?.split(",")[1]?.trim() ||
    "Nearby";

  const placeId = place.id?.replace(/^places\//, "") ?? `gplace-${index}`;
  const mapsUrl =
    place.googleMapsUri ||
    googleMapsSearchUrl(address ? `${name} ${address}` : name);

  return {
    id: `google-${placeId}`,
    name,
    city,
    address,
    distanceMi: Number(distanceMi.toFixed(2)),
    lat,
    lng,
    blurb: place.types?.slice(0, 2).join(" · ").replace(/_/g, " ") ||
      "Local store from Google Maps",
    source: "google",
    openNow:
      place.currentOpeningHours?.openNow ??
      place.regularOpeningHours?.openNow ??
      null,
    rating: place.rating,
    availabilityHint: availabilityFromPlace(place),
    matchingProductNames: [],
    placeId,
    mapsUrl,
    directionsUrl: googleMapsDirectionsUrl({ lat, lng, name }, from),
    websiteUrl: place.websiteUri?.trim() || undefined,
  };
}

async function placesPost(
  url: string,
  body: Record<string, unknown>,
  fieldMask: string
): Promise<PlacesApiPlace[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return [];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Google Places ${res.status}: ${errText.slice(0, 180) || res.statusText}`
    );
  }

  const data = (await res.json()) as { places?: PlacesApiPlace[] };
  return Array.isArray(data.places) ? data.places : [];
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.types",
  "places.googleMapsUri",
].join(",");

/**
 * Search Google Places (New) near a point for eco / category-relevant stores.
 * Requires GOOGLE_MAPS_API_KEY with Places API (New) enabled.
 */
export async function searchNearbyGooglePlaces(input: {
  user: GeoPoint;
  maxMiles: number;
  textQuery: string;
  categoryHint?: string | null;
  /** ISO country for Places region bias (e.g. "gb") */
  regionCode?: string | null;
  limit?: number;
}): Promise<NearbyStore[]> {
  if (!isGooglePlacesConfigured()) return [];

  const limit = Math.min(8, Math.max(1, input.limit ?? 5));
  const radiusMeters = Math.min(
    50000,
    Math.max(500, Math.round(input.maxMiles * 1609.34))
  );
  const regionCode = input.regionCode?.trim().toUpperCase() || undefined;
  const languageCode = regionCode === "GB" ? "en-GB" : "en";

  let places: PlacesApiPlace[] = [];

  try {
    places = await placesPost(
      PLACES_TEXT_URL,
      {
        textQuery: input.textQuery,
        pageSize: limit,
        languageCode,
        ...(regionCode ? { regionCode } : {}),
        locationBias: {
          circle: {
            center: {
              latitude: input.user.lat,
              longitude: input.user.lng,
            },
            radius: radiusMeters,
          },
        },
      },
      FIELD_MASK
    );
  } catch (err) {
    console.error("[google-places] text search failed", err);
  }

  if (places.length < 2) {
    try {
      const nearby = await placesPost(
        PLACES_NEARBY_URL,
        {
          includedTypes: placeTypesForCategory(input.categoryHint),
          maxResultCount: limit,
          rankPreference: "DISTANCE",
          languageCode,
          locationRestriction: {
            circle: {
              center: {
                latitude: input.user.lat,
                longitude: input.user.lng,
              },
              radius: radiusMeters,
            },
          },
        },
        FIELD_MASK
      );
      const seen = new Set(
        places.map((p) => p.id).filter((id): id is string => Boolean(id))
      );
      for (const p of nearby) {
        if (p.id && seen.has(p.id)) continue;
        places.push(p);
        if (p.id) seen.add(p.id);
      }
    } catch (err) {
      console.error("[google-places] nearby search failed", err);
    }
  }

  return places
    .map((p, i) => toNearbyStore(p, input.user, i))
    .filter((s): s is NearbyStore => Boolean(s))
    .filter((s) => s.distanceMi <= input.maxMiles + 0.5)
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, limit);
}
