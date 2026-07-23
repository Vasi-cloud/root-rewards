"use client";

import {
  ArrowLeft,
  Cog,
  Leaf,
  Loader2,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/cart-context";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import { formatCartMoney } from "@/lib/cart-impact";
import {
  CONDITION_LABELS,
  PART_KIND_OPTIONS,
  PARTS_MOCK_AI_NOTE,
  formatVehicleLabel,
  inferPartKindFromPhotos,
  mockIdentifyPart,
  partOptionToCartProduct,
  type PartIdentificationResult,
  type PartKind,
  type PartOption,
  type VehicleDetails,
} from "@/lib/leafy-parts";
import { cn } from "@/lib/utils";

type Phase = "form" | "identifying" | "results";

const EMPTY_VEHICLE: VehicleDetails = {
  makeId: "",
  modelId: "",
  year: "",
  vin: "",
};

const selectClass =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm";

export default function LeafyPartsFinderPage() {
  const { addToCart } = useCart();
  const { showSuccess } = useAppToast();
  const resultsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [photos, setPhotos] = useState<PartPhoto[]>([]);
  const [vehicle, setVehicle] = useState<VehicleDetails>(EMPTY_VEHICLE);
  const [phase, setPhase] = useState<Phase>("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<PartIdentificationResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (phase === "results" && result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase, result]);

  useEffect(() => {
    if (phase !== "identifying") {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((s) => (s + 1) % 3);
    }, 700);
    return () => window.clearInterval(id);
  }, [phase]);

  async function runIdentify(kindOverride?: PartKind) {
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

    const inference = kindOverride
      ? {
          kind: kindOverride,
          reason: "",
          scoreStrength: 0.88,
        }
      : await inferPartKindFromPhotos(photos);

    await new Promise((r) => window.setTimeout(r, kindOverride ? 600 : 1200));

    const next = mockIdentifyPart({
      details: vehicle,
      photoCount: photos.length,
      kind: inference.kind,
      inferReason: inference.reason,
      scoreStrength: inference.scoreStrength,
      overridden: Boolean(kindOverride),
    });
    setResult(next);
    setPhase("results");
  }

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    await runIdentify();
  }

  function handleOverride(kind: PartKind) {
    void runIdentify(kind);
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
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const busy = phase === "identifying";
  const confidence = result?.identified.confidencePercent ?? 0;

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.45),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-6 sm:py-12">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <Cog className="size-3.5" />
            Leafy Parts Finder
          </Badge>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Mock AI · v1
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

        <form
          ref={formRef}
          onSubmit={(e) => void handleIdentify(e)}
          className={cn(
            "mt-8 space-y-5 sm:space-y-6",
            phase === "results" && "opacity-90"
          )}
        >
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1.5 p-4 sm:p-6">
              <CardTitle className="font-heading text-xl">
                1. Upload photos
              </CardTitle>
              <CardDescription>
                Clear shots of the part number, connectors, and overall shape
                work best.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <PhotoUpload
                photos={photos}
                onChange={setPhotos}
                disabled={busy}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1.5 p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="font-heading text-xl">
                2. Your vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                Analysing…
              </>
            ) : (
              <>
                <Search className="size-5" />
                Identify Part
              </>
            )}
          </Button>

          {phase !== "results" && <PartsDisclaimers />}
        </form>

        {busy && (
          <div
            className="mt-8 animate-[fb-fade-up_0.35s_ease-out] rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-12 text-center shadow-sm sm:mt-10 sm:px-8"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="mx-auto size-11 animate-spin text-emerald-800" />
            <p className="font-heading mt-5 text-xl font-semibold text-emerald-950 sm:text-2xl">
              Leafy is analysing your photos…
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-emerald-900/80">
              Matching shapes, colours, and fitment for{" "}
              <span className="font-medium text-emerald-950">
                {formatVehicleLabel(vehicle)}
              </span>
              .
            </p>
            <div className="mx-auto mt-7 flex max-w-xs flex-col gap-2.5 text-left text-xs text-emerald-900/75">
              {[
                "Comparing part silhouettes",
                "Checking OEM cross-references",
                "Ranking sustainable options",
              ].map((label, i) => (
                <p
                  key={label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                    loadingStep === i && "bg-white/70 font-medium text-emerald-950"
                  )}
                >
                  {i === 2 ? (
                    <TreePine className="size-3.5 shrink-0" />
                  ) : (
                    <Sparkles className="size-3.5 shrink-0" />
                  )}
                  {label}
                </p>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-md text-[11px] leading-relaxed text-emerald-800/65">
              {PARTS_MOCK_AI_NOTE}
            </p>
          </div>
        )}

        {phase === "results" && result && (
          <section
            ref={resultsRef}
            id="parts-results"
            className="mt-10 scroll-mt-24 space-y-5 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 via-cream/50 to-transparent p-4 sm:mt-12 sm:space-y-6 sm:p-6"
            aria-labelledby="parts-results-heading"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                  Identification complete
                </p>
                <h2
                  id="parts-results-heading"
                  className="font-heading mt-1 text-2xl font-semibold leading-tight text-primary sm:text-3xl"
                >
                  {result.identified.name}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  For {result.vehicleLabel}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 bg-white/90 sm:w-auto"
                  onClick={resetSearch}
                >
                  <ArrowLeft className="size-4" />
                  New search
                </Button>
              </div>
            </div>

            {/* Confidence + why it matched */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Confidence score
                  </p>
                  <p className="font-heading mt-0.5 text-3xl font-semibold tabular-nums text-emerald-900">
                    {confidence}%
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-300/80 bg-amber-50 font-normal text-amber-950"
                >
                  Mock AI estimate
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-700 transition-all duration-700"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                <span className="font-semibold text-emerald-900">
                  Why it matched:{" "}
                </span>
                {result.identified.matchExplanation}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {result.identified.summary}
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-900">
                OEM {result.identified.oemNumber} · {result.identified.category}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {PARTS_MOCK_AI_NOTE}
              </p>
            </div>

            {/* Manual override */}
            <div className="rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5">
              <Label htmlFor="parts-override" className="text-sm font-medium">
                Not quite right? Override part type
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick another common part and Leafy will refresh options for your
                vehicle.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select
                  id="parts-override"
                  key={result.identified.kind}
                  className={selectClass}
                  defaultValue={result.identified.kind}
                  onChange={(e) =>
                    handleOverride(e.target.value as PartKind)
                  }
                  disabled={busy}
                >
                  {PART_KIND_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 gap-2"
                  onClick={resetSearch}
                >
                  <RefreshCw className="size-4" />
                  Start over
                </Button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="size-[4.5rem] shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-xs sm:size-24"
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

            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Choose a replacement
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Recycled / Used is the best eco choice. Each card shows price,
                tree impact, Add to Cart, and Buy Online.
              </p>
            </div>

            <div
              className="grid gap-4 sm:gap-5"
              data-testid="parts-options"
            >
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
