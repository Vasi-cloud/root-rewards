"use client";

import { Heart, Leaf, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { shopInitials, trustTierLabel } from "@/lib/shop-trust";
import type { SellerProfile } from "@/types";

export function ShopHero({
  shop,
  listingCount,
}: {
  shop: SellerProfile;
  listingCount: number;
}) {
  const cover = shop.coverImageUrl ?? "/shop/cover-grove.svg";
  const initials = shopInitials(shop.shopName);

  return (
    <header className="animate-fb-fade-up">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/shop" className="transition-colors hover:text-primary">
          Shops
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">{shop.shopName}</span>
      </nav>

      <div className="overflow-hidden rounded-[1.75rem] border border-border/50 bg-card shadow-[0_20px_50px_-28px_rgba(27,67,50,0.45)]">
        <div className="relative h-52 w-full sm:h-64 md:h-72">
          <Image
            src={cover}
            alt={`${shop.shopName} shop cover`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-forest/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 bg-cream/15 text-cream backdrop-blur-md">
                <Leaf className="size-3" />
                {shop.sellerType === "individual"
                  ? "Self-employed seller"
                  : "Verified eco shop"}
              </Badge>
              {shop.trustTier && (
                <Badge className="bg-sage/20 text-cream backdrop-blur-md">
                  {trustTierLabel(shop.trustTier)}
                </Badge>
              )}
              {shop.location && (
                <Badge className="gap-1 bg-black/20 text-cream backdrop-blur-md">
                  <MapPin className="size-3" />
                  {shop.location}
                </Badge>
              )}
            </div>
            <h1 className="font-heading mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-cream sm:text-5xl md:text-6xl">
              {shop.shopName}
            </h1>
          </div>
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-8 mb-5 flex items-end gap-4 sm:-mt-10">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-4 border-cream bg-gradient-to-br from-emerald-800 to-forest font-heading text-xl font-semibold text-cream shadow-md sm:size-20 sm:text-2xl"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                {shop.sellerType === "individual"
                  ? "Self-employed practice"
                  : "Independent maker"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {listingCount} curated listing{listingCount === 1 ? "" : "s"} ·
                story-led · impact-backed
              </p>
            </div>
          </div>

          <p className="max-w-3xl text-base leading-relaxed text-foreground/90 sm:text-lg">
            {shop.bio}
          </p>

          {shop.founderNote && (
            <p className="mt-4 flex max-w-3xl gap-2.5 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-foreground/85 sm:text-base">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                <span className="font-semibold text-primary">
                  {shop.sellerType === "individual"
                    ? "Practitioner note. "
                    : "Maker note. "}
                </span>
                {shop.founderNote}
              </span>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {shop.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                Based in {shop.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="size-4 text-primary" />
              {shop.sellerType === "individual"
                ? "Products & services welcome"
                : "Materials & origin on every listing"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4 text-primary" />
              A share of sales funds verified causes
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
