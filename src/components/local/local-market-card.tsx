"use client";

import {
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Tent,
} from "lucide-react";

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
  LOCAL_MARKET_VERIFY_HINT,
  formatDistance,
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
  type GeoPoint,
  type LocalMarket,
  type LocationCountry,
} from "@/lib/local-commerce";

type LocalMarketCardProps = {
  market: LocalMarket;
  distanceMi: number;
  country: LocationCountry;
  from: GeoPoint;
};

export function LocalMarketCard({
  market,
  distanceMi,
  country,
  from,
}: LocalMarketCardProps) {
  const distance = formatDistance(distanceMi, country);
  const directionsUrl = googleMapsDirectionsUrl(market, from);
  const mapsUrl = market.address
    ? googleMapsSearchUrl(market.address)
    : googleMapsSearchUrl(`${market.name} ${market.city}`);
  const websiteUrl = market.websiteUrl;

  return (
    <Card
      id={`local-market-${market.id}`}
      className="flex flex-col border-border/70 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md"
    >
      <CardHeader className="space-y-2.5 px-4 pb-2 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="gap-1 border-lime-300/90 bg-lime-50/90 text-[11px] font-medium text-lime-950"
              >
                <Tent className="size-3" />
                Market
              </Badge>
            </div>
            <CardTitle className="text-lg leading-snug sm:text-xl">
              {market.name}
            </CardTitle>
          </div>
          <div className="min-w-[4.25rem] shrink-0 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-2 text-center sm:min-w-0 sm:py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70">
              Distance
            </p>
            <p className="font-heading mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-emerald-950">
              <MapPin className="size-3.5 shrink-0" />
              ~{distance}
            </p>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {market.address ?? market.city}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 px-4 sm:px-6">
        <p className="text-sm leading-relaxed text-foreground/85">
          {market.blurb}
        </p>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-emerald-800" />
          <span>
            Typical days/hours: {market.hoursHint}
          </span>
        </p>
        {market.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {market.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-emerald-200/80 bg-white text-xs capitalize text-emerald-950"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
          {LOCAL_MARKET_VERIFY_HINT}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t-0 bg-transparent px-4 pt-0 sm:px-6">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
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
          {websiteUrl ? (
            <Button
              className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9 sm:flex-1"
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
              <ExternalLink className="size-3.5 opacity-80" />
            </Button>
          ) : (
            <Button
              className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-9 sm:flex-1"
              nativeButton={false}
              render={
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              Check on Maps
              <ExternalLink className="size-3.5 opacity-80" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
