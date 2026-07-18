"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ensureDemoShops, listPublicBrandShops } from "@/lib/seller-storage";
import type { SellerProfile } from "@/types";

/** Brand / company shops only — solos live in FeaturedSoloMakers. */
export function SellerShopsStrip() {
  const [shops, setShops] = useState<SellerProfile[]>([]);

  useEffect(() => {
    ensureDemoShops();
    setShops(listPublicBrandShops().slice(0, 6));
  }, []);

  if (shops.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-cream to-background p-4 sm:mb-8 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-900">
            <Store className="size-4 shrink-0" />
            <h2 className="font-heading text-lg font-semibold">Eco brand shops</h2>
          </div>
          <p className="mt-1 text-sm text-emerald-800/80">
            Curated studios and brands with story-led product catalogs.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/shop" />}
        >
          All shops
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {shops.map((shop) => (
          <Link
            key={shop.uid}
            href={`/shop/${shop.slug}`}
            className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
          >
            {shop.shopName}
          </Link>
        ))}
      </div>
    </div>
  );
}
