"use client";

import { Leaf, X } from "lucide-react";
import { useEffect } from "react";

import { ProductDetailsPanel } from "@/components/product/product-details-panel";
import { ProductReviews } from "@/components/product/product-reviews";
import { TrustBadges } from "@/components/trust/trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DELIVERY_MODE_LABELS,
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
  const isService = product.listingType === "service";

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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isService ? "Service details" : "Product details"}
            </p>
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
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/5 sm:size-20">
              <Leaf className="size-8 text-primary sm:size-9" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-3xl font-semibold tabular-nums text-primary">
                ${product.price}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={isService ? "bg-sky-100 text-sky-900" : undefined}
                >
                  {listingTypeLabel(product.listingType)}
                </Badge>
                <Badge variant="outline">{product.category}</Badge>
                {isService && product.duration && (
                  <Badge variant="outline">{product.duration}</Badge>
                )}
                {isService && product.deliveryMode && (
                  <Badge variant="outline">
                    {DELIVERY_MODE_LABELS[product.deliveryMode]}
                  </Badge>
                )}
                <Badge
                  className={
                    product.sustainabilityScore >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gold/15 text-primary"
                  }
                >
                  {product.sustainabilityScore}% eco
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-base leading-relaxed text-foreground/90">
            {product.description}
          </p>

          <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
            {isService
              ? "Clear duration, delivery, and what’s included help you book the right session — once."
              : "Clear materials, care, and sizing help you order once — and keep returns low for you and the planet."}
          </p>

          <TrustBadges variant="product" />

          <ProductDetailsPanel
            details={product}
            fallbackSizeGuide={!isService && product.category === "Apparel"}
          />

          <ProductReviews
            productId={product.id}
            productName={product.name}
            listingType={isService ? "service" : "product"}
          />

          <div className="sticky bottom-0 -mx-4 border-t border-border/60 bg-cream/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <Button size="lg" className="min-h-12 w-full gap-2 text-base" onClick={onAdd}>
              <Leaf className="size-4" />
              {addLabel ??
                (isService
                  ? `Book session — $${product.price}`
                  : `Add to cart — $${product.price}`)}
            </Button>
            {addedLabel && (
              <p className="mt-2 text-center text-sm text-emerald-800">{addedLabel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
