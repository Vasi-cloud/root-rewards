"use client";

import { Leaf, MapPin } from "lucide-react";

import { ProductPhoto } from "@/components/shop/product-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listingTypeLabel } from "@/lib/listing-categories";
import type { SellerProduct } from "@/types";

export function ShopProductCard({
  product,
  onOpen,
  onQuickAdd,
}: {
  product: SellerProduct;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  const isService = product.listingType === "service";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_12px_32px_-20px_rgba(27,67,50,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-22px_rgba(27,67,50,0.4)]">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="relative overflow-hidden">
          <ProductPhoto product={product} showFrame={false} />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge className="gap-1 bg-cream/95 text-forest shadow-sm">
              <Leaf className="size-3" />
              Eco {product.ecoScore}
            </Badge>
            <Badge
              className={
                isService
                  ? "bg-sky-100/95 text-sky-900 shadow-sm"
                  : "bg-cream/95 text-forest shadow-sm"
              }
            >
              {listingTypeLabel(product.listingType)}
            </Badge>
            {product.sales > 20 && (
              <Badge className="bg-gold text-forest shadow-sm">Bestseller</Badge>
            )}
          </div>
          {product.madeIn && (
            <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-forest/70 px-2.5 py-1 text-[11px] font-medium text-cream backdrop-blur-sm">
              <MapPin className="size-3" />
              {product.madeIn}
            </div>
          )}
        </div>
        <div className="space-y-2.5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-emerald-900 sm:text-xl">
              {product.name}
            </h3>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.storySnippet || product.subtitle || product.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-end justify-between gap-2 pt-1">
            <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
              ${product.price.toFixed(2)}
            </p>
            {product.sales > 0 && (
              <span className="text-xs text-muted-foreground">
                {product.sales} {isService ? "booked" : "sold"}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="mt-auto flex gap-2 border-t border-border/60 px-4 py-3 sm:px-5">
        <Button variant="outline" className="flex-1" onClick={onOpen}>
          View details
        </Button>
        <Button className="flex-1 gap-1.5" onClick={onQuickAdd}>
          <Leaf className="size-4" />
          {isService ? "Book" : "Add"}
        </Button>
      </div>
    </article>
  );
}
