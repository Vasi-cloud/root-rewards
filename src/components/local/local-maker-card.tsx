"use client";

import { ExternalLink, Globe, MapPin, Navigation } from "lucide-react";
import Link from "next/link";

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
  LOCAL_STOCK_DISCLAIMER,
  formatDistance,
  googleMapsDirectionsUrl,
  googleMapsStoreUrl,
  inferMakerType,
  visitMakerWebsiteUrl,
  type GeoPoint,
  type LocalMaker,
  type LocationCountry,
} from "@/lib/local-commerce";

type LocalMakerCardProps = {
  maker: LocalMaker;
  distanceMi: number;
  country: LocationCountry;
  from: GeoPoint;
  markerIndex?: number;
  saved?: boolean;
  onToggleFavourite?: () => void;
};

export function LocalMakerCard({
  maker,
  distanceMi,
  country,
  from,
  markerIndex,
  saved = false,
  onToggleFavourite,
}: LocalMakerCardProps) {
  const distance = formatDistance(distanceMi, country);
  const directionsUrl = googleMapsDirectionsUrl(maker, from);
  const mapsUrl = googleMapsStoreUrl(maker);
  const websiteUrl = visitMakerWebsiteUrl(maker) ?? mapsUrl;
  const makerType = inferMakerType(maker);
  const offers = maker.services.length > 0 ? maker.services : maker.tags;

  return (
    <Card
      id={`local-maker-${maker.id}`}
      className="flex flex-col border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md"
    >
      <CardHeader className="space-y-2.5 px-4 pb-2 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {markerIndex != null && (
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-800 text-[11px] font-bold text-cream sm:size-6">
                  {markerIndex}
                </span>
              )}
              <Badge
                variant="outline"
                className="gap-1 border-emerald-200/90 bg-emerald-50/80 text-[11px] font-medium text-emerald-950"
              >
                {makerType.label}
              </Badge>
              {saved && (
                <Badge className="bg-rose-100 text-[11px] font-medium text-rose-800">
                  Saved
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-snug sm:text-xl">
              {maker.name}
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
          {maker.address ?? maker.city}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 px-4 sm:px-6">
        <p className="text-sm leading-relaxed text-foreground/85">
          {maker.blurb}
        </p>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
            Typically offers
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {offers.slice(0, 4).map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="border-emerald-200/80 bg-white text-xs text-emerald-950"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
        {maker.hoursHint && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hours (approx.): {maker.hoursHint}
          </p>
        )}
        <p className="mt-auto rounded-lg border border-dashed border-amber-200/90 bg-amber-50/60 px-2.5 py-2 text-[11px] leading-relaxed text-amber-950/90">
          {LOCAL_STOCK_DISCLAIMER}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-4 pt-0 sm:px-6">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {maker.shopSlug ? (
            <Button
              className="h-12 w-full gap-2 sm:h-9 sm:flex-1"
              nativeButton={false}
              render={<Link href={`/shop/${maker.shopSlug}`} />}
            >
              View maker
              <ExternalLink className="size-3.5 opacity-80" />
            </Button>
          ) : (
            <Button
              className="h-12 w-full gap-2 sm:h-9 sm:flex-1"
              nativeButton={false}
              render={
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              View maker
              <ExternalLink className="size-3.5 opacity-80" />
            </Button>
          )}
          <Button
            variant="outline"
            className="h-12 w-full gap-2 sm:h-9 sm:flex-1"
            nativeButton={false}
            render={
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Navigation className="size-3.5" />
            Directions
          </Button>
        </div>
        {websiteUrl ? (
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
        ) : null}
      </CardFooter>
    </Card>
  );
}
