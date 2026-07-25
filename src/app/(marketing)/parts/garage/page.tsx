"use client";

import {
  ArrowLeft,
  ChevronDown,
  Cog,
  Leaf,
  Trash2,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { useAppToast } from "@/components/ui/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearGarage,
  formatGarageDate,
  loadGarageParts,
  removePartFromGarage,
  subscribeGarage,
  type GaragePartItem,
} from "@/lib/leafy-parts-garage";
import { cn } from "@/lib/utils";

export default function LeafyPartsGaragePage() {
  const { showSuccess } = useAppToast();
  const [items, setItems] = useState<GaragePartItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setItems(loadGarageParts());
    refresh();
    return subscribeGarage(refresh);
  }, []);

  async function handleRemove(id: string, partName: string) {
    if (removingId) return;
    setRemovingId(id);
    await new Promise((r) => window.setTimeout(r, 220));
    removePartFromGarage(id);
    if (expandedId === id) setExpandedId(null);
    setRemovingId(null);
    showSuccess("Removed from Garage", `${partName} is no longer saved.`);
  }

  function handleClearAll() {
    if (items.length === 0) return;
    clearGarage();
    setExpandedId(null);
    showSuccess("Garage cleared", "All saved parts were removed from this device.");
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-7 pb-16 sm:px-6 sm:py-12">
        <div className="mb-3 flex items-start justify-between gap-2 sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <MarketplaceBrandBadge />
            <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
              <Warehouse className="size-3.5" />
              My Garage
            </Badge>
            <Badge
              variant="outline"
              className="font-normal text-muted-foreground"
            >
              This device
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              My Garage
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Parts saved from Leafy Parts Finder — ready to revisit on this
              device.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/parts" />}
            variant="outline"
            className="h-11 w-full shrink-0 gap-2 bg-white/95 shadow-xs transition-all active:scale-[0.98] sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            <span className="sm:hidden">Back to Finder</span>
            <span className="hidden sm:inline">Back to Parts Finder</span>
          </Button>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-200/80 bg-white/95 p-3.5 shadow-sm sm:mt-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
            <Leaf className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              Leafy says
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              Garage stays on this browser for now. Still confirm fitment before
              you buy or install — especially safety-critical parts.
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3 sm:mt-8">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "No saved parts yet"
              : `${items.length} saved part${items.length === 1 ? "" : "s"}`}
          </p>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-1.5 text-muted-foreground transition-all hover:text-destructive active:scale-[0.98]"
              onClick={handleClearAll}
            >
              <Trash2 className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-emerald-300/80 bg-emerald-50/40 px-4 py-12 text-center shadow-xs">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80">
              <Cog className="size-6" />
            </span>
            <p className="font-heading mt-4 text-lg font-semibold text-emerald-950">
              Garage is empty
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Identify a part, then tap{" "}
              <span className="font-medium text-foreground">Save to Garage</span>
              .
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/parts" />}
              className="mt-5 h-11 gap-2 bg-emerald-800 text-cream transition-all hover:bg-emerald-900 active:scale-[0.98]"
            >
              Open Parts Finder
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const open = expandedId === item.id;
              const removing = removingId === item.id;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-sm transition-opacity",
                    removing && "opacity-60"
                  )}
                >
                  <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {item.partName}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.vehicleLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saved {formatGarageDate(item.savedAt)}
                        {item.category ? ` · ${item.category}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 gap-2 bg-background transition-all active:scale-[0.98]"
                        aria-expanded={open}
                        disabled={removing}
                        onClick={() =>
                          setExpandedId(open ? null : item.id)
                        }
                      >
                        {open ? "Hide details" : "View details"}
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            open && "rotate-180"
                          )}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 gap-2 text-muted-foreground transition-all hover:text-destructive active:scale-[0.98]"
                        disabled={removing}
                        onClick={() => void handleRemove(item.id, item.partName)}
                      >
                        <Trash2 className="size-4" />
                        {removing ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="space-y-2.5 border-t border-border/60 bg-muted/20 px-3.5 py-3.5 text-sm sm:px-4">
                      <p className="leading-relaxed text-foreground">
                        <span className="font-semibold text-emerald-900">
                          Why it matched:{" "}
                        </span>
                        {item.matchExplanation}
                      </p>
                      <p className="leading-relaxed text-muted-foreground">
                        {item.summary}
                      </p>
                      <p className="break-all font-mono text-xs text-emerald-900">
                        OEM {item.oemNumber}
                        {item.confidencePercent
                          ? ` · Confidence ${item.confidencePercent}%`
                          : ""}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.fitmentNote}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
