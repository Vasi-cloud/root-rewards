"use client";

import { ExternalLink, Globe, MapPin, Navigation, Store } from "lucide-react";

import { LocalFavouriteButton } from "@/components/local/local-favourite-button";
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
  checkInStoreUrl,
  formatDistance,
  inferNearbyStoreType,
  visitWebsiteUrl,
  type LocationCountry,
  type NearbyStore,
} from "@/lib/local-commerce";
import { cn } from "@/lib/utils";

type LocalStoreCardProps = {
  store: NearbyStore;
  country: LocationCountry;
  focusLabel?: string | null;
  markerIndex?: number;
  saved?: boolean;
  /** Temporary Site voice help match highlight */
  highlighted?: boolean;
  onToggleFavourite?: () => void;
};

export function LocalStoreCard({
  store,
  country,
  focusLabel,
  markerIndex,
  saved = false,
  highlighted = false,
  onToggleFavourite,
}: LocalStoreCardProps) {
  const storeType = inferNearbyStoreType(store);
  const distance = formatDistance(store.distanceMi, country);
  const checkInUrl = checkInStoreUrl(store);
  const websiteUrl = visitWebsiteUrl(store);

  return (
    <Card
      id={`local-store-${store.id}`}
      data-voice-matched={highlighted ? "true" : undefined}
      className={cn(
        "flex flex-col border-border/70 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md",
        highlighted &&
          "z-[1] scale-[1.01] border-emerald-600 bg-emerald-50/50 shadow-[0_0_0_3px_rgba(5,150,105,0.45),0_10px_28px_rgba(5,150,105,0.22)] ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-cream"
      )}
    >
      <CardHeader className="space-y-2.5 px-4 pb-2 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {markerIndex != null && (
                <span className="flex size-7 items-center justify-center rounded-full bg-sky-700 text-[11px] font-bold text-cream sm:size-6">
                  {markerIndex}
                </span>
              )}
              {highlighted && (
                <Badge className="animate-pulse bg-emerald-700 font-semibold text-cream">
                  Matched
                </Badge>
              )}
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
              {saved && (
                <Badge className="bg-rose-100 text-[11px] font-medium text-rose-800">
                  Saved
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-snug sm:text-xl">
              {store.name}
            </CardTitle>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            <div className="min-w-[4.25rem] rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-2 text-center sm:min-w-0 sm:py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
                Distance
              </p>
              <p className="font-heading mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-emerald-950">
                <MapPin className="size-3.5 shrink-0" />
                ~{distance}
              </p>
            </div>
            {onToggleFavourite && (
              <LocalFavouriteButton saved={saved} onToggle={onToggleFavourite} />
            )}
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {store.address ?? store.city}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 px-4 sm:px-6">
        <p className="text-sm leading-relaxed text-foreground/85">
          {store.blurb}
        </p>
        {store.hoursHint ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hours (approx.): {store.hoursHint}
            {store.openNow === true
              ? " · listed as open now"
              : store.openNow === false
                ? " · may be closed now"
                : ""}
          </p>
        ) : store.openNow === true ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Listed as open now on Maps
          </p>
        ) : store.openNow === false ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            May be closed now — check their site
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-4 pt-0 sm:px-6">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            className="h-12 w-full gap-2 sm:h-9 sm:flex-1"
            nativeButton={false}
            render={
              <a
                href={checkInUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Check on site
            <ExternalLink className="size-3.5 opacity-80" />
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full gap-2 sm:h-9 sm:flex-1"
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
        </div>
        {websiteUrl && (
          <Button
            variant="ghost"
            className="h-11 w-full gap-2 text-emerald-950 sm:h-8"
            nativeButton={false}
            render={
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Globe className="size-3.5" />
            Visit website
            <ExternalLink className="size-3 opacity-70" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function LocalStoreCardSkeleton() {
  return (
    <Card className="border-border/50" aria-hidden>
      <CardHeader className="space-y-2.5 px-4 sm:px-6">
        <div className="flex justify-between gap-2">
          <div className="space-y-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-16 animate-pulse rounded-xl bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 sm:px-6">
        <div className="h-12 animate-pulse rounded-lg bg-muted/70" />
        <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-4 pt-0 sm:flex-row sm:px-6">
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted sm:h-9" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted sm:h-9" />
      </CardFooter>
    </Card>
  );
}
