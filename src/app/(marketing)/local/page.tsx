"use client";

import {
  ChefHat,
  Heart,
  HeartHandshake,
  Leaf,
  MapPin,
  Navigation,
  Recycle,
  ShoppingBag,
  Store,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { LeafyHubLinks } from "@/components/layout/leafy-hub-links";
import { LocalEmptyState } from "@/components/local/local-empty-state";
import { LocalMakerCard } from "@/components/local/local-maker-card";
import {
  LocalStoreCard,
  LocalStoreCardSkeleton,
} from "@/components/local/local-store-card";
import {
  LocalStoresMap,
  type LocalMapPin,
} from "@/components/local/local-stores-map";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppToast } from "@/components/ui/app-toast";
import { useCart } from "@/contexts/cart-context";
import {
  DISTANCE_OPTIONS_MI,
  LOCAL_STOCK_DISCLAIMER,
  USER_LOCATION_OPTIONS,
  distanceOptionLabel,
  findNearbyRetailChains,
  formatDistance,
  getLocalListings,
  getNearbyMakers,
  googleMapsDirectionsUrl,
  retailChainToNearbyStore,
  type NearbyStore,
} from "@/lib/local-commerce";
import {
  getLocalFavourites,
  subscribeLocalFavourites,
  toggleLocalFavourite,
  type LocalFavourite,
} from "@/lib/local-favourites";
import { ensureDemoShops } from "@/lib/seller-storage";
import { cn } from "@/lib/utils";
import { setVoiceNavPlaces } from "@/lib/voice-nav";

export default function BuyLocalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">
          Loading local stores…
        </div>
      }
    >
      <BuyLocalPageInner />
    </Suspense>
  );
}

