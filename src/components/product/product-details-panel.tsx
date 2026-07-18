"use client";

import { CalendarClock, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";

import { SizeGuideTable } from "@/components/product/size-guide-table";
import { DELIVERY_MODE_LABELS } from "@/lib/listing-categories";
import { STANDARD_SIZE_CHART, hasProductSpecs } from "@/lib/product-details";
import type { ListingType, ServiceDeliveryMode, SizeChart } from "@/types";

export type ProductDetailsFields = {
  listingType?: ListingType;
  materials?: string;
  madeIn?: string;
  careNotes?: string;
  fitGuide?: string;
  dimensions?: string;
  sizeChart?: SizeChart;
  duration?: string;
  deliveryMode?: ServiceDeliveryMode;
  availabilityNote?: string;
};

export function ProductDetailsPanel({
  details,
  className = "",
  /** Show standard apparel guide when product has no chart (e.g. apparel category) */
  fallbackSizeGuide = false,
}: {
  details: ProductDetailsFields;
  className?: string;
  fallbackSizeGuide?: boolean;
}) {
  const isService = details.listingType === "service";
  const chart =
    !isService &&
    details.sizeChart &&
    details.sizeChart.rows.length > 0
      ? details.sizeChart
      : !isService && fallbackSizeGuide
        ? STANDARD_SIZE_CHART
        : undefined;

  const hasServiceMeta = Boolean(
    details.duration || details.deliveryMode || details.availabilityNote
  );

  if (!hasProductSpecs(details) && !chart && !hasServiceMeta) return null;

  const { materials, madeIn, careNotes, fitGuide, dimensions } = details;

  return (
    <div className={`space-y-4 ${className}`}>
      {isService && hasServiceMeta && (
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CalendarClock className="size-4 text-sky-800" />
            Session details
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {details.duration && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Duration
                </dt>
                <dd className="mt-0.5 text-foreground/90">{details.duration}</dd>
              </div>
            )}
            {details.deliveryMode && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Delivery
                </dt>
                <dd className="mt-0.5 text-foreground/90">
                  {DELIVERY_MODE_LABELS[details.deliveryMode]}
                </dd>
              </div>
            )}
            {details.availabilityNote && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Availability
                </dt>
                <dd className="mt-0.5 text-foreground/90">
                  {details.availabilityNote}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {!isService && (fitGuide || dimensions) && (
        <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Shirt className="size-4 text-emerald-800" />
            Fit &amp; sizing
          </p>
          {fitGuide && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {fitGuide}
            </p>
          )}
          {dimensions && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/80">Dimensions: </span>
              {dimensions}
            </p>
          )}
        </div>
      )}

      {chart && <SizeGuideTable chart={chart} />}

      {!isService && !chart && (
        <p className="text-xs text-muted-foreground">
          Need help with fit? See our{" "}
          <Link
            href="/returns#size-guide"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            size guide &amp; returns policy
          </Link>
          .
        </p>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {materials && (
          <div className="rounded-xl border bg-white/70 p-3.5">
            <dt className="font-medium text-primary">
              {isService ? "What’s included" : "Materials"}
            </dt>
            <dd className="mt-1.5 leading-relaxed text-muted-foreground">
              {materials}
            </dd>
          </div>
        )}
        {madeIn && (
          <div className="rounded-xl border bg-white/70 p-3.5">
            <dt className="font-medium text-primary">
              {isService ? "Based in / coverage" : "Made in"}
            </dt>
            <dd className="mt-1.5 text-muted-foreground">{madeIn}</dd>
          </div>
        )}
        {!isService && careNotes && (
          <div className="rounded-xl border bg-white/70 p-3.5 sm:col-span-2">
            <dt className="flex items-center gap-1.5 font-medium text-primary">
              <Sparkles className="size-3.5" />
              Care instructions
            </dt>
            <dd className="mt-1.5 leading-relaxed text-muted-foreground">
              {careNotes}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
