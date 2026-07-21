"use client";

import {
  ExternalLink,
  HeartHandshake,
  Leaf,
  MapPin,
  Navigation,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
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
import { useCart } from "@/contexts/cart-context";
import {
  DISTANCE_OPTIONS_MI,
  LOCAL_STOCK_DISCLAIMER,
  USER_LOCATION_OPTIONS,
  checkInStoreUrl,
  distanceOptionLabel,
  findNearbyRetailChains,
  formatDistance,
  getLocalListings,
  getNearbyMakers,
  pinPosition,
  retailChainToNearbyStore,
  type NearbyStore,
  type UserLocationOption,
} from "@/lib/local-commerce";
import { ensureDemoShops } from "@/lib/seller-storage";

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
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city");
  const productParam = searchParams.get("product");
  const storesSectionRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    ensureDemoShops();
  }, []);

  useEffect(() => {
    if (cityParam && USER_LOCATION_OPTIONS.some((l) => l.id === cityParam)) {
      setLocationId(cityParam);
    }
  }, [cityParam]);

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
          categoryHint: "grocery supermarket retail",
          productNames: focusProductName
            ? [focusProductName]
            : ["eco household", "sustainable grocery"],
          labels: ["Sainsbury's", "Tesco", "Waitrose"],
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
  }, [user, maxMiles, locationId, focusProductName]);

  useEffect(() => {
    void loadNearbyStores();
  }, [loadNearbyStores]);

  function handleAdd(productId: string, product: (typeof listings)[0]["product"]) {
    addToCart(product);
    setAddedId(productId);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  function scrollToStores(productName?: string) {
    if (productName) setFocusProductName(productName);
    storesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const mapPins = useMemo(() => {
    const pins: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      distanceMi: number;
      kind: "you" | "store" | "maker";
    }> = [
      {
        id: "you",
        name: "You",
        lat: user.lat,
        lng: user.lng,
        distanceMi: 0,
        kind: "you",
      },
    ];
    for (const s of nearbyStores) {
      pins.push({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        distanceMi: s.distanceMi,
        kind: "store",
      });
    }
    for (const { maker, distanceMi } of makers.slice(0, 4)) {
      if (pins.some((p) => p.id === maker.id)) continue;
      pins.push({
        id: maker.id,
        name: maker.name,
        lat: maker.lat,
        lng: maker.lng,
        distanceMi,
        kind: "maker",
      });
    }
    return pins;
  }, [user, nearbyStores, makers]);

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <HeartHandshake className="size-3.5" />
            Buy Local
          </Badge>
        </div>

        <h1 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-5xl">
          Shop local, confirm in store
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">
          Discover nearby retailers and makers — like a neighbourhood market,
          with clear next steps. We don&apos;t track live stock, so every visit
          starts with a quick check.
        </p>

        {/* Primary honest disclaimer */}
        <div
          role="status"
          className="mt-5 flex gap-3 rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:items-center"
        >
          <Store className="mt-0.5 size-5 shrink-0 text-amber-800 sm:mt-0" />
          <p className="font-medium leading-relaxed">{LOCAL_STOCK_DISCLAIMER}</p>
        </div>

        {/* Section jump — Etsy-style local discovery */}
        <nav
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Buy Local sections"
        >
          {[
            { href: "#local-stores", label: "Nearby stores" },
            { href: "#local-makers", label: "Makers" },
            { href: "#local-products", label: "Products" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-emerald-200/90 bg-white/80 px-3.5 py-1.5 text-sm font-medium text-emerald-950 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.98]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {highlightName && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm text-emerald-950">
            Focusing on stores near matches for{" "}
            <span className="font-semibold">{highlightName}</span>.
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <Card className="border-border/70 bg-white/90 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="size-4 text-primary" />
                Your area
              </CardTitle>
              <CardDescription>
                Choose a city to see nearby stores and distance. Maps uses
                Google Places when configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        maxMiles === mi
                          ? "border-emerald-800 bg-emerald-800 text-white"
                          : "border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100"
                      }`}
                    >
                      {mi >= 500
                        ? "Anywhere"
                        : distanceOptionLabel(mi, user.country)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
                <p className="font-medium">Near {user.label}</p>
                <p className="mt-1 text-emerald-800/85">
                  {storesLoading
                    ? "Finding stores…"
                    : `${nearbyStores.length} store${nearbyStores.length === 1 ? "" : "s"} · ${makers.length} maker${makers.length === 1 ? "" : "s"}`}
                  {placesEngine === "hybrid" || placesEngine === "google-places"
                    ? " · Google Maps"
                    : " · map preview"}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                  Buy online via partners, or check a store near you
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
          />
        </div>

        {/* Nearby stores */}
        <section ref={storesSectionRef} id="local-stores" className="mt-12 scroll-mt-24">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
              Nearby stores
            </p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
              Check stock in person
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Sainsbury’s, Tesco, Waitrose, and local makers — we show distance
              and a link to confirm availability. We never claim real-time stock.
            </p>
          </div>

          {storesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardHeader>
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 animate-pulse rounded-lg bg-muted/70" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : nearbyStores.length === 0 ? (
            <Card className="border-dashed border-emerald-200/80 bg-emerald-50/30">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
                  <MapPin className="size-5" />
                </span>
                <p className="font-medium text-foreground">
                  No stores in this radius
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Try widening the distance or switching cities — local options
                  often appear within 25 miles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyStores.map((store) => (
                <Card
                  key={store.id}
                  className="border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <Badge className="shrink-0 gap-1 bg-emerald-100 text-emerald-900">
                        <MapPin className="size-3" />
                        {formatDistance(store.distanceMi, user.country)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {store.address ?? store.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {store.blurb}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {store.openNow === true
                        ? "Listed as open now — still confirm stock before visiting."
                        : store.openNow === false
                          ? "May be closed now — check hours on their site."
                          : "Hours and stock not verified by Forest Buddies."}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-stretch gap-2 border-t-0 bg-transparent pt-0">
                    <Button
                      className="flex-1"
                      size="sm"
                      nativeButton={false}
                      render={
                        <a
                          href={checkInStoreUrl(store)}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      Check in-store
                      <ExternalLink className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <a
                          href={store.directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      Directions
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Eco makers */}
        {makers.length > 0 && (
          <section id="local-makers" className="mt-14 scroll-mt-24">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                Local makers
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                Eco businesses near you
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Independent makers — reach out to confirm pickup or stock.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {makers.map(({ maker, distanceMi }) => (
                <Card
                  key={maker.id}
                  className="border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{maker.name}</CardTitle>
                      <Badge className="shrink-0 gap-1 bg-emerald-100 text-emerald-900">
                        <MapPin className="size-3" />
                        {formatDistance(distanceMi, user.country)}
                      </Badge>
                    </div>
                    <CardDescription>{maker.city}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-foreground/85">
                      {maker.blurb}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {maker.services.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  {(maker.shopSlug || maker.address) && (
                    <CardFooter className="gap-2 border-t-0 bg-transparent">
                      {maker.shopSlug && (
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/shop/${maker.shopSlug}`} />}
                        >
                          Visit shop
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        nativeButton={false}
                        render={
                          <a
                            href={checkInStoreUrl({
                              name: maker.name,
                              address: maker.address,
                              city: maker.city,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        Check in-store
                        <ExternalLink className="size-3.5" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section id="local-products" className="mt-14 scroll-mt-24">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
              Shop nearby
            </p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
              Buy online or check locally
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Two clear paths per product — partner checkout when you need it
              now, or nearby stores when you&apos;d rather shop in person.
            </p>
          </div>

          {listings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <ShoppingBag className="mb-3 size-8 text-muted-foreground/60" />
                <p className="font-medium">No local products in range</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expand your radius or browse the full marketplace.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/marketplace" />}
                >
                  Browse marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <CardHeader className="pb-2">
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
                    <CardContent className="space-y-3">
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
                          size="sm"
                          className="w-full justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
                          onClick={() => scrollToStores(product.name)}
                        >
                          <MapPin className="size-3.5" />
                          Check Local Stores
                        </Button>
                        <Button
                          size="sm"
                          variant={isOnlineOpen ? "secondary" : "outline"}
                          className="w-full justify-center gap-2 transition-transform active:scale-[0.98]"
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
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                            <span className="font-heading text-lg font-semibold tabular-nums text-primary">
                              ${product.price.toFixed(2)}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                on Forest Buddies
                              </span>
                            </span>
                            <Button
                              size="sm"
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

        <Card className="mt-14 border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-950">
              Shop closer, confirm first
            </CardTitle>
            <CardDescription className="mx-auto max-w-lg text-emerald-900/80">
              Buying nearby can cut shipping miles — just remember that store
              shelves change. Check in-store or on the retailer&apos;s site
              before you make the trip.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center border-t-0 bg-transparent">
            <Button
              nativeButton={false}
              render={<Link href="/marketplace" />}
            >
              Browse full marketplace
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function LocalStoresMap({
  user,
  pins,
  placesEngine,
}: {
  user: UserLocationOption;
  pins: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    distanceMi: number;
    kind: "you" | "store" | "maker";
  }>;
  placesEngine: string;
}) {
  const live =
    placesEngine === "hybrid" ||
    placesEngine === "google-places" ||
    placesEngine === "forest-buddies";

  return (
    <Card className="overflow-hidden border-border/70 bg-[#dfece4] p-0 lg:col-span-3">
      <div className="relative min-h-[280px] sm:min-h-[340px]">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 40% 30% at 20% 70%, rgba(149,213,178,0.55), transparent),
              radial-gradient(ellipse 35% 25% at 75% 30%, rgba(125,211,252,0.35), transparent),
              linear-gradient(160deg, #c5d9cc 0%, #e8f0ea 45%, #b8d4c4 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(#1b4332 1px, transparent 1px), linear-gradient(90deg, #1b4332 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative flex h-full min-h-[280px] flex-col p-4 sm:min-h-[340px] sm:p-5">
          <div className="z-10 flex flex-wrap items-center justify-between gap-2">
            <Badge className="gap-1 bg-cream/90 text-forest shadow-sm">
              <MapPin className="size-3" />
              Nearby stores map
            </Badge>
            <span className="rounded-full bg-forest/70 px-2.5 py-1 text-[11px] text-cream backdrop-blur-sm">
              {live ? "Google Places + local pins" : "Demo pins · enable Maps API for live results"}
            </span>
          </div>

          <div className="relative mt-2 flex-1">
            {pins.map((pin) => {
              const pos = pinPosition(
                { lat: pin.lat, lng: pin.lng },
                user.country
              );
              if (pin.kind === "you") {
                return (
                  <div
                    key={pin.id}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="mb-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                        You
                      </span>
                      <span className="relative flex size-4">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40" />
                        <span className="relative inline-flex size-4 rounded-full border-2 border-cream bg-primary" />
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={pin.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-full"
                  style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                  title={`${pin.name} · ${formatDistance(pin.distanceMi, user.country)}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="mb-0.5 max-w-[7.5rem] truncate rounded-md bg-cream/95 px-1.5 py-0.5 text-[10px] font-medium text-forest shadow-sm">
                      {pin.name.split(/[\s&]/)[0]} ·{" "}
                      {formatDistance(pin.distanceMi, user.country)}
                    </span>
                    <MapPin
                      className={`size-6 drop-shadow ${
                        pin.kind === "store"
                          ? "fill-sky-600 text-sky-900"
                          : "fill-emerald-700 text-emerald-900"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="z-10 mt-auto pt-3 text-xs text-forest/70">
            Distances are approximate. Stock is never live — use Check in-store
            to verify with the retailer.
          </p>
        </div>
      </div>
    </Card>
  );
}
