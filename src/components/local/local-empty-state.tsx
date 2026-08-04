"use client";

import type { LucideIcon } from "lucide-react";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  USER_LOCATION_OPTIONS,
  distanceOptionLabel,
  type DistanceUnit,
  type LocationCountry,
} from "@/lib/local-commerce";
import { nextExpandMiles } from "@/lib/local-prefs";

type LocalEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  country: LocationCountry;
  /** Overrides country for distance chip labels */
  unit?: DistanceUnit;
  currentCityId: string;
  maxMiles: number;
  onExpandRadius?: (miles: number) => void;
  onSelectCity?: (cityId: string) => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export function LocalEmptyState({
  icon: Icon = MapPin,
  title,
  description,
  country,
  unit,
  currentCityId,
  maxMiles,
  onExpandRadius,
  onSelectCity,
  secondaryAction,
}: LocalEmptyStateProps) {
  const otherCities = USER_LOCATION_OPTIONS.filter(
    (c) => c.id !== currentCityId
  ).slice(0, 3);

  const labelUnit = unit ?? country;
  const nextRadius = nextExpandMiles(maxMiles);

  return (
    <Card className="border-dashed border-emerald-200/80 bg-emerald-50/30">
      <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-12">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
          <Icon className="size-5" />
        </span>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-5 flex w-full max-w-md flex-col gap-2.5">
          {nextRadius != null && onExpandRadius && (
            <Button
              type="button"
              className="h-11 w-full sm:h-10"
              onClick={() => onExpandRadius(nextRadius)}
            >
              Widen search to {distanceOptionLabel(nextRadius, labelUnit)}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:h-10"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>

        {onSelectCity && otherCities.length > 0 && (
          <div className="mt-5 w-full max-w-md">
            <p className="text-xs font-medium text-muted-foreground">
              Or try another city
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {otherCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectCity(city.id)}
                  className="min-h-11 rounded-full border border-emerald-200/90 bg-white px-3.5 py-2 text-sm font-medium text-emerald-950 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.98] sm:min-h-0 sm:py-1.5"
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
