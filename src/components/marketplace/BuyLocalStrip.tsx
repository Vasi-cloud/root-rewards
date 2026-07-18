"use client";

import { HeartHandshake, MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BuyLocalStrip() {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-forest via-emerald-900 to-emerald-800 p-5 text-cream shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sage">
            <HeartHandshake className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Buy Local
            </span>
          </div>
          <h2 className="font-heading mt-1 text-xl font-semibold sm:text-2xl">
            Support eco businesses near you
          </h2>
          <p className="mt-1 max-w-xl text-sm text-cream/75">
            Filter makers by distance, explore a map preview, and keep impact in
            your neighborhood.
          </p>
        </div>
        <Button
          size="lg"
          className="shrink-0 gap-2 bg-cream text-forest hover:bg-cream/90"
          nativeButton={false}
          render={<Link href="/local" />}
        >
          <MapPin className="size-4" />
          Find local makers
        </Button>
      </div>
    </div>
  );
}
