"use client";

import {
  CalendarDays,
  LayoutGrid,
  Leaf,
  Mic,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { ReportProductButton } from "@/components/marketplace/ReportProductButton";
import { MarketplaceProductDetail } from "@/components/marketplace/marketplace-product-detail";
import { FeaturedSoloMakers } from "@/components/marketplace/FeaturedSoloMakers";
import { SellerShopsStrip } from "@/components/marketplace/SellerShopsStrip";
import { BuyLocalStrip } from "@/components/marketplace/BuyLocalStrip";
import { ProductRatingBadge } from "@/components/product/product-reviews";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
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
import { getPriceComparison } from "@/lib/price-comparison";
import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-catalog";
import { DELIVERY_MODE_LABELS, listingTypeLabel } from "@/lib/listing-categories";
import { hasProductSpecs } from "@/lib/product-details";
import type { CartItem, Product } from "@/types";

const MarketplaceRentals = lazy(() =>
  import("@/components/marketplace/MarketplaceRentals").then((m) => ({
    default: m.MarketplaceRentals,
  }))
);

/** Keep in sync with rentalItems in MarketplaceRentals */
const RENTAL_COUNT = 6;

const allProducts = MARKETPLACE_PRODUCTS;

type MarketSection = "all" | "products" | "services" | "rentals";

/** Minimal Web Speech API shape — avoids `any` on window / event handlers. */
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function isServiceListing(product: Product): boolean {
  return product.listingType === "service";
}

const PRODUCT_POOL = allProducts.filter((p) => !isServiceListing(p));
const SERVICE_POOL = allProducts.filter(isServiceListing);
const ALL_POOL = [...PRODUCT_POOL, ...SERVICE_POOL];

function poolForSection(section: MarketSection): Product[] {
  if (section === "services") return SERVICE_POOL;
  if (section === "all") return ALL_POOL;
  if (section === "products") return PRODUCT_POOL;
  return [];
}

function formatResultsLabel(
  section: MarketSection,
  products: number,
  services: number
): string {
  if (section === "all") {
    return `Showing ${products} product${products === 1 ? "" : "s"} · ${services} service${services === 1 ? "" : "s"}`;
  }
  if (section === "products") {
    return `Showing ${products} product${products === 1 ? "" : "s"}`;
  }
  if (section === "services") {
    return `Showing ${services} service${services === 1 ? "" : "s"}`;
  }
  return `Showing ${RENTAL_COUNT} rentals`;
}

export default function MarketplaceClient() {
  const { addToCart, cart } = useCart();
  const { t, lang } = useI18n(); // lang forces re-render on change
  const [section, setSection] = useState<MarketSection>("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minEcoScore, setMinEcoScore] = useState(70);
  const [bestDealsOnly, setBestDealsOnly] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetListingFilters = () => {
    setSelectedCategory("All");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setMinEcoScore(70);
    setBestDealsOnly(false);
  };

  const goToSection = (next: MarketSection) => {
    setSection(next);
    resetListingFilters();
  };

  const pool = poolForSection(section);

  const filteredListings = useMemo(() => {
    if (section === "rentals") return [];
    const term = debouncedSearchTerm.toLowerCase();
    return pool
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          (product.materials?.toLowerCase().includes(term) ?? false);
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;
        const matchesMinPrice = !minPrice || product.price >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || product.price <= Number(maxPrice);
        const matchesEco = product.sustainabilityScore >= minEcoScore;
        const comparison = getPriceComparison(product);
        const matchesBestDeal =
          !bestDealsOnly || (comparison?.isBestDeal ?? false);
        return (
          matchesSearch &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesEco &&
          matchesBestDeal
        );
      })
      .sort((a, b) => {
        // In All, keep products ahead of services for the main shopping feel
        if (section === "all") {
          const aSvc = isServiceListing(a) ? 1 : 0;
          const bSvc = isServiceListing(b) ? 1 : 0;
          if (aSvc !== bSvc) return aSvc - bSvc;
        }
        const aBest = getPriceComparison(a)?.isBestDeal ? 1 : 0;
        const bBest = getPriceComparison(b)?.isBestDeal ? 1 : 0;
        if (bBest !== aBest) return bBest - aBest;
        return b.sustainabilityScore - a.sustainabilityScore;
      });
  }, [
    section,
    pool,
    debouncedSearchTerm,
    selectedCategory,
    minPrice,
    maxPrice,
    minEcoScore,
    bestDealsOnly,
  ]);

  const shownProductCount = filteredListings.filter(
    (p) => !isServiceListing(p)
  ).length;
  const shownServiceCount = filteredListings.filter(isServiceListing).length;

  const categories = useMemo(
    () => Array.from(new Set(pool.map((p) => p.category))).sort(),
    [pool]
  );

  const bestDealCount = useMemo(
    () => pool.filter((p) => getPriceComparison(p)?.isBestDeal).length,
    [pool]
  );

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1400);
  };

  const cleanVoiceTranscript = (text: string): string => {
    const lower = text.toLowerCase().trim();
    const prefixes = [
      "show me",
      "find",
      "search for",
      "look for",
      "get me",
      "i want",
      "can you find",
      "please find",
      "show",
    ];
    let cleaned = lower;
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.slice(prefix.length).trim();
        break;
      }
    }
    const fillers = ["the", "a", "an", "some", "any", "please", "now"];
    return cleaned
      .split(/\s+/)
      .filter((w) => w && !fillers.includes(w))
      .join(" ");
  };

  const startVoiceSearch = () => {
    const SpeechRecognitionAPI = getSpeechRecognitionCtor();

    if (!SpeechRecognitionAPI) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const raw = event.results[0]?.[0]?.transcript ?? "";
      const cleaned = cleanVoiceTranscript(raw);
      setSearchTerm(cleaned || raw);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
  };

  const clearFilters = () => {
    resetListingFilters();
  };

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (selectedCategory !== "All" ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (minEcoScore !== 70 ? 1 : 0) +
    (bestDealsOnly ? 1 : 0);

  const sectionTabs: Array<{
    id: MarketSection;
    label: string;
    count: number;
    icon: typeof Package;
    hint: string;
  }> = [
    {
      id: "all",
      label: "All",
      count: ALL_POOL.length,
      icon: LayoutGrid,
      hint: "Products & services together — rentals one tap away",
    },
    {
      id: "products",
      label: "Products",
      count: PRODUCT_POOL.length,
      icon: Package,
      hint: "Shop sustainable goods",
    },
    {
      id: "services",
      label: "Services",
      count: SERVICE_POOL.length,
      icon: CalendarDays,
      hint: "Book sessions & makers",
    },
    {
      id: "rentals",
      label: "Rentals",
      count: RENTAL_COUNT,
      icon: RefreshCw,
      hint: "Borrow gear for a while",
    },
  ];

  const resultsLabel = formatResultsLabel(
    section,
    shownProductCount,
    shownServiceCount
  );

  void lang; // keep i18n subscription active

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <Badge variant="secondary" className="mb-3">
          <ShoppingBag className="mr-1 size-3" />
          Marketplace
        </Badge>
        <h1 className="font-heading text-2xl font-semibold text-primary sm:text-4xl">
          Shop sustainable products
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
          Start with everyday eco goods — then book services or rent gear when
          you need them.
          {" "}
          <Link
            href="/recommend"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Not sure what to get? Ask Leafy — or snap a photo with Grok Vision
          </Link>
          .
        </p>
      </div>

      {/* Section switcher — Products remains the default shopping home */}
      <div className="sticky top-14 z-40 -mx-3 mb-6 border-b border-border bg-cream/95 px-3 pt-2 backdrop-blur-sm sm:-mx-6 sm:mb-8 sm:px-6">
        <div
          role="tablist"
          aria-label="Marketplace sections"
          className="flex gap-0.5 overflow-x-auto sm:gap-1"
        >
          {sectionTabs.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goToSection(tab.id)}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-t-lg px-2 py-3 text-center transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:px-3 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${active ? "text-primary" : ""}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-xs sm:text-sm ${
                    active ? "font-bold tracking-tight" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>
                <span
                  className={`hidden tabular-nums sm:inline text-xs ${
                    active ? "font-semibold text-primary" : "opacity-60"
                  }`}
                >
                  ({tab.count})
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-primary sm:inset-x-2"
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className="py-2 text-center text-xs text-muted-foreground sm:text-left">
          {sectionTabs.find((t) => t.id === section)?.hint}
        </p>
      </div>

      {section === "all" && (
        <>
          <BuyLocalStrip />
          <SellerShopsStrip />

          <SectionHeading
            title="All listings"
            description="Products first, then services. Jump into a focused tab anytime."
            showAllLink={false}
            onGoToAll={() => goToSection("all")}
          />

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goToSection("products")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted sm:text-sm"
            >
              Products only
            </button>
            <button
              type="button"
              onClick={() => goToSection("services")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted sm:text-sm"
            >
              Services only
            </button>
            <button
              type="button"
              onClick={() => goToSection("rentals")}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 sm:text-sm"
            >
              Rentals ({RENTAL_COUNT})
            </button>
          </div>

          <ListingFilters
            searchLabel="Search all listings"
            searchPlaceholder={t("marketplace.search")}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onVoiceSearch={startVoiceSearch}
            isListening={isListening}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            minEcoScore={minEcoScore}
            onEcoScoreChange={setMinEcoScore}
            showBestDeals
            bestDealsOnly={bestDealsOnly}
            onBestDealsToggle={() => setBestDealsOnly((v) => !v)}
            bestDealCount={bestDealCount}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            ecoLabel={t("marketplace.filter.ecoscore")}
            categoryLabel={t("marketplace.filter.category")}
            minPriceLabel={t("marketplace.filter.minprice")}
            maxPriceLabel={t("marketplace.filter.maxprice")}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <div key={`results-${section}`}>{resultsLabel}</div>
            <div className="hidden md:block">{t("marketplace.sort")}</div>
          </div>

          <ListingGrid
            items={filteredListings}
            emptyLabel={t("marketplace.empty")}
            clearLabel={t("marketplace.clear")}
            onClear={clearFilters}
            justAddedId={justAddedId}
            cart={cart}
            t={t}
            onDetail={setDetailProduct}
            onAdd={handleAddToCart}
          />
        </>
      )}

      {section === "products" && (
        <>
          <BuyLocalStrip />
          <SellerShopsStrip />

          <SectionHeading
            title="Products"
            description="Browse and buy — filters apply to products only."
            onGoToAll={() => goToSection("all")}
          />

          <ListingFilters
            searchLabel="Search products"
            searchPlaceholder={t("marketplace.search")}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onVoiceSearch={startVoiceSearch}
            isListening={isListening}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            minEcoScore={minEcoScore}
            onEcoScoreChange={setMinEcoScore}
            showBestDeals
            bestDealsOnly={bestDealsOnly}
            onBestDealsToggle={() => setBestDealsOnly((v) => !v)}
            bestDealCount={bestDealCount}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            ecoLabel={t("marketplace.filter.ecoscore")}
            categoryLabel={t("marketplace.filter.category")}
            minPriceLabel={t("marketplace.filter.minprice")}
            maxPriceLabel={t("marketplace.filter.maxprice")}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <div key={`results-${section}-${shownProductCount}`}>
              {resultsLabel}
            </div>
            <div className="hidden md:block">{t("marketplace.sort")}</div>
          </div>

          <ListingGrid
            items={filteredListings}
            emptyLabel={t("marketplace.empty")}
            clearLabel={t("marketplace.clear")}
            onClear={clearFilters}
            justAddedId={justAddedId}
            cart={cart}
            t={t}
            onDetail={setDetailProduct}
            onAdd={handleAddToCart}
          />
        </>
      )}

      {section === "services" && (
        <>
          <FeaturedSoloMakers />

          <SectionHeading
            title="Services"
            description="Book legal, consulting, workshops, repair, and more — filters apply to services only."
            onGoToAll={() => goToSection("all")}
          />

          <ListingFilters
            searchLabel="Search services"
            searchPlaceholder="Legal, repair, workshop…"
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onVoiceSearch={startVoiceSearch}
            isListening={isListening}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            minEcoScore={minEcoScore}
            onEcoScoreChange={setMinEcoScore}
            showBestDeals={false}
            bestDealsOnly={false}
            onBestDealsToggle={() => undefined}
            bestDealCount={0}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            ecoLabel={t("marketplace.filter.ecoscore")}
            categoryLabel={t("marketplace.filter.category")}
            minPriceLabel={t("marketplace.filter.minprice")}
            maxPriceLabel={t("marketplace.filter.maxprice")}
          />

          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <div key={`results-${section}-${shownServiceCount}`}>
              {resultsLabel}
            </div>
            <div className="hidden md:block">Sorted by eco score</div>
          </div>

          <ListingGrid
            items={filteredListings}
            emptyLabel="No services match your current filters."
            clearLabel={t("marketplace.clear")}
            onClear={clearFilters}
            justAddedId={justAddedId}
            cart={cart}
            t={t}
            onDetail={setDetailProduct}
            onAdd={handleAddToCart}
          />
        </>
      )}

      {section === "rentals" && (
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-16 text-center text-sm text-muted-foreground">
              Loading rentals…
            </div>
          }
        >
          <MarketplaceRentals onGoToAll={() => goToSection("all")} />
        </Suspense>
      )}

      <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
        Cart is saved locally. Your items stay even after refresh. (Connect
        Firebase later for real inventory & orders.)
      </div>

      {detailProduct && (
        <MarketplaceProductDetail
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onAdd={() => {
            handleAddToCart(detailProduct);
          }}
          addLabel={
            justAddedId === detailProduct.id
              ? t("marketplace.added")
              : detailProduct.listingType === "service"
                ? `Book session — $${detailProduct.price}`
                : `Add to cart — $${detailProduct.price}`
          }
        />
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
  onGoToAll,
  showAllLink = true,
}: {
  title: string;
  description: string;
  onGoToAll: () => void;
  showAllLink?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-semibold text-primary sm:text-xl">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {showAllLink && (
        <button
          type="button"
          onClick={onGoToAll}
          className="text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          All
        </button>
      )}
    </div>
  );
}

