import { NextResponse } from "next/server";

import {
  isGooglePlacesConfigured,
  searchNearbyGooglePlaces,
} from "@/lib/google-places";
import {
  USER_LOCATION_OPTIONS,
  buildPlacesSearchQuery,
  findNearestStoresForVision,
  localMatchesToNearbyStores,
  type LocationCountry,
  type NearbyStore,
} from "@/lib/local-commerce";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    configured: isGooglePlacesConfigured(),
    engine: isGooglePlacesConfigured() ? "google-places" : "mock",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = body as {
    locationId?: unknown;
    lat?: unknown;
    lng?: unknown;
    maxMiles?: unknown;
    productIds?: unknown;
    productNames?: unknown;
    categoryHint?: unknown;
    labels?: unknown;
    limit?: unknown;
  };

  const location =
    USER_LOCATION_OPTIONS.find((l) => l.id === String(raw.locationId ?? "")) ??
    null;

  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  const hasCustomGeo = Number.isFinite(lat) && Number.isFinite(lng);
  // Browser / custom coords win when provided
  const user = hasCustomGeo
    ? { lat, lng }
    : location
      ? { lat: location.lat, lng: location.lng }
      : {
          lat: USER_LOCATION_OPTIONS[0].lat,
          lng: USER_LOCATION_OPTIONS[0].lng,
        };

  /** Preset country, else UK bias when custom coords look like Britain */
  const country: LocationCountry = hasCustomGeo
    ? lat > 49 && lat < 61 && lng > -9 && lng < 2
      ? "gb"
      : (location?.country ?? "us")
    : (location?.country ?? "gb");

  const maxMiles = Math.min(
    500,
    Math.max(1, Math.floor(Number(raw.maxMiles) || 25))
  );
  const limit = Math.min(8, Math.max(2, Math.floor(Number(raw.limit) || 5)));
  const productIds = Array.isArray(raw.productIds)
    ? raw.productIds.map((id) => String(id)).filter(Boolean).slice(0, 12)
    : [];
  const productNames = Array.isArray(raw.productNames)
    ? raw.productNames
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const labels = Array.isArray(raw.labels)
    ? raw.labels
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const categoryHint = raw.categoryHint
    ? String(raw.categoryHint).trim().slice(0, 40)
    : null;

  const makerMatches = findNearestStoresForVision({
    productIds,
    categoryHint,
    labels,
    user,
    maxMiles,
    limit,
  });
  const forestStores = localMatchesToNearbyStores(makerMatches, user);

  let googleStores: NearbyStore[] = [];
  let googleError: string | undefined;
  const googleConfigured = isGooglePlacesConfigured();

  if (googleConfigured) {
    try {
      const textQuery = buildPlacesSearchQuery({
        categoryHint,
        labels,
        productNames:
          productNames.length > 0
            ? productNames
            : makerMatches[0]?.matchingProducts.map((p) => p.product.name),
        cityLabel: location?.label ?? (country === "gb" ? "United Kingdom" : ""),
        country,
      });
      googleStores = await searchNearbyGooglePlaces({
        user,
        maxMiles,
        textQuery,
        categoryHint,
        regionCode: country,
        limit,
      });
    } catch (err) {
      googleError =
        err instanceof Error ? err.message : "Google Places request failed";
      console.error("[api/places/nearby]", googleError);
    }
  }

  // Prefer Forest Buddies matches first, then fill with Google by distance
  const seenNames = new Set(forestStores.map((s) => s.name.toLowerCase()));
  const merged: NearbyStore[] = [...forestStores];
  for (const store of googleStores) {
    if (seenNames.has(store.name.toLowerCase())) continue;
    merged.push(store);
    seenNames.add(store.name.toLowerCase());
  }
  merged.sort((a, b) => {
    // Forest Buddies product matches slightly preferred when distances are close
    if (Math.abs(a.distanceMi - b.distanceMi) < 1.5) {
      if (a.source !== b.source) {
        return a.source === "forest-buddies" ? -1 : 1;
      }
    }
    return a.distanceMi - b.distanceMi;
  });

  return NextResponse.json({
    stores: merged.slice(0, limit),
    forestCount: forestStores.length,
    googleCount: googleStores.length,
    engine: googleConfigured
      ? googleStores.length > 0
        ? "hybrid"
        : "forest-buddies"
      : "mock",
    googleConfigured,
    googleError,
    user: {
      lat: user.lat,
      lng: user.lng,
      label: location?.label ?? "Custom location",
      country,
    },
    country,
  });
}
