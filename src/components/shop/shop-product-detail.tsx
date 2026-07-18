"use client";

import {
  BadgeCheck,
  Leaf,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect } from "react";

import { ProductDetailsPanel } from "@/components/product/product-details-panel";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductGallery } from "@/components/shop/product-photo";
import { TrustBadges } from "@/components/trust/trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DELIVERY_MODE_LABELS,
  listingTypeLabel,
} from "@/lib/listing-categories";
import type { SellerProduct } from "@/types";

export function ShopProductDetail({
  product,
  shopName,
  shopLocation,
  onClose,
  onAdd,
}: {
  product: SellerProduct;
  shopName: string;
  shopLocation?: string;
  onClose: () => void;
  onAdd: () => void;
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
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-border bg-cream shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {shopName}
              {shopLocation ? ` · ${shopLocation}` : ""}
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

        <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-2">
          <ProductGallery product={product} />

          <div className="flex flex-col space-y-5">
            <div>
              <p className="text-base text-muted-foreground">{product.subtitle}</p>
              <p className="font-heading mt-2 text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
                ${product.price.toFixed(2)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="gap-1 bg-emerald-100 text-emerald-900">
                  <Leaf className="size-3" />
                  Eco {product.ecoScore}
                </Badge>
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
                {product.stock > 0 ? (
                  <Badge className="border border-border bg-cream text-forest">
                    {isService
                      ? `${product.stock} slots open`
                      : `In stock · ${product.stock}`}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {isService ? "Fully booked" : "Sold out"}
                  </Badge>
                )}
                {product.sales > 0 && (
                  <Badge variant="secondary">
                    {product.sales} {isService ? "booked" : "sold"}
                  </Badge>
                )}
              </div>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              <li className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-emerald-800" />
                Verified listing
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-800" />
                {isService
                  ? "Moderated service story"
                  : "Moderated materials story"}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Leaf className="size-3.5 text-emerald-800" />
                Impact tracked on purchase
              </li>
            </ul>

            <TrustBadges variant="product" />

            <p className="text-base leading-relaxed text-foreground/90">
              {product.description}
            </p>

            {product.storySnippet && (
              <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="size-4 text-gold" />
                  {isService ? "Practitioner note" : "Maker note"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {product.storySnippet}
                </p>
              </div>
            )}

            {product.impactNote && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cream p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <Leaf className="size-4" />
                  Impact with this {isService ? "session" : "piece"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-emerald-900/85 sm:text-base">
                  {product.impactNote}
                </p>
              </div>
            )}

            <ProductDetailsPanel
              details={product}
              fallbackSizeGuide={!isService && product.category === "Apparel"}
            />

            <ProductReviews productId={product.id} productName={product.name} />

            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border/60 bg-cream/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
              <Button
                size="lg"
                className="min-h-12 w-full gap-2 text-base"
                disabled={product.stock < 1}
                onClick={onAdd}
              >
                <Leaf className="size-4" />
                {isService
                  ? `Book session — $${product.price.toFixed(2)}`
                  : `Add to cart — $${product.price.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