function ListingFilters({
  searchLabel,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  onVoiceSearch,
  isListening,
  categories,
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minEcoScore,
  onEcoScoreChange,
  showBestDeals,
  bestDealsOnly,
  onBestDealsToggle,
  bestDealCount,
  activeFilterCount,
  onClearFilters,
  ecoLabel,
  categoryLabel,
  minPriceLabel,
  maxPriceLabel,
}: {
  searchLabel: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onVoiceSearch: () => void;
  isListening: boolean;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  minEcoScore: number;
  onEcoScoreChange: (v: number) => void;
  showBestDeals: boolean;
  bestDealsOnly: boolean;
  onBestDealsToggle: () => void;
  bestDealCount: number;
  activeFilterCount: number;
  onClearFilters: () => void;
  ecoLabel: string;
  categoryLabel: string;
  minPriceLabel: string;
  maxPriceLabel: string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {searchLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={onVoiceSearch}
              disabled={isListening}
              className={`absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 transition-all ${
                isListening
                  ? "animate-pulse bg-red-100 text-red-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label="Voice search"
            >
              <Mic className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:w-auto lg:flex lg:items-end">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {categoryLabel}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {minPriceLabel}
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {maxPriceLabel}
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="100"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {ecoLabel}:{" "}
              <span className="font-mono tabular-nums">{minEcoScore}</span>
            </label>
            <input
              type="range"
              min={50}
              max={100}
              step={1}
              value={minEcoScore}
              onChange={(e) => onEcoScoreChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {showBestDeals && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBestDealsToggle}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                bestDealsOnly
                  ? "border-gold bg-gold/20 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Tag className="size-3.5" />
              Best deals only
              <span className="tabular-nums opacity-70">({bestDealCount})</span>
            </button>
            <p className="text-xs text-muted-foreground">
              Compared with Amazon, Target, REI & more (demo prices).
            </p>
          </div>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1 self-start lg:self-auto"
          >
            <X className="size-4" /> Clear filters ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}

function ListingGrid({
  items,
  emptyLabel,
  clearLabel,
  onClear,
  justAddedId,
  cart,
  t,
  onDetail,
  onAdd,
}: {
  items: Product[];
  emptyLabel: string;
  clearLabel: string;
  onClear: () => void;
  justAddedId: string | null;
  cart: CartItem[];
  t: (key: string) => string;
  onDetail: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">{emptyLabel}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          {clearLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((product) => {
        const isAdded = justAddedId === product.id;
        const cartItem = cart.find((item) => item.id === product.id);
        const qtyInCart = cartItem?.quantity ?? 0;
        const comparison = getPriceComparison(product);
        const isService = isServiceListing(product);

        return (
          <Card
            key={product.id}
            className={`relative flex flex-col ${
              comparison?.isBestDeal
                ? "border-gold/60 bg-gold/5 shadow-sm"
                : "border-border/80"
            }`}
          >
            {comparison?.isBestDeal && !isService && (
              <div className="absolute -top-2 left-3 z-10 sm:left-4">
                <Badge className="gap-1 bg-gold text-primary shadow-sm">
                  <Tag className="size-3" />
                  Best deal
                </Badge>
              </div>
            )}
            <div className="absolute top-1.5 right-1.5 z-10">
              <ReportProductButton
                productId={product.id}
                productName={product.name}
                compact
              />
            </div>
            <CardHeader className="px-4 pt-5 sm:px-6">
              <div
                className={`mb-3 flex size-14 items-center justify-center rounded-2xl sm:mb-4 sm:size-16 ${
                  isService ? "bg-sky-100" : "bg-primary/5"
                }`}
              >
                <Leaf
                  className={`size-7 sm:size-8 ${
                    isService ? "text-sky-800" : "text-primary"
                  }`}
                />
              </div>
              <CardTitle className="font-heading text-lg leading-tight sm:text-xl">
                {product.name}
              </CardTitle>
              <ProductRatingBadge productId={product.id} className="mt-1" />
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
              {hasProductSpecs(product) && (
                <button
                  type="button"
                  onClick={() => onDetail(product)}
                  className="mt-2 text-left text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  {isService
                    ? "Session details & what’s included"
                    : "Materials, care & sizing"}
                </button>
              )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-2 px-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="outline">{product.category}</Badge>
                <Badge
                  variant="secondary"
                  className={
                    isService ? "bg-sky-100 text-sky-900" : "text-xs"
                  }
                >
                  {listingTypeLabel(product.listingType)}
                </Badge>
                {isService && product.duration && (
                  <Badge variant="outline" className="text-xs">
                    {product.duration}
                  </Badge>
                )}
                {isService && product.deliveryMode && (
                  <Badge variant="outline" className="text-xs">
                    {DELIVERY_MODE_LABELS[product.deliveryMode]}
                  </Badge>
                )}
                <Badge
                  className={
                    product.sustainabilityScore >= 90
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gold/15 text-primary"
                  }
                >
                  {product.sustainabilityScore}% eco
                </Badge>
                {!isService && (
                  <Badge variant="secondary" className="text-xs sm:ml-auto">
                    {product.affiliateCommissionPercent}% aff.
                  </Badge>
                )}
                {qtyInCart > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {t("marketplace.incart").replace(
                      "{qty}",
                      qtyInCart.toString()
                    )}
                  </Badge>
                )}
              </div>

              {comparison && !isService && (
                <div className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-2 text-xs">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                    {comparison.competitors.map((c) => (
                      <span key={c.store}>
                        {c.store}{" "}
                        <span className="line-through tabular-nums">
                          ${c.price}
                        </span>
                      </span>
                    ))}
                  </div>
                  {comparison.isBestDeal ? (
                    <p className="mt-1 font-medium text-emerald-700">
                      Save ${comparison.savings.toFixed(0)} vs lowest elsewhere
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      Lowest elsewhere: ${comparison.lowestCompetitor}
                    </p>
                  )}
                </div>
              )}
              {!isService && (
                <ProductPartnerLinks product={product} className="pt-0.5" />
              )}
              {isService && product.availabilityNote && (
                <p className="text-xs text-muted-foreground">
                  {product.availabilityNote}
                </p>
              )}
            </CardContent>

            <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t px-4 pt-4 sm:px-6">
              <span className="text-lg font-semibold tabular-nums text-primary sm:text-xl">
                ${product.price}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => onDetail(product)}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAdd(product)}
                  disabled={isAdded}
                  className={`min-h-11 px-4 text-base ${isAdded ? "bg-emerald-600 hover:bg-emerald-600" : ""}`}
                >
                  {isAdded
                    ? t("marketplace.added")
                    : isService
                      ? qtyInCart > 0
                        ? "Book another"
                        : "Book session"
                      : qtyInCart > 0
                        ? t("marketplace.addmore")
                        : t("marketplace.add")}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
