"use client";

import {
  ArrowLeft,
  Cog,
  Leaf,
  Loader2,
  Search,
  Sparkles,
  TreePine,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
import { PartOptionCard } from "@/components/parts/part-option-card";
import { PartsDisclaimers } from "@/components/parts/parts-disclaimers";
import {
  PhotoUpload,
  type PartPhoto,
} from "@/components/parts/photo-upload";
import { VehicleDetailsForm } from "@/components/parts/vehicle-details-form";
import { useAppToast } from "@/components/ui/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import { formatCartMoney } from "@/lib/cart-impact";
import {
  CONDITION_LABELS,
  formatVehicleLabel,
  inferPartKindFromPhotos,
  mockIdentifyPart,
  partOptionToCartProduct,
  type PartIdentificationResult,
  type PartOption,
  type VehicleDetails,
} from "@/lib/leafy-parts";

type Phase = "form" | "identifying" | "results";

const EMPTY_VEHICLE: VehicleDetails = {
  makeId: "",
  modelId: "",
  year: "",
  vin: "",
};

export default function LeafyPartsFinderPage() {
  const { addToCart } = useCart();
  const { showSuccess } = useAppToast();
  const resultsRef = useRef<HTMLElement>(null);

  const [photos, setPhotos] = useState<PartPhoto[]>([]);
  const [vehicle, setVehicle] = useState<VehicleDetails>(EMPTY_VEHICLE);
  const [phase, setPhase] = useState<Phase>("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<PartIdentificationResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (phase === "results" && result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase, result]);

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (photos.length === 0) {
      setFormError("Add at least one photo of the part.");
      return;
    }
    if (!vehicle.makeId || !vehicle.modelId || !vehicle.year) {
      setFormError("Select make, model, and year for your vehicle.");
      return;
    }

    setPhase("identifying");
    setResult(null);
    setAddedIds(new Set());

    const [{ kind, reason }] = await Promise.all([
      inferPartKindFromPhotos(photos),
      new Promise((r) => window.setTimeout(r, 1100)),
    ]);

    const next = mockIdentifyPart({
      details: vehicle,
      photoCount: photos.length,
      kind,
      inferReason: reason,
    });
    setResult(next);
    setPhase("results");
  }

  function handleAddToCart(option: PartOption) {
    if (!result) return;
    const product = partOptionToCartProduct(
      option,
      result.identified,
      result.vehicleLabel
    );
    addToCart(product, 1);
    setAddedIds((prev) => new Set(prev).add(option.id));
    const condition = CONDITION_LABELS[option.condition];
    showSuccess(
      `Added to cart · ${option.name}`,
      `${condition} · ${formatCartMoney(option.price)} · qty 1. This order will plant ${option.treesEstimate} tree${option.treesEstimate === 1 ? "" : "s"}.`,
      {
        accent: "cart",
        action: { label: "View cart & checkout", href: "/cart" },
      }
    );
  }

  function handleBuyOnline(option: PartOption) {
    const { url } = recordPartnerOutboundClick({
      platformId: "amazon",
      productId: option.id,
      productName: option.amazonSearch,
      listPrice: option.price,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function resetSearch() {
    setPhase("form");
    setResult(null);
    setFormError(null);
    setAddedIds(new Set());
  }

  const busy = phase === "identifying";

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.45),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <Cog className="size-3.5" />
            Leafy Parts Finder
          </Badge>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            First version
          </Badge>
        </div>

        <h1 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
          Leafy Parts Finder
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Snap the old part. Find the right replacement. Plant a tree.
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-200/80 bg-white/90 p-3.5 shadow-sm sm:p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
            <Leaf className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              Leafy says
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              We&apos;ll prioritise recycled and remanufactured options first —
              good for your wallet and the forest.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleIdentify(e)} className="mt-8 space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                1. Upload photos
              </CardTitle>
              <CardDescription>
                Clear shots of the part number, connectors, and overall shape
                work best.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                photos={photos}
                onChange={setPhotos}
                disabled={busy}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-xl">
                2. Your vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VehicleDetailsForm
                value={vehicle}
                onChange={setVehicle}
                disabled={busy}
              />
            </CardContent>
          </Card>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full gap-2.5 bg-emerald-800 text-base font-semibold text-cream shadow-lg shadow-emerald-900/20 hover:bg-emerald-900 sm:text-lg"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Identifying part…
              </>
            ) : (
              <>
                <Search className="size-5" />
                Identify Part
              </>
            )}
          </Button>

          <PartsDisclaimers />
        </form>

        {busy && (
          <div
            className="mt-10 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-10 text-center"
            aria-live="polite"
          >
            <Loader2 className="mx-auto size-10 animate-spin text-emerald-800" />
            <p className="font-heading mt-4 text-xl font-semibold text-emerald-950">
              Leafy is reading your photos…
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-emerald-900/80">
              Matching shapes, labels, and fitment for{" "}
              {formatVehicleLabel(vehicle)}.
            </p>
            <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2 text-left text-xs text-emerald-900/70">
              <p className="flex items-center gap-2">
                <Sparkles className="size-3.5" /> Comparing part silhouettes
              </p>
              <p className="flex items-center gap-2">
                <Sparkles className="size-3.5" /> Checking OEM cross-references
              </p>
              <p className="flex items-center gap-2">
                <TreePine className="size-3.5" /> Ranking sustainable options
              </p>
            </div>
          </div>
        )}

        {phase === "results" && result && (
          <section
            ref={resultsRef}
            id="parts-results"
            className="mt-12 scroll-mt-24 space-y-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 via-cream/40 to-transparent p-4 sm:p-6"
            aria-labelledby="parts-results-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                  Identification complete
                </p>
                <h2
                  id="parts-results-heading"
                  className="font-heading mt-1 text-2xl font-semibold text-primary sm:text-3xl"
                >
                  {result.identified.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  For {result.vehicleLabel} ·{" "}
                  <span className="font-medium text-foreground">
                    {result.identified.confidencePercent}% confidence
                  </span>{" "}
                  (mock estimate)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 bg-white/80"
                onClick={resetSearch}
              >
                <ArrowLeft className="size-4" />
                New search
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="size-16 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 sm:size-20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={`Uploaded photo ${i + 1}`}
                      className="size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <Card className="border-emerald-200/80 bg-white/95 shadow-sm">
              <CardContent className="space-y-2 pt-5 text-sm leading-relaxed text-foreground">
                <p>{result.identified.summary}</p>
                <p className="text-muted-foreground">
                  {result.identified.fitmentNote}
                </p>
                <p className="font-mono text-xs text-emerald-900">
                  OEM {result.identified.oemNumber} ·{" "}
                  {result.identified.category}
                </p>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Choose a replacement
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Three options — Recycled / Used (best eco choice),
                Remanufactured, and New. Each includes price, Add to Cart, Buy
                Online, and tree impact.
              </p>
            </div>

            <div className="space-y-4" data-testid="parts-options">
              {result.options.map((option) => (
                <PartOptionCard
                  key={option.id}
                  option={option}
                  identified={result.identified}
                  onAddToCart={handleAddToCart}
                  onBuyOnline={handleBuyOnline}
                  added={addedIds.has(option.id)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                render={<Link href="/cart" />}
                size="lg"
                className="h-12 flex-1 bg-emerald-800 text-cream hover:bg-emerald-900"
              >
                View cart
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/marketplace" />}
                variant="outline"
                size="lg"
                className="h-12 flex-1 bg-white/80"
              >
                Continue shopping
              </Button>
            </div>

            <PartsDisclaimers />
          </section>
        )}
      </div>
    </div>
  );
}