function BuyLocalPageInner() {
  const { addToCart } = useCart();
  const { showSuccess } = useAppToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city");
  const productParam = searchParams.get("product");
  const ingredientParam = searchParams.get("ingredient");
  const partParam = searchParams.get("part");
  const fromParam = searchParams.get("from");
  const fromKitchen = fromParam === "kitchen";
  const fromParts = fromParam === "parts";
  const storesSectionRef = useRef<HTMLElement>(null);
  const makersSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  const initialCity =
    USER_LOCATION_OPTIONS.find((l) => l.id === cityParam)?.id ??
    USER_LOCATION_OPTIONS[0].id;

  const [locationId, setLocationId] = useState(initialCity);
  const [maxMiles, setMaxMiles] = useState<(typeof DISTANCE_OPTIONS_MI)[number]>(25);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [onlineProductId, setOnlineProductId] = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [placesEngine, setPlacesEngine] = useState<string>("mock");
  const [focusProductName, setFocusProductName] = useState<string | null>(null);
  const [contextMode, setContextMode] = useState<"kitchen" | "parts" | "product" | null>(
    null
  );
  const [favourites, setFavourites] = useState<LocalFavourite[]>([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  useEffect(() => {
    ensureDemoShops();
  }, []);

  useEffect(() => {
    setFavourites(getLocalFavourites());
    return subscribeLocalFavourites(() => {
      setFavourites(getLocalFavourites());
    });
  }, []);

  useEffect(() => {
    if (cityParam && USER_LOCATION_OPTIONS.some((l) => l.id === cityParam)) {
      setLocationId(cityParam);
    }
  }, [cityParam]);

  useEffect(() => {
    const ingredient = ingredientParam?.trim() || null;
    const part = partParam?.trim() || null;

    if (fromKitchen || ingredient) {
      setContextMode("kitchen");
      if (ingredient) setFocusProductName(ingredient);
      window.setTimeout(() => {
        storesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
      return;
    }

    if (fromParts || part) {
      setContextMode("parts");
      if (part) setFocusProductName(part);
      window.setTimeout(() => {
        storesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
      return;
    }

    if (productParam) {
      setContextMode("product");
      return;
    }

    setContextMode(null);
    setFocusProductName(null);
  }, [ingredientParam, partParam, fromKitchen, fromParts, productParam]);

  const user = useMemo(
    () =>
      USER_LOCATION_OPTIONS.find((l) => l.id === locationId) ??
      USER_LOCATION_OPTIONS[0],
    [locationId]
  );

  const makers = useMemo(
    () => getNearbyMakers(user, maxMiles),
    [user, maxMiles]
  );

  const favouriteStoreIds = useMemo(
    () =>
      new Set(
        favourites.filter((f) => f.kind === "store").map((f) => f.id)
      ),
    [favourites]
  );
  const favouriteMakerIds = useMemo(
    () =>
      new Set(
        favourites.filter((f) => f.kind === "maker").map((f) => f.id)
      ),
    [favourites]
  );

  const visibleStores = useMemo(() => {
    if (!showFavouritesOnly) return nearbyStores;
    return nearbyStores.filter((s) => favouriteStoreIds.has(s.id));
  }, [nearbyStores, showFavouritesOnly, favouriteStoreIds]);

  const visibleMakers = useMemo(() => {
    if (!showFavouritesOnly) return makers;
    return makers.filter(({ maker }) => favouriteMakerIds.has(maker.id));
  }, [makers, showFavouritesOnly, favouriteMakerIds]);

  // Publish nearby places for site voice navigation (How far / Directions)
  useEffect(() => {
    const storePlaces = nearbyStores.map((store) => ({
      id: store.id,
      name: store.name,
      kind: "store" as const,
      distanceMi: store.distanceMi,
      distanceLabel: formatDistance(store.distanceMi, user.country),
      directionsUrl: store.directionsUrl,
    }));
    const makerPlaces = makers.map(({ maker, distanceMi }) => ({
      id: maker.id,
      name: maker.name,
      kind: "maker" as const,
      distanceMi,
      distanceLabel: formatDistance(distanceMi, user.country),
      directionsUrl: googleMapsDirectionsUrl(maker, user),
    }));
    setVoiceNavPlaces([...storePlaces, ...makerPlaces]);
  }, [nearbyStores, makers, user]);

  const listings = useMemo(() => {
    const all = getLocalListings(user, maxMiles);
    if (!productParam) return all;
    const focused = all.filter((l) => l.product.id === productParam);
    const rest = all.filter((l) => l.product.id !== productParam);
    return [...focused, ...rest];
  }, [user, maxMiles, productParam]);

  const highlightName = listings.find(
    (l) => l.product.id === productParam
  )?.product.name;

  const placesQuery = useMemo(() => {
    if (contextMode === "parts") {
      return {
        categoryHint: "auto parts recycler scrap yard breaker salvage",
        productNames: focusProductName
          ? [focusProductName, "auto parts", "recycler"]
          : ["auto parts", "recycler", "breaker"],
        labels: ["Auto recycler", "Breaker", "Salvage"],
      };
    }
    return {
      categoryHint: "grocery supermarket retail",
      productNames: focusProductName
        ? [focusProductName]
        : ["eco household", "sustainable grocery"],
      labels: ["Sainsbury's", "Tesco", "Waitrose"],
    };
  }, [contextMode, focusProductName]);

  const loadNearbyStores = useCallback(async () => {
    setStoresLoading(true);
    const retailFallback = findNearbyRetailChains(user, maxMiles, locationId)
      .slice(0, 8)
      .map((s) => retailChainToNearbyStore(s, user));

    try {
      const res = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          lat: user.lat,
          lng: user.lng,
          maxMiles,
          limit: 8,
          categoryHint: placesQuery.categoryHint,
          productNames: placesQuery.productNames,
          labels: placesQuery.labels,
        }),
      });
      const data = (await res.json()) as {
        stores?: NearbyStore[];
        engine?: string;
        googleConfigured?: boolean;
      };

      const fromApi = data.stores ?? [];
      setPlacesEngine(data.engine ?? "mock");

      // Merge Places + UK retail pins; prefer closer unique names
      const seen = new Set<string>();
      const merged: NearbyStore[] = [];
      for (const store of [...fromApi, ...retailFallback]) {
        const key = store.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(store);
      }
      merged.sort((a, b) => a.distanceMi - b.distanceMi);
      setNearbyStores(merged.slice(0, 10));
    } catch {
      setPlacesEngine("mock");
      setNearbyStores(retailFallback);
    } finally {
      setStoresLoading(false);
    }
  }, [user, maxMiles, locationId, placesQuery]);

  useEffect(() => {
    void loadNearbyStores();
  }, [loadNearbyStores]);

  function handleAdd(productId: string, product: (typeof listings)[0]["product"]) {
    addToCart(product);
    setAddedId(productId);
    showSuccess("Added to cart", product.name);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  function scrollToStores(productName?: string) {
    if (productName) setFocusProductName(productName);
    storesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearContext() {
    setContextMode(null);
    setFocusProductName(null);
    router.replace("/local", { scroll: false });
  }

  function handleToggleStoreFavourite(store: NearbyStore) {
    const { saved } = toggleLocalFavourite({
      kind: "store",
      id: store.id,
      name: store.name,
    });
    showSuccess(
      saved ? "Saved to favourites" : "Removed from favourites",
      store.name
    );
  }

  function handleToggleMakerFavourite(makerId: string, makerName: string) {
    const { saved } = toggleLocalFavourite({
      kind: "maker",
      id: makerId,
      name: makerName,
    });
    showSuccess(
      saved ? "Saved to favourites" : "Removed from favourites",
      makerName
    );
  }

  const hasContext =
    contextMode != null || Boolean(focusProductName || highlightName);

  const sectionNav = [
    {
      href: "#local-stores",
      label: "Stores",
      count: storesLoading ? null : visibleStores.length,
      icon: Store,
    },
    {
      href: "#local-makers",
      label: "Makers",
      count: visibleMakers.length,
      icon: HeartHandshake,
    },
    {
      href: "#local-favourites",
      label: "Saved",
      count: favourites.length,
      icon: Heart,
    },
    {
      href: "#local-products",
      label: "Products",
      count: listings.length,
      icon: ShoppingBag,
    },
  ] as const;

  const mapPins = useMemo(() => {
    const pins: LocalMapPin[] = [
      {
        id: "you",
        name: "You",
        lat: user.lat,
        lng: user.lng,
        distanceMi: 0,
        kind: "you",
      },
    ];
    let markerIndex = 1;
    for (const s of visibleStores) {
      pins.push({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        distanceMi: s.distanceMi,
        kind: "store",
        markerIndex: markerIndex++,
      });
    }
    for (const { maker, distanceMi } of visibleMakers.slice(0, 4)) {
      if (pins.some((p) => p.id === maker.id)) continue;
      pins.push({
        id: maker.id,
        name: maker.name,
        lat: maker.lat,
        lng: maker.lng,
        distanceMi,
        kind: "maker",
        markerIndex: markerIndex++,
      });
    }
    return pins;
  }, [user, visibleStores, visibleMakers]);

  const markerIndexById = useMemo(() => {
    const map = new Map<string, number>();
    for (const pin of mapPins) {
      if (pin.markerIndex != null) map.set(pin.id, pin.markerIndex);
    }
    return map;
  }, [mapPins]);

  function handleSelectPin(id: string) {
    const el =
      document.getElementById(`local-store-${id}`) ??
      document.getElementById(`local-maker-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <HeartHandshake className="size-3.5" />
            Buy Local
          </Badge>
        </div>

        <h1 className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
          Find nearby stores &amp; makers
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-lg">
          Buy Local helps you source ingredients, household goods, and parts
          from shops and makers close by — then confirm in person before you
          travel. Three clear lists: Stores, Makers, and Products.
        </p>

        <LeafyHubLinks omitHref="/local" className="mt-4" dense />

        {/* Primary honest disclaimer */}
        <div
          role="status"
          className="mt-5 flex gap-3 rounded-xl border border-amber-300/90 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 shadow-sm sm:items-center sm:px-4"
        >
          <Store className="mt-0.5 size-5 shrink-0 text-amber-800 sm:mt-0" />
          <div>
            <p className="font-medium leading-relaxed">{LOCAL_STOCK_DISCLAIMER}</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
              Distances are approximate. Stock is never live on Forest Buddies®.
            </p>
          </div>
        </div>

        {/* Section jump */}
        <nav
          className="mt-6 -mx-0.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden"
          aria-label="Buy Local sections"
        >
          {sectionNav.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-emerald-200/90 bg-white/90 px-3.5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.98] sm:min-h-0 sm:py-1.5"
              >
                <Icon className="size-3.5 text-emerald-800" />
                {item.label}
                {item.count != null && (
                  <span className="rounded-full bg-emerald-800/10 px-1.5 py-0.5 text-[11px] tabular-nums text-emerald-900">
                    {item.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {hasContext && (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-3.5 py-3.5 shadow-xs sm:px-4 sm:py-4",
              contextMode === "parts"
                ? "border-sky-200 bg-sky-50/80"
                : "border-emerald-200 bg-emerald-50/80"
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-cream shadow-sm",
                  contextMode === "parts" ? "bg-sky-800" : "bg-emerald-800"
                )}
              >
                {contextMode === "parts" ? (
                  <Recycle className="size-4" />
                ) : contextMode === "kitchen" ? (
                  <ChefHat className="size-4" />
                ) : (
                  <Wrench className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-950">
                  {contextMode === "kitchen" && (
                    <>
                      From Leafy Kitchen
                      {focusProductName || ingredientParam ? (
                        <>
                          {" "}
                          · looking for{" "}
                          <span className="font-bold">
                            {focusProductName || ingredientParam}
                          </span>
                        </>
                      ) : null}
                    </>
                  )}
                  {contextMode === "parts" && (
                    <>
                      From Leafy Parts Finder
                      {focusProductName || partParam ? (
                        <>
                          {" "}
                          · ask recyclers for{" "}
                          <span className="font-bold">
                            {focusProductName || partParam}
                          </span>
                        </>
                      ) : (
                        <> · local recyclers &amp; breakers</>
                      )}
                    </>
                  )}
                  {contextMode === "product" && (
                    <>
                      Focusing on matches for{" "}
                      <span className="font-bold">
                        {highlightName ?? "your selected product"}
                      </span>
                    </>
                  )}
                  {!contextMode && (focusProductName || highlightName) && (
                    <>
                      Looking for{" "}
                      <span className="font-bold">
                        {focusProductName || highlightName}
                      </span>{" "}
                      nearby
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-900/85 sm:text-sm">
                  {contextMode === "parts"
                    ? "We’ll emphasise nearby options that may carry used or recycled parts. Stock isn’t live — call or visit to confirm."
                    : contextMode === "kitchen"
                      ? "Stores below are a starting point for this ingredient. Ask about fresh or organic options — we don’t track live stock."
                      : "Use Check in-store or Directions on a store card, or browse every local option below."}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {contextMode === "kitchen" && (
                    <Button
                      nativeButton={false}
                      render={<Link href="/kitchen" />}
                      variant="outline"
                      className="h-11 gap-1.5 border-emerald-300/90 bg-white/90 text-emerald-950 sm:h-9"
                    >
                      <Leaf className="size-3.5" />
                      Back to Leafy Kitchen
                    </Button>
                  )}
                  {contextMode === "parts" && (
                    <Button
                      nativeButton={false}
                      render={<Link href="/parts" />}
                      variant="outline"
                      className="h-11 gap-1.5 border-sky-300/90 bg-white/90 text-sky-950 sm:h-9"
                    >
                      <Wrench className="size-3.5" />
                      Back to Parts Finder
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-emerald-950 sm:h-9"
                    onClick={clearContext}
                  >
                    Browse all local options
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-5">
          <Card className="border-border/70 bg-white/90 lg:col-span-2">
            <CardHeader className="space-y-1.5 px-3.5 pb-3 sm:px-6 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Navigation className="size-4 text-primary" />
                Your area
              </CardTitle>
              <CardDescription className="text-sm">
                Choose a city to see nearby stores and distance. Maps uses
                Google Places when configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 px-3.5 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="local-city"
                >
                  City
                </label>
                <select
                  id="local-city"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring sm:h-auto"
                >
                  {USER_LOCATION_OPTIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label} · {loc.region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Search within</p>
                <div className="flex flex-wrap gap-2">
                  {DISTANCE_OPTIONS_MI.map((mi) => (
                    <button
                      key={mi}
                      type="button"
                      onClick={() => setMaxMiles(mi)}
                      className={cn(
                        "min-h-11 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] sm:min-h-0 sm:px-3 sm:py-1.5",
                        maxMiles === mi
                          ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                          : "border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-sm"
                      )}
                    >
                      {mi >= 500
                        ? "Anywhere"
                        : distanceOptionLabel(mi, user.country)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Show</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFavouritesOnly(false)}
                    className={cn(
                      "min-h-11 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] sm:min-h-0 sm:py-1.5",
                      !showFavouritesOnly
                        ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                        : "border-emerald-200 bg-white text-emerald-950 hover:bg-emerald-50"
                    )}
                  >
                    All nearby
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFavouritesOnly(true)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] sm:min-h-0 sm:py-1.5",
                      showFavouritesOnly
                        ? "border-rose-700 bg-rose-700 text-white shadow-sm"
                        : "border-rose-200 bg-white text-rose-900 hover:bg-rose-50"
                    )}
                  >
                    <Heart
                      className={cn(
                        "size-3.5",
                        showFavouritesOnly && "fill-current"
                      )}
                    />
                    Favourites
                    {favourites.length > 0 && (
                      <span className="tabular-nums opacity-90">
                        ({favourites.length})
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3 text-sm text-emerald-950 sm:px-4">
                <p className="font-medium">Near {user.label}</p>
                <p className="mt-1 text-emerald-800/85">
                  {storesLoading
                    ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-3.5 animate-spin rounded-full border-2 border-emerald-800/30 border-t-emerald-800" />
                        Finding stores…
                      </span>
                    )
                    : `${visibleStores.length} store${visibleStores.length === 1 ? "" : "s"} · ${visibleMakers.length} maker${visibleMakers.length === 1 ? "" : "s"}${showFavouritesOnly ? " saved nearby" : ""} · ${listings.length} product${listings.length === 1 ? "" : "s"}`}
                  {placesEngine === "hybrid" || placesEngine === "google-places"
                    ? " · Google Maps"
                    : " · map preview"}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                  Ingredients, parts, or everyday goods — start with Stores
                </li>
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  Distances are approximate from your selected city
                </li>
              </ul>
            </CardContent>
          </Card>

          <LocalStoresMap
            user={user}
            pins={mapPins}
            placesEngine={placesEngine}
            onSelectPin={handleSelectPin}
          />
        </div>

        {/* Nearby stores */}
        <section
          ref={storesSectionRef}
          id="local-stores"
          className="mt-10 scroll-mt-24 sm:mt-12"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                1 · Stores
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                {contextMode === "parts"
                  ? "Recyclers & nearby shops"
                  : "Check stock in person"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {contextMode === "parts"
                  ? "Start with local recyclers and breakers when you can — then confirm the part before you go. Grocery chains may still appear as fallbacks."
                  : "Grocery chains and local shops with distance, store type, and clear next steps. We never claim real-time stock."}
              </p>
            </div>
            {!storesLoading && visibleStores.length > 0 && (
              <Badge className="bg-emerald-800/10 font-normal text-emerald-900">
                {visibleStores.length}{" "}
                {showFavouritesOnly ? "saved nearby" : "nearby"}
              </Badge>
            )}
          </div>

          {storesLoading ? (
            <div
              className="grid gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading nearby stores"
            >
              {[0, 1, 2].map((i) => (
                <LocalStoreCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleStores.length === 0 ? (
            <LocalEmptyState
              icon={showFavouritesOnly ? Heart : MapPin}
              title={
                showFavouritesOnly
                  ? "No saved stores nearby"
                  : "No stores in this radius"
              }
              description={
                showFavouritesOnly
                  ? favourites.some((f) => f.kind === "store")
                    ? "You’ve saved stores, but none are in this city or distance. Widen the radius, switch cities, or show all nearby."
                    : "Tap the heart on a store card to save it here for quick access next time."
                  : `Nothing matched near ${user.label} within your current distance${focusProductName ? ` for “${focusProductName}”` : ""}. Try a wider search or another city — local options often appear within 25–50 miles.`
              }
              country={user.country}
              currentCityId={locationId}
              maxMiles={maxMiles}
              onExpandRadius={(mi) => setMaxMiles(mi)}
              onSelectCity={setLocationId}
              secondaryAction={
                showFavouritesOnly
                  ? {
                      label: "Show all nearby stores",
                      onClick: () => setShowFavouritesOnly(false),
                    }
                  : hasContext
                    ? {
                        label: "Browse all local options",
                        onClick: clearContext,
                      }
                    : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleStores.map((store) => (
                <LocalStoreCard
                  key={store.id}
                  store={store}
                  country={user.country}
                  focusLabel={focusProductName}
                  markerIndex={markerIndexById.get(store.id)}
                  saved={favouriteStoreIds.has(store.id)}
                  onToggleFavourite={() => handleToggleStoreFavourite(store)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Eco makers */}
        <section
          ref={makersSectionRef}
          id="local-makers"
          className="mt-12 scroll-mt-24 sm:mt-14"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                2 · Makers
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                Eco businesses near you
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Independent makers with the same clear distance and next steps
                as big stores — confirm pickup or inventory before you go.
              </p>
            </div>
            {visibleMakers.length > 0 && (
              <Badge className="bg-emerald-800/10 font-normal text-emerald-900">
                {visibleMakers.length}{" "}
                {showFavouritesOnly ? "saved nearby" : "nearby"}
              </Badge>
            )}
          </div>
          {visibleMakers.length === 0 ? (
            <LocalEmptyState
              icon={showFavouritesOnly ? Heart : HeartHandshake}
              title={
                showFavouritesOnly
                  ? "No saved makers nearby"
                  : "No makers in this radius"
              }
              description={
                showFavouritesOnly
                  ? favourites.some((f) => f.kind === "maker")
                    ? "Your saved makers aren’t in this city or distance. Widen the search, try another city, or show all nearby."
                    : "Tap the heart on a maker card to save refill shops, studios, and producers you like."
                  : `No independent makers near ${user.label} right now. Widen the distance or pick another city — makers often show up alongside the store list.`
              }
              country={user.country}
              currentCityId={locationId}
              maxMiles={maxMiles}
              onExpandRadius={(mi) => setMaxMiles(mi)}
              onSelectCity={setLocationId}
              secondaryAction={
                showFavouritesOnly
                  ? {
                      label: "Show all nearby makers",
                      onClick: () => setShowFavouritesOnly(false),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleMakers.map(({ maker, distanceMi }) => (
                <LocalMakerCard
                  key={maker.id}
                  maker={maker}
                  distanceMi={distanceMi}
                  country={user.country}
                  from={user}
                  markerIndex={markerIndexById.get(maker.id)}
                  saved={favouriteMakerIds.has(maker.id)}
                  onToggleFavourite={() =>
                    handleToggleMakerFavourite(maker.id, maker.name)
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Saved favourites overview */}
        <section
          id="local-favourites"
          className="mt-12 scroll-mt-24 sm:mt-14"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-800/70">
                Saved
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                Your favourites
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Stores and makers you heart — kept on this device for quick
                revisits. Filter above to show only favourites nearby.
              </p>
            </div>
            {favourites.length > 0 && (
              <Badge className="bg-rose-100 font-normal text-rose-900">
                {favourites.length} saved
              </Badge>
            )}
          </div>

          {favourites.length === 0 ? (
            <LocalEmptyState
              icon={Heart}
              title="No favourites yet"
              description="Tap the heart on any store or maker card to save it. Your list stays on this device — handy when you shop the same neighbourhood again."
              country={user.country}
              currentCityId={locationId}
              maxMiles={maxMiles}
              secondaryAction={{
                label: "Browse stores nearby",
                onClick: () => {
                  setShowFavouritesOnly(false);
                  storesSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                },
              }}
            />
          ) : (
            <div className="space-y-3">
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {favourites.map((fav) => {
                  const inRange =
                    fav.kind === "store"
                      ? nearbyStores.some((s) => s.id === fav.id)
                      : makers.some((m) => m.maker.id === fav.id);
                  return (
                    <li
                      key={`${fav.kind}-${fav.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-3.5 py-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {fav.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {fav.kind === "store" ? "Store" : "Maker"}
                          {inRange
                            ? " · nearby now"
                            : " · outside current filters"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 px-3 text-xs sm:h-8"
                          onClick={() => {
                            setShowFavouritesOnly(true);
                            if (!inRange && maxMiles < 100) setMaxMiles(100);
                            const target =
                              fav.kind === "store"
                                ? storesSectionRef
                                : makersSectionRef;
                            window.setTimeout(() => {
                              target.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                              handleSelectPin(fav.id);
                            }, 50);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 text-rose-700 sm:size-9"
                          aria-label={`Remove ${fav.name} from favourites`}
                          onClick={() => {
                            toggleLocalFavourite({
                              kind: fav.kind,
                              id: fav.id,
                              name: fav.name,
                            });
                            showSuccess("Removed from favourites", fav.name);
                          }}
                        >
                          <Heart className="size-4 fill-current" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!showFavouritesOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full sm:h-9 sm:w-auto"
                  onClick={() => setShowFavouritesOnly(true)}
                >
                  <Heart className="size-3.5" />
                  Show only favourites nearby
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Products */}
        <section
          ref={productsSectionRef}
          id="local-products"
          className="mt-12 scroll-mt-24 sm:mt-14"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                3 · Products
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                Buy online or check locally
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Two clear paths per product — partner checkout when you need it
                now, or nearby stores when you&apos;d rather shop in person.
              </p>
            </div>
            {listings.length > 0 && (
              <Badge className="bg-emerald-800/10 font-normal text-emerald-900">
                {Math.min(listings.length, 12)} shown
              </Badge>
            )}
          </div>

          {listings.length === 0 ? (
            <Card className="border-dashed border-emerald-200/80 bg-emerald-50/30">
              <CardContent className="flex flex-col items-center px-3.5 py-10 text-center sm:py-12">
                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
                  <ShoppingBag className="size-5" />
                </span>
                <p className="font-medium">No local products in range</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Expand your radius or browse the full marketplace for more
                  eco options.
                </p>
                <div className="mt-4 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
                  {maxMiles < 50 && (
                    <Button
                      type="button"
                      className="h-11 sm:h-10"
                      onClick={() => setMaxMiles(50)}
                    >
                      Expand to {distanceOptionLabel(50, user.country)}
                    </Button>
                  )}
                  <Button
                    className="h-11 sm:h-10"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/marketplace" />}
                  >
                    Browse marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {listings.slice(0, 12).map(({ maker, product, distanceMi }) => {
                const isOnlineOpen = onlineProductId === product.id;
                return (
                  <Card
                    key={`${maker.id}-${product.id}`}
                    className={`border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      productParam === product.id
                        ? "border-emerald-400 ring-2 ring-emerald-200"
                        : "border-border/70"
                    }`}
                  >
                    <CardHeader className="px-3.5 pb-2 sm:px-6">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{product.category}</Badge>
                        <span className="text-xs font-medium text-emerald-800">
                          Maker {formatDistance(distanceMi, user.country)} away
                        </span>
                      </div>
                      {productParam === product.id && (
                        <Badge className="mt-2 w-fit bg-emerald-800 text-white">
                          From your photo match
                        </Badge>
                      )}
                      <CardTitle className="mt-2 text-lg">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3.5 sm:px-6">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Store className="size-3.5 text-primary" />
                        Listed with {maker.name}
                      </p>
                      <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        Availability not verified. Use Buy Online for partners,
                        or Check Local Stores to confirm in person.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="h-11 w-full justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] sm:h-9"
                          onClick={() => scrollToStores(product.name)}
                        >
                          <MapPin className="size-3.5" />
                          Check Local Stores
                        </Button>
                        <Button
                          variant={isOnlineOpen ? "secondary" : "outline"}
                          className="h-11 w-full justify-center gap-2 transition-transform active:scale-[0.98] sm:h-9"
                          onClick={() =>
                            setOnlineProductId(isOnlineOpen ? null : product.id)
                          }
                        >
                          <ShoppingBag className="size-3.5" />
                          {isOnlineOpen ? "Hide online options" : "Buy Online"}
                        </Button>
                      </div>
                      {isOnlineOpen && (
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                          <ProductPartnerLinks product={product} compact />
                          <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-heading text-lg font-semibold tabular-nums text-primary">
                              ${product.price.toFixed(2)}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                on Forest Buddies
                              </span>
                            </span>
                            <Button
                              className="h-11 sm:h-9"
                              onClick={() => handleAdd(product.id, product)}
                            >
                              {addedId === product.id ? "Added!" : "Add to cart"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Card className="mt-12 border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 sm:mt-14">
          <CardHeader className="px-3.5 text-center sm:px-6">
            <CardTitle className="text-xl text-emerald-950 sm:text-2xl">
              Shop closer, confirm first
            </CardTitle>
            <CardDescription className="mx-auto max-w-lg text-emerald-900/80">
              Buying nearby can cut shipping miles — just remember that store
              shelves change. Check in-store or on the retailer&apos;s site
              before you make the trip.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col justify-center gap-2 border-t-0 bg-transparent px-3.5 sm:flex-row sm:px-6">
            <Button
              className="h-11 w-full sm:h-9 sm:w-auto"
              nativeButton={false}
              render={<Link href="/marketplace" />}
            >
              Browse full marketplace
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full sm:h-9 sm:w-auto"
              nativeButton={false}
              render={<Link href="#local-stores" />}
            >
              Back to stores
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

