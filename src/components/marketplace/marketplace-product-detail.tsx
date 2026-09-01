"use client";

import { Leaf, X } from "lucide-react";
import { useEffect } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { MarketplaceProductImage } from "@/components/marketplace/marketplace-product-image";
import { ProductDetailsPanel } from "@/components/product/product-details-panel";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
import { ProductReviews } from "@/components/product/product-reviews";
import { TrustBadges } from "@/components/trust/trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAffiliateProduct } from "@/lib/commerce-type";
import {
  canAddProductToCart,
  DELIVERY_MODE_LABELS,
  isRentalListing,
  isServiceListing,
  listingTypeLabel,
} from "@/lib/listing-categories";
import type { Product } from "@/types";

export function MarketplaceProductDetail({
  product,
  onClose,
  onAdd,
  addedLabel,
  addLabel,
}: {
  product: Product;
  onClose: () => void;
  onAdd: () => void;
  addedLabel?: string;
  addLabel?: string;
}) {
  const isService = isServiceListing(product);
  const isRental = isRentalListing(product);
  const isAffiliate = isAffiliateProduct(product);
  const showAddToCart = canAddProductToCart(product);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const detailEyebrow = isService
    ? "Service details"
    : isRental
      ? "Rental details"
      : "Product details";

  const trustCopy = isAffiliate
    ? "Sold on Amazon via our Associates link — stock and fulfilment are handled by Amazon."
    : isService
      ? "Clear duration, delivery, and what’s included help you book the right session — once."
      : isRental
        ? "Check area and notes below, then contact or book when booking goes live."
        : "Clear materials, care, and sizing help you order once — and keep returns low for you and the planet.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-cream shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <MarketplaceBrandBadge className="text-[10px]" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {detailEyebrow}
              </p>
            </div>
            <h2 className="font-heading truncate text-lg font-semibold text-primary sm:text-xl">
              {product.name}
            </h2>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <MarketplaceProductImage
              imageUrl={product.imageUrl}
              name={product.name}
              size="detail"
              service={isService || isRental}
            />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-3xl font-semibold tabular-nums text-primary">
                £{product.price}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {isAffiliate ? (
                  <Badge className="bg-emerald-100 text-emerald-900">
                    Amazon affiliate
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className={
                      isService || isRental ? "bg-sky-100 text-sky-900" : undefined
                    }
                  >
                    {listingTypeLabel(product.listingType)}
                  </Badge>
                )}
                <Badge variant="outline">{product.category}</Badge>
                {isService && product.duration && (
                  <Badge variant="outline">{product.duration}</Badge>
                )}
                {isService && product.deliveryMode && (
                  <Badge variant="outline">
                    {DELIVERY_MODE_LABELS[product.deliveryMode]}
                  </Badge>
                )}
                {!isService && !isRental && (
                  <Badge
                    className={
                      product.sustainabilityScore >= 90
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gold/15 text-primary"
                    }
                  >
                    {product.sustainabilityScore}% eco
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-base leading-relaxed text-foreground/90">
            {product.description}
          </p>

          {(isService || isRental) && product.availabilityNote && (
            <p className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground/90">
              <span className="font-medium text-primary">
                {isRental ? "Area / notes: " : "Availability: "}
              </span>
              {product.availabilityNote}
            </p>
          )}

          {!isService &&
            !isRental &&
            (product.vehicleMake ||
              product.vehicleModel ||
              product.vehicleYear ||
              product.oemNote) && (
              <div className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground/90">
                <p className="font-medium text-primary">Fitment</p>
                <p className="mt-1">
                  {[product.vehicleMake, product.vehicleModel, product.vehicleYear]
                    .filter(Boolean)
                    .join(" · ") || "See OEM note"}
                </p>
                {product.oemNote ? (
                  <p className="mt-1 text-muted-foreground">
                    OEM / note: {product.oemNote}
                  </p>
                ) : null}
              </div>
            )}

          <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
            {trustCopy}
          </p>

          <TrustBadges variant="product" />

          {!isService && !isRental && isAffiliate && (
            <ProductPartnerLinks product={product} />
          )}

          {!isAffiliate && !isService && !isRental && (
            <ProductDetailsPanel
              details={product}
              category={product.category}
              fallbackSizeGuide={product.category === "Apparel"}
            />
          )}

          <ProductReviews
            productId={product.id}
            productName={product.name}
            listingType={isService ? "service" : "product"}
          />

          {showAddToCart && (
            <div className="sticky bottom-0 -mx-4 border-t border-border/60 bg-cream/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <Button
                size="lg"
                className="min-h-12 w-full gap-2 text-base"
                onClick={onAdd}
              >
                <Leaf className="size-4" />
                {addLabel ?? `Add to cart — £${product.price}`}
              </Button>
              {addedLabel && (
                <p className="mt-2 text-center text-sm text-emerald-800">
                  {addedLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
