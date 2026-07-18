"use client";

import { Leaf, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/i18n-context";
import type { Product } from "@/types";

const rentalItems: Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerDay: number;
}> = [
  {
    id: "r1",
    name: "4-Person Camping Tent",
    description:
      "Waterproof, lightweight tent with recycled fabric. Perfect for weekend adventures.",
    category: "Camping",
    pricePerDay: 18,
  },
  {
    id: "r2",
    name: "Electric Bike",
    description:
      "Quiet e-bike with 60km range. Great for commuting or exploring trails.",
    category: "Mobility",
    pricePerDay: 32,
  },
  {
    id: "r3",
    name: "Professional Tool Kit",
    description:
      "Complete set of hand tools for home projects. Includes drill, saws, and more.",
    category: "Tools",
    pricePerDay: 22,
  },
  {
    id: "r4",
    name: "Zero-Waste Party Kit",
    description:
      "Reusable plates, cutlery, and decorations for up to 20 guests.",
    category: "Events",
    pricePerDay: 45,
  },
  {
    id: "r5",
    name: "Stand-Up Paddleboard",
    description:
      "Eco-friendly inflatable SUP with pump and leash. Ideal for lakes and rivers.",
    category: "Water Sports",
    pricePerDay: 28,
  },
  {
    id: "r6",
    name: "Portable Solar Generator",
    description:
      "500Wh battery with solar panels. Power your devices off-grid sustainably.",
    category: "Camping",
    pricePerDay: 25,
  },
];

export const RENTAL_COUNT = rentalItems.length;

/** Rentals section body — filters stay local to this section. */
export function MarketplaceRentals({
  onGoToAll,
}: {
  onGoToAll?: () => void;
}) {
  const { addToCart } = useCart();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [rentalDurations, setRentalDurations] = useState<Record<string, number>>(
    {}
  );
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(rentalItems.map((i) => i.category))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rentalItems.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
  };

  const activeFilters = (search ? 1 : 0) + (category !== "All" ? 1 : 0);

  return (
    <section id="rentals" className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 max-w-xl">
          <Badge className="mb-2 gap-1 bg-emerald-100 text-emerald-900">
            <RefreshCw className="size-3" />
            Rentals
          </Badge>
          <h2 className="font-heading text-xl font-semibold text-primary sm:text-2xl">
            {t("marketplace.rent.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("marketplace.rent.subtitle")} Borrow for a weekend instead of
            buying new.
          </p>
        </div>
        {onGoToAll && (
          <button
            type="button"
            onClick={onGoToAll}
            className="text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            All
          </button>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Search rentals
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tent, bike, tools…"
                className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
        <p
          key={`rental-results-${filtered.length}-${category}-${search}`}
          className="mt-3 text-sm text-muted-foreground"
        >
          Showing {filtered.length} rental{filtered.length === 1 ? "" : "s"}
          {activeFilters > 0 ? " matching filters" : ""}
          {" · "}
          weekly discount from 7 days
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No rentals match your filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={clearFilters}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const selectedDuration = rentalDurations[item.id] || 3;
            const totalPrice = Math.round(
              item.pricePerDay *
                selectedDuration *
                (selectedDuration >= 7 ? 0.85 : 1)
            );
            const cartId = `${item.id}-${selectedDuration}`;

            return (
              <Card
                key={item.id}
                className="flex flex-col border-emerald-200/80 bg-white/80"
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-emerald-100">
                    <Leaf className="size-6 text-emerald-700" />
                  </div>
                  <CardTitle className="font-heading text-lg">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pt-0">
                  <Badge variant="outline" className="mb-3 text-xs">
                    {item.category}
                  </Badge>
                  <div className="mb-3 text-xs font-medium tracking-wide text-emerald-700 uppercase">
                    {t("marketplace.rent.duration")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 3, 7, 14].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          setRentalDurations((prev) => ({
                            ...prev,
                            [item.id]: days,
                          }))
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs transition-all sm:text-sm ${
                          selectedDuration === days
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        {days} {days === 1 ? "day" : "days"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-emerald-700">
                    {selectedDuration >= 7 && (
                      <span className="font-medium">15% weekly discount · </span>
                    )}
                    Plants {Math.floor(selectedDuration / 3) + 1} trees with every
                    rental
                  </p>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-emerald-100 pt-3">
                  <div>
                    <div className="text-lg font-semibold tabular-nums text-emerald-800">
                      ${totalPrice}
                    </div>
                    <div className="-mt-0.5 text-[10px] text-emerald-600">
                      for {selectedDuration} day
                      {selectedDuration > 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800"
                    onClick={() => {
                      const rentalProduct: Product = {
                        id: cartId,
                        name: `${item.name} (${selectedDuration} days)`,
                        description: item.description,
                        price: totalPrice,
                        imageUrl: "/eco-tent.svg",
                        category: item.category,
                        sustainabilityScore: 95,
                        affiliateCommissionPercent: 8,
                        rentalDuration: selectedDuration,
                      };
                      addToCart(rentalProduct);
                      setJustAddedId(cartId);
                      setTimeout(() => setJustAddedId(null), 1400);
                    }}
                  >
                    {justAddedId === cartId
                      ? t("marketplace.rent.added")
                      : t("marketplace.rent.now")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
