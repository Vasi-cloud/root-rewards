"use client";

import {
  Bike,
  Leaf,
  MapPin,
  Navigation,
  Store,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalAvailabilityBadge } from "@/components/local/local-availability-badge";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
import { useCart } from "@/contexts/cart-context";
import {
  DISTANCE_OPTIONS_MI,
  STOCK_SIMULATION_DISCLAIMER,
  USER_LOCATION_OPTIONS,
  distanceOptionLabel,
  formatDistance,
  getLocalListings,
  getNearbyMakers,
  pinPosition,
  type UserLocationOption,
} from "@/lib/local-commerce";
import { ensureDemoShops } from "@/lib/seller-storage";

export default function BuyLocalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-14 text-muted-foreground">
          Loading local makers…
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

  const initialCity =
    USER_LOCATION_OPTIONS.find((l) => l.id === cityParam)?.id ??
    USER_LOCATION_OPTIONS[0].id;

  const [locationId, setLocationId] = useState(initialCity);
  const [maxMiles, setMaxMiles] = useState<(typeof DISTANCE_OPTIONS_MI)[number]>(50);
  const [addedId, setAddedId] = useState<string | null>(null);

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

  function handleAdd(productId: string, product: (typeof listings)[0]["product"]) {
    addToCart(product);
    setAddedId(productId);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge className="mb-3 gap-1 bg-emerald-800/10 text-emerald-900">
          <HeartHandshake className="size-3.5" />
          Buy Local
        </Badge>
        <h1 className="font-heading max-w-2xl text-3xl font-semibold text-primary sm:text-5xl">
          Keep good close to home
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">
          Discover eco makers near you — shorter miles, stronger communities,
          and products with a face behind them. Pick a mock location below
          (Maps / GPS can plug in later).
        </p>
        {highlightName && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm text-emerald-950">
            Showing makers that carry{" "}
            <span className="font-semibold">{highlightName}</span> first — from
            Ask Leafy vision / recommendations.
          </p>
        )}
        <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5 text-xs leading-relaxed text-amber-950 sm:text-sm">
          {STOCK_SIMULATION_DISCLAIMER} Partner links (Amazon, Target, REI)
          open search pages for comparison — they do not confirm real aisle
          stock.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm lg:col-span-2 sm:p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="local-city">
                Your area
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
              <p className="mb-2 text-sm font-medium">Show makers within</p>
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

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950">
              <p className="flex items-center gap-2 font-medium">
                <Navigation className="size-4" />
                Near {user.label}
              </p>
              <p className="mt-1 text-emerald-800/85">
                {makers.length} maker{makers.length === 1 ? "" : "s"} ·{" "}
                {listings.length} local listing
                {listings.length === 1 ? "" : "s"} within{" "}
                {maxMiles >= 500 ? "range" : `${maxMiles} miles`}.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Bike className="mt-0.5 size-4 shrink-0 text-primary" />
                Less shipping, more neighborhood resilience
              </li>
              <li className="flex gap-2">
                <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                Meet the people behind eco products
              </li>
              <li className="flex gap-2">
                <Store className="mt-0.5 size-4 shrink-0 text-primary" />
                Pickup, workshops, and repair — not just parcels
              </li>
            </ul>
          </div>

          <LocalMapPlaceholder user={user} maxMiles={maxMiles} />
        </div>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
                Nearby makers
              </p>
              <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
                Local eco businesses
              </h2>
            </div>
          </div>

          {makers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center text-muted-foreground">
              No makers in this radius — try widening the distance or switching
              cities.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {makers.map(({ maker, distanceMi }) => (
                <article
                  key={maker.id}
                  className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-lg font-semibold text-primary">
                      {maker.name}
                    </h3>
                    <Badge className="shrink-0 gap-1 bg-emerald-100 text-emerald-900">
                      <MapPin className="size-3" />
                      {formatDistance(distanceMi, user.country)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{maker.city}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/85">
                    {maker.blurb}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {maker.services.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  {maker.shopSlug && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/shop/${maker.shopSlug}`} />}
                    >
                      Visit shop page
                    </Button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/70">
              Shop nearby
            </p>
            <h2 className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl">
              Local picks within range
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Sorted by simulated availability, then distance — supporting these
              listings keeps dollars and impact in your community.
            </p>
          </div>

          {listings.length === 0 ? (
            <p className="text-muted-foreground">
              Expand your radius to see local products.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 12).map(
                ({ maker, product, distanceMi, availability }) => (
                <article
                  key={`${maker.id}-${product.id}`}
                  className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${
                    productParam === product.id
                      ? "border-emerald-400 ring-2 ring-emerald-200"
                      : "border-border/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">{product.category}</Badge>
                    <span className="text-xs font-medium text-emerald-800">
                      {formatDistance(distanceMi, user.country)} away
                    </span>
                  </div>
                  {productParam === product.id && (
                    <Badge className="mt-2 w-fit bg-emerald-800 text-white">
                      From your photo match
                    </Badge>
                  )}
                  <h3 className="font-heading mt-3 text-lg font-semibold text-primary">
                    {product.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Store className="size-3.5 text-primary" />
                    {maker.name}
                  </p>
                  <div className="mt-2">
                    <LocalAvailabilityBadge
                      availability={availability}
                      showNote
                    />
                  </div>
                  <div className="mt-3">
                    <ProductPartnerLinks product={product} />
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="font-heading text-xl font-semibold tabular-nums text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      disabled={availability.status === "out_of_stock"}
                      onClick={() => handleAdd(product.id, product)}
                    >
                      {availability.status === "out_of_stock"
                        ? "Unavailable"
                        : addedId === product.id
                          ? "Added!"
                          : availability.status === "pickup_only"
                            ? "Reserve pickup"
                            : "Add to cart"}
                    </Button>
                  </div>
                </article>
              )
              )}
            </div>
          )}
        </section>

        <div className="mt-14 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-6 py-8 text-center sm:px-10">
          <h2 className="font-heading text-2xl font-semibold text-emerald-950">
            Every local choice plants roots
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-emerald-900/80 sm:text-base">
            Buying nearby cuts freight emissions, funds makers you can meet, and
            keeps eco businesses thriving on your block — not just in a warehouse.
          </p>
          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/marketplace" />}
          >
            Browse full marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}

function LocalMapPlaceholder({
  user,
  maxMiles,
}: {
  user: UserLocationOption;
  maxMiles: number;
}) {
  const nearby = getNearbyMakers(user, maxMiles);
  const you = pinPosition(user, user.country);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-[#dfece4] shadow-sm lg:col-span-3">
      {/* Soft “map” terrain */}
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

      <div className="relative flex min-h-[280px] flex-col p-4 sm:min-h-[340px] sm:p-5">
        <div className="z-10 flex flex-wrap items-center justify-between gap-2">
          <Badge className="gap-1 bg-cream/90 text-forest shadow-sm">
            <MapPin className="size-3" />
            Map preview (demo)
          </Badge>
          <span className="rounded-full bg-forest/70 px-2.5 py-1 text-[11px] text-cream backdrop-blur-sm">
            Google Maps placeholder
          </span>
        </div>

        <div className="relative mt-2 flex-1">
          {/* You are here */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${you.left}%`, top: `${you.top}%` }}
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

          {nearby.map(({ maker, distanceMi }) => {
            const pos = pinPosition(maker, user.country);
            return (
              <div
                key={maker.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-full"
                style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                title={`${maker.name} · ${formatDistance(distanceMi, user.country)}`}
              >
                <div className="flex flex-col items-center">
                  <span className="mb-0.5 max-w-[7rem] truncate rounded-md bg-cream/95 px-1.5 py-0.5 text-[10px] font-medium text-forest shadow-sm">
                    {maker.name.split(" ")[0]} ·{" "}
                    {formatDistance(distanceMi, user.country)}
                  </span>
                  <MapPin className="size-6 fill-emerald-700 text-emerald-900 drop-shadow" />
                </div>
              </div>
            );
          })}
        </div>

        <p className="z-10 mt-auto pt-3 text-xs text-forest/70">
          Pins are illustrative. Wire real Google Maps / Places when you are
          ready — the distance logic already uses lat/lng.
        </p>
      </div>
    </div>
  );
}
