"use client";

import { CalendarClock, ExternalLink, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BOOKING_AVAILABILITY_DISCLAIMER,
  DEFAULT_BOOKING_NOTE,
  formatListingPrice,
  formatProviderLine,
  isRentalListing,
  isServiceListing,
} from "@/lib/listing-categories";
import type { Product } from "@/types";

export function ServiceRentalMeta({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const isService = isServiceListing(product);
  const isRental = isRentalListing(product);
  if (!isService && !isRental) return null;

  const provider = formatProviderLine(product);
  const area = product.areaServed?.trim() || product.availabilityNote?.trim();
  const period = isService
    ? product.duration?.trim()
    : product.hirePeriod?.trim();
  const priceLabel = formatListingPrice(product.price, product.priceNote);

  if (compact) {
    return (
      <div className="space-y-1 text-xs text-muted-foreground">
        {provider ? <p className="font-medium text-foreground/80">{provider}</p> : null}
        {area ? <p>Area · {area}</p> : null}
        {period ? (
          <p>{isService ? `Duration · ${period}` : `Hire · ${period}`}</p>
        ) : null}
        {isRental && product.depositAmount != null && product.depositAmount > 0 ? (
          <p>Deposit · £{product.depositAmount}</p>
        ) : null}
        <p className="font-semibold tabular-nums text-primary">{priceLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-foreground/90">
      {provider ? (
        <p>
          <span className="font-medium text-primary">Provider: </span>
          {provider}
        </p>
      ) : null}
      {area ? (
        <p>
          <span className="font-medium text-primary">Area served: </span>
          {area}
        </p>
      ) : null}
      {period ? (
        <p>
          <span className="font-medium text-primary">
            {isService ? "Duration: " : "Hire period: "}
          </span>
          {period}
        </p>
      ) : null}
      <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
        {priceLabel}
      </p>
      {isRental && product.depositAmount != null && product.depositAmount > 0 ? (
        <p className="text-muted-foreground">
          Deposit £{product.depositAmount} (confirm with provider)
        </p>
      ) : null}
    </div>
  );
}

export function ServiceRentalBookingBlock({ product }: { product: Product }) {
  const isService = isServiceListing(product);
  const isRental = isRentalListing(product);
  if (!isService && !isRental) return null;

  const bookingNote =
    product.bookingNote?.trim() || DEFAULT_BOOKING_NOTE;
  const bookingUrl = product.bookingUrl?.trim();
  const contactEmail = product.contactEmail?.trim();

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-primary">
        <CalendarClock className="size-4 shrink-0" />
        <h3 className="font-heading text-base font-semibold">Booking</h3>
      </div>

      {bookingUrl ? (
        <Button
          type="button"
          className="min-h-11 w-full gap-2"
          onClick={() =>
            window.open(bookingUrl, "_blank", "noopener,noreferrer")
          }
        >
          Request a time
          <ExternalLink className="size-3.5 opacity-80" />
        </Button>
      ) : null}

      <p className="text-sm leading-relaxed text-muted-foreground">
        {bookingNote}
      </p>

      {contactEmail ? (
        <a
          href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
            `Book: ${product.name}`
          )}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          <Mail className="size-4" />
          Email to book
        </a>
      ) : null}

      {(product.whatsIncluded || product.whatsNotIncluded) && (
        <div className="grid gap-3 border-t border-border/60 pt-3 text-sm sm:grid-cols-2">
          {product.whatsIncluded ? (
            <div>
              <p className="font-medium text-primary">What&apos;s included</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {product.whatsIncluded}
              </p>
            </div>
          ) : null}
          {product.whatsNotIncluded ? (
            <div>
              <p className="font-medium text-primary">What&apos;s not included</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {product.whatsNotIncluded}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <p className="border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
        {BOOKING_AVAILABILITY_DISCLAIMER}
      </p>
    </div>
  );
}
