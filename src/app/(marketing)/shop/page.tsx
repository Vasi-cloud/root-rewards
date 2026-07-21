"use client";

import { Leaf, MapPin, Store, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultProductImage } from "@/lib/shop-presentation";
import {
  ensureDemoShops,
  listPublicBrandShops,
  listPublicSoloShops,
} from "@/lib/seller-storage";
import type { SellerProfile } from "@/types";

function ShopCard({
  shop,
  accent = "brand",
}: {
  shop: SellerProfile;
  accent?: "brand" | "solo";
}) {
  const approved = shop.products.filter((p) => p.status === "approved");
  const preview = approved[0];
  const cover = shop.coverImageUrl ?? "/shop/cover-grove.svg";
  const isSolo = accent === "solo";

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className={`group overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-md ${
        isSolo ? "border-sky-200/80" : "border-border/70"
      }`}
    >
      <div className="relative h-40 w-full sm:h-48">
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/70 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge
            className={
              isSolo
                ? "bg-sky-100/95 text-sky-950"
                : "bg-cream/95 text-forest"
            }
          >
            {isSolo ? "Self-employed" : "Brand"}
          </Badge>
        </div>
        <div className="absolute right-4 bottom-4 left-4">
          <h2 className="font-heading text-2xl font-semibold text-cream">
            {shop.tradingName || shop.shopName}
          </h2>
          {shop.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-cream/80">
              <MapPin className="size-3.5" />
              {shop.location}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <p className="line-clamp-2 text-sm text-muted-foreground">{shop.bio}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {isSolo ? (
              <UserRound className="size-3.5" />
            ) : (
              <Store className="size-3.5" />
            )}
            {approved.length} listing{approved.length === 1 ? "" : "s"}
          </span>
          {preview && (
            <div className="relative size-12 overflow-hidden rounded-lg border">
              <Image
                src={defaultProductImage(preview)}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
        </div>
        <Button size="sm" className="pointer-events-none w-full">
          {isSolo ? "View practice" : "Enter shop"}
        </Button>
      </div>
    </Link>
  );
}

export default function ShopsIndexPage() {
  const [brands, setBrands] = useState<SellerProfile[]>([]);
  const [solos, setSolos] = useState<SellerProfile[]>([]);

  useEffect(() => {
    ensureDemoShops();
    setBrands(listPublicBrandShops());
    setSolos(listPublicSoloShops());
  }, []);

  const empty = brands.length === 0 && solos.length === 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sage/20 via-cream to-cream">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="bg-emerald-800/10 font-normal text-emerald-900">
            Seller shops
          </Badge>
        </div>
        <h1 className="font-heading max-w-2xl text-3xl font-semibold text-primary sm:text-5xl">
          Meet makers with a story
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Eco brands with curated catalogs, plus self-employed practices for
          legal, consulting, and workshops — each on their own terms.
        </p>

        {brands.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex items-center gap-2 text-primary">
              <Store className="size-4" />
              <h2 className="font-heading text-xl font-semibold sm:text-2xl">
                Eco brand shops
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {brands.map((shop) => (
                <ShopCard key={shop.uid} shop={shop} accent="brand" />
              ))}
            </div>
          </section>
        )}

        {solos.length > 0 && (
          <section id="solo-makers" className="mt-14 scroll-mt-24">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <UserRound className="size-4" />
              <h2 className="font-heading text-xl font-semibold sm:text-2xl">
                Featured solo makers
              </h2>
            </div>
            <p className="mb-5 max-w-xl text-sm text-muted-foreground">
              Legal, consulting, workshops, repair, wellness, garden, and home —
              one-person practices with the same impact-backed care as brand shops.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {solos.map((shop) => (
                <ShopCard key={shop.uid} shop={shop} accent="solo" />
              ))}
            </div>
          </section>
        )}

        {empty && (
          <div className="mt-12 text-center text-muted-foreground">
            <Leaf className="mx-auto mb-3 size-8 text-primary" />
            No public shops yet.
          </div>
        )}
      </div>
    </div>
  );
}
