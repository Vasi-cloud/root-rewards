"use client";

import { ArrowRight, MapPin, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SOLO_DOMAIN_CHIPS,
  type SoloDomainId,
} from "@/lib/listing-categories";
import { ensureDemoShops, listPublicSoloShops } from "@/lib/seller-storage";
import type { SellerProfile } from "@/types";

function shopMatchesDomain(shop: SellerProfile, domain: SoloDomainId): boolean {
  const offered = shop.servicesOffered?.toLowerCase() ?? "";
  const domainLower = domain.toLowerCase();
  if (offered.includes(domainLower)) return true;
  if (domain === "Repair & Upcycling" && offered.includes("repair")) return true;
  return shop.products.some(
    (p) => p.status === "approved" && p.category === domain
  );
}

/**
 * Self-employed / solo practices — kept separate from the brand strip
 * so Leaf Counsel and peers feel intentional, not squeezed into brand pills.
 */
export function FeaturedSoloMakers() {
  const [solos, setSolos] = useState<SellerProfile[]>([]);
  const [domain, setDomain] = useState<"all" | SoloDomainId>("all");

  useEffect(() => {
    ensureDemoShops();
    setSolos(listPublicSoloShops());
  }, []);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const chip of SOLO_DOMAIN_CHIPS) {
      counts[chip.id] = solos.filter((s) => shopMatchesDomain(s, chip.id)).length;
    }
    return counts;
  }, [solos]);

  const visible = useMemo(() => {
    if (domain === "all") return solos;
    return solos.filter((s) => shopMatchesDomain(s, domain));
  }, [solos, domain]);

  if (solos.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-xl">
          <div className="flex items-center gap-2 text-primary">
            <UserRound className="size-4 shrink-0" />
            <h2 className="font-heading text-lg font-semibold sm:text-xl">
              Featured solo makers
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-employed practices across legal, consulting, workshops, repair,
            wellness, garden, and home.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-primary"
          nativeButton={false}
          render={<Link href="/shop#solo-makers" />}
        >
          Browse solos
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDomain("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
            domain === "all"
              ? "bg-sky-800 text-white"
              : "border border-sky-200 bg-white text-sky-950 hover:bg-sky-50"
          }`}
        >
          All domains
          <span className="ml-1 tabular-nums opacity-70">({solos.length})</span>
        </button>
        {SOLO_DOMAIN_CHIPS.map((chip) => {
          const count = domainCounts[chip.id] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDomain(chip.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                domain === chip.id
                  ? "bg-sky-800 text-white"
                  : "border border-sky-200 bg-white text-sky-950 hover:bg-sky-50"
              }`}
            >
              {chip.label}
              <span className="ml-1 tabular-nums opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sky-200 px-4 py-8 text-center text-sm text-muted-foreground">
          No solo makers in this domain yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((shop) => {
            const services =
              shop.servicesOffered
                ?.split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 3) ?? [];
            const listingCount = shop.products.filter(
              (p) => p.status === "approved"
            ).length;

            return (
              <Link
                key={shop.uid}
                href={`/shop/${shop.slug}`}
                className="group flex flex-col rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/70 via-cream to-background p-4 transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge className="gap-1 bg-sky-100 text-sky-950">
                    <Sparkles className="size-3" />
                    Self-employed
                  </Badge>
                  {shop.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {shop.location}
                    </span>
                  )}
                </div>
                <h3 className="font-heading mt-3 text-xl font-semibold text-primary transition-colors group-hover:text-emerald-900">
                  {shop.tradingName || shop.shopName}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {shop.bio}
                </p>
                {services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {services.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s === "Repair & Upcycling" ? "Repair" : s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-sky-100 pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {listingCount} service
                    {listingCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    View practice
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
