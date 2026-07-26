"use client";

import { ExternalLink, MapPin, Navigation, Store } from "lucide-react";

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
import {
  LOCAL_STOCK_DISCLAIMER,
  checkInStoreUrl,
  formatDistance,
  inferNearbyStoreType,
  type LocationCountry,
  type NearbyStore,
} from "@/lib/local-commerce";

type LocalStoreCardProps = {
  store: NearbyStore;
  country: LocationCountry;
  focusLabel?: string | null;
};

export function LocalStoreCard({
  store,
  country,
  focusLabel,
}: LocalStoreCardProps) {
  const storeType = inferNearbyStoreType(store);
  const distance = formatDistance(store.distanceMi, country);

  return (
    <Card className="flex flex-col border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md">
      <CardHeader className="space-y-2.5 px-3.5 pb-2 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="gap-1 border-emerald-200/90 bg-emerald-50/80 text-[11px] font-medium text-emerald-950"
              >
                <Store className="size-3" />
                {storeType.label}
              </Badge>
              {focusLabel && (
                <Badge className="bg-sky-100 text-[11px] font-medium text-sky-950">
                  Ask for {focusLabel}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-snug sm:text-xl">
              {store.name}
            </CardTitle>
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
              Distance
            </p>
            <p className="font-heading mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-emerald-950">
              <MapPin className="size-3.5 shrink-0" />
              {distance}
            </p>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {store.address ?? store.city}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 px-3.5 sm:px-6">
        <p className="text-sm leading-relaxed text-foreground/85">
          {store.blurb}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {store.openNow === true
            ? "Listed as open now — still confirm stock before visiting."
            : store.openNow === false
              ? "May be closed now — check hours on their site."
              : "Hours and stock not verified by Forest Buddies."}
        </p>
        <p className="mt-auto rounded-lg border border-dashed border-amber-200/90 bg-amber-50/60 px-2.5 py-2 text-[11px] leading-relaxed text-amber-950/90">
          {LOCAL_STOCK_DISCLAIMER}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-3.5 pt-0 sm:flex-row sm:px-6">
        <Button
          className="h-11 w-full gap-2 sm:h-9 sm:flex-1"
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
          <ExternalLink className="size-3.5 opacity-80" />
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full gap-2 sm:h-9 sm:flex-1"
          nativeButton={false}
          render={
            <a
              href={store.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Navigation className="size-3.5" />
          Directions
        </Button>
      </CardFooter>
    </Card>
  );
}

export function LocalStoreCardSkeleton() {
  return (
    <Card className="border-border/50" aria-hidden>
      <CardHeader className="space-y-2.5 px-3.5 sm:px-6">
        <div className="flex justify-between gap-2">
          <div className="space-y-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-16 animate-pulse rounded-xl bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3.5 sm:px-6">
        <div className="h-12 animate-pulse rounded-lg bg-muted/70" />
        <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-3.5 pt-0 sm:flex-row sm:px-6">
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted sm:h-9" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted sm:h-9" />
      </CardFooter>
    </Card>
  );
}
