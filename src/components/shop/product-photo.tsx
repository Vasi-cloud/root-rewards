"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { productGallery, productScene } from "@/lib/shop-presentation";
import { cn } from "@/lib/utils";
import type { SellerProduct } from "@/types";

export function ProductPhoto({
  product,
  className,
  priority,
  activeIndex = 0,
  showFrame = true,
}: {
  product: SellerProduct;
  className?: string;
  priority?: boolean;
  activeIndex?: number;
  showFrame?: boolean;
}) {
  const gallery = productGallery(product);
  const src = gallery[Math.min(activeIndex, gallery.length - 1)] ?? gallery[0];
  const scene = productScene(product);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        showFrame && "rounded-2xl",
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${scene.from}, ${scene.to})`,
      }}
    >
      {!failed ? (
        <Image
          src={src}
          alt={product.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 45vw"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className="size-24 rounded-full opacity-40"
            style={{ backgroundColor: scene.accent }}
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/15" />
    </div>
  );
}

export function ProductGallery({
  product,
  className,
}: {
  product: SellerProduct;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const gallery = productGallery(product);

  useEffect(() => {
    setActive(0);
  }, [product.id]);

  function step(delta: number) {
    setActive((i) => (i + delta + gallery.length) % gallery.length);
  }

  return (
    <div className={cn("space-y-3 sm:space-y-0 sm:flex sm:gap-3", className)}>
      {/* Etsy-style vertical thumbs on desktop */}
      {gallery.length > 1 && (
        <div className="hidden sm:flex sm:w-20 sm:shrink-0 sm:flex-col sm:gap-2">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                i === active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-75 hover:opacity-100"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative min-w-0 flex-1">
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 shadow-sm">
          <ProductPhoto
            product={product}
            activeIndex={active}
            priority
            showFrame={false}
          />
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-forest shadow-md backdrop-blur-sm transition hover:bg-cream"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-forest shadow-md backdrop-blur-sm transition hover:bg-cream"
                aria-label="Next photo"
              >
                <ChevronRight className="size-5" />
              </button>
              <div className="absolute right-3 bottom-3 rounded-full bg-forest/75 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                {active + 1} / {gallery.length}
              </div>
            </>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2 sm:hidden">
            {gallery.map((src, i) => (
              <button
                key={`m-${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1}`}
                className={cn(
                  "relative size-16 overflow-hidden rounded-lg border-2",
                  i === active ? "border-primary" : "border-transparent opacity-80"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
