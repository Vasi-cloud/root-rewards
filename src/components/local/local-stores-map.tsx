"use client";

import { MapPin, Navigation } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatDistance,
  pinPosition,
  type UserLocationOption,
} from "@/lib/local-commerce";
import { cn } from "@/lib/utils";

export type LocalMapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMi: number;
  kind: "you" | "store" | "maker";
  /** 1-based marker index for stores/makers (matches list order) */
  markerIndex?: number;
};

type LocalStoresMapProps = {
  user: UserLocationOption;
  pins: LocalMapPin[];
  placesEngine: string;
  onSelectPin?: (id: string) => void;
};

export function LocalStoresMap({
  user,
  pins,
  placesEngine,
  onSelectPin,
}: LocalStoresMapProps) {
  const live =
    placesEngine === "hybrid" ||
    placesEngine === "google-places" ||
    placesEngine === "forest-buddies";

  const listed = pins
    .filter((p) => p.kind !== "you")
    .slice()
    .sort((a, b) => a.distanceMi - b.distanceMi);

  return (
    <Card className="overflow-hidden border-border/70 bg-[#dfece4] p-0 lg:col-span-3">
      <div className="relative min-h-[320px] sm:min-h-[380px]">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 40% 30% at 20% 70%, rgba(149,213,178,0.55), transparent),
              radial-gradient(ellipse 35% 25% at 75% 30%, rgba(125,211,252,0.35), transparent),
              linear-gradient(160deg, #c5d9cc 0%, #e8f0ea 45%, #b8d4c4 100%)
            `,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(#1b4332 1px, transparent 1px), linear-gradient(90deg, #1b4332 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />

        <div className="relative flex h-full min-h-[320px] flex-col gap-1 p-3.5 sm:min-h-[380px] sm:gap-0 sm:p-5">
          <div className="z-10 flex flex-wrap items-center justify-between gap-2">
            <Badge className="gap-1 bg-cream/90 text-forest shadow-sm">
              <MapPin className="size-3" />
              Area preview
            </Badge>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] backdrop-blur-sm",
                live
                  ? "bg-emerald-900/80 text-cream"
                  : "bg-amber-900/75 text-amber-50"
              )}
            >
              {live
                ? "Google Places + local pins"
                : "Preview map · live Maps unavailable"}
            </span>
          </div>

          {!live && (
            <div
              role="status"
              className="z-10 mt-2 rounded-xl border border-amber-200/80 bg-cream/90 px-3 py-2 text-xs leading-relaxed text-forest shadow-sm"
            >
              Live Google Map isn’t configured here. You’re seeing approximate
              pins from your city and the stores listed below — distances stay
              estimates.
            </div>
          )}

          <div className="relative mt-2 min-h-[160px] flex-1 sm:min-h-[200px]">
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

              const indexLabel =
                pin.markerIndex != null ? String(pin.markerIndex) : "·";
              const isStore = pin.kind === "store";

              return (
                <button
                  key={pin.id}
                  type="button"
                  className="absolute z-10 -translate-x-1/2 -translate-y-full text-left"
                  style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                  title={`${pin.name} · ~${formatDistance(pin.distanceMi, user.country)}`}
                  onClick={() => onSelectPin?.(pin.id)}
                >
                  <span className="flex flex-col items-center">
                    <span className="mb-0.5 max-w-[7.5rem] truncate rounded-md bg-cream/95 px-1.5 py-0.5 text-[10px] font-medium text-forest shadow-sm">
                      {pin.name.split(/[\s&'/]/)[0]} · ~
                      {formatDistance(pin.distanceMi, user.country)}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border-2 border-cream text-[11px] font-bold shadow-md",
                        isStore
                          ? "bg-sky-700 text-cream"
                          : "bg-emerald-800 text-cream"
                      )}
                    >
                      {indexLabel}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="z-10 mt-3 space-y-2">
            <div className="flex flex-wrap gap-2 text-[11px] text-forest/80">
              <LegendDot className="bg-primary" label="You" />
              <LegendDot className="bg-sky-700" label="Store" />
              <LegendDot className="bg-emerald-800" label="Maker" />
            </div>

            {listed.length > 0 && (
              <ul className="flex max-h-[7.5rem] flex-col gap-1.5 overflow-y-auto rounded-xl border border-forest/10 bg-cream/85 p-2 shadow-sm sm:max-h-none sm:flex-row sm:flex-wrap sm:overflow-visible">
                {listed.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPin?.(pin.id)}
                      className={cn(
                        "flex w-full min-h-10 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors sm:w-auto sm:min-h-0",
                        pin.kind === "store"
                          ? "border-sky-200/90 bg-sky-50/90 text-sky-950 hover:bg-sky-100"
                          : "border-emerald-200/90 bg-emerald-50/90 text-emerald-950 hover:bg-emerald-100"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-cream",
                          pin.kind === "store" ? "bg-sky-700" : "bg-emerald-800"
                        )}
                      >
                        {pin.markerIndex ?? "·"}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {pin.name}
                      </span>
                      <span className="shrink-0 tabular-nums opacity-80">
                        ~{formatDistance(pin.distanceMi, user.country)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-forest/70 sm:text-xs">
              <Navigation className="mt-0.5 size-3 shrink-0 opacity-70" />
              Distances are approximate from {user.label}. Stock is never live —
              confirm with the store before you travel.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
