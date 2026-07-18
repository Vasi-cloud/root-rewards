"use client";

import {
  Camera,
  ImagePlus,
  Leaf,
  MapPin,
  Mic,
  Sparkles,
  ShoppingBag,
  Store,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { LocalAvailabilityBadge } from "@/components/local/local-availability-badge";
import { ProductPartnerLinks } from "@/components/product/product-partner-links";
import { useCart } from "@/contexts/cart-context";
import {
  DISTANCE_OPTIONS_MI,
  STOCK_SIMULATION_DISCLAIMER,
  USER_LOCATION_OPTIONS,
  findLocalStoresForProducts,
  formatDistance,
  type LocalStoreMatch,
} from "@/lib/local-commerce";
import {
  SUGGESTED_PROMPTS,
  recommendProductsAsync,
  type ProductRecommendation,
  type RecommendResult,
} from "@/lib/recommendation-agent";
import {
  VISION_DEMO_HINTS,
  classifyPhotoMockAsync,
  type VisionResult,
} from "@/lib/vision-agent";
import type { Product } from "@/types";

type AskMode = "text" | "vision";

export default function RecommendPage() {
  const { addToCart } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AskMode>("text");
  const [query, setQuery] = useState("eco kitchen under $50");
  const [budget, setBudget] = useState("50");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [vision, setVision] = useState<VisionResult | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [visionNote, setVisionNote] = useState("");
  const [visionError, setVisionError] = useState<string | null>(null);

  const [showLocal, setShowLocal] = useState(false);
  const [locationId, setLocationId] = useState(USER_LOCATION_OPTIONS[0].id);
  const [maxMiles, setMaxMiles] =
    useState<(typeof DISTANCE_OPTIONS_MI)[number]>(50);
  const [localMatches, setLocalMatches] = useState<LocalStoreMatch[] | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const activePicks: ProductRecommendation[] =
    mode === "vision" && vision ? vision.picks : (result?.picks ?? []);
  const productIdsForLocal =
    mode === "vision" && vision
      ? vision.productIds
      : (result?.picks.map((p) => p.product.id) ?? []);

  async function runRecommend(nextQuery = query, nextBudget = budget) {
    setThinking(true);
    setVoiceError(null);
    setVision(null);
    setLocalMatches(null);
    setShowLocal(false);
    const parsedBudget = Number(nextBudget);
    const out = await recommendProductsAsync({
      query: nextQuery,
      budget:
        Number.isFinite(parsedBudget) && parsedBudget > 0
          ? parsedBudget
          : undefined,
      limit: 4,
    });
    setResult(out);
    setThinking(false);
  }

  function clearPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setFileSize(undefined);
    setVision(null);
    setVisionError(null);
    setLocalMatches(null);
    setShowLocal(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onFileChosen(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVisionError("Please upload an image (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setVisionError("Keep photos under 8 MB for this demo.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setFileSize(file.size);
    setVisionError(null);
    setVision(null);
    setLocalMatches(null);
    setShowLocal(false);
  }

  async function runVision(overrideName?: string, overrideNote?: string) {
    const name = overrideName ?? fileName;
    if (!name) {
      setVisionError("Upload a photo (or tap a demo filename) first.");
      return;
    }
    setMode("vision");
    setThinking(true);
    setResult(null);
    setVoiceError(null);
    setVisionError(null);
    setLocalMatches(null);
    setShowLocal(false);
    if (overrideName && overrideName !== fileName) {
      setFileName(overrideName);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
    const note = (overrideNote ?? visionNote).trim() || undefined;
    const out = await classifyPhotoMockAsync({
      fileName: name,
      fileSize,
      note,
      limit: 4,
    });
    setVision(out);
    setThinking(false);
  }

  function findLocalStores() {
    if (productIdsForLocal.length === 0) return;
    const user =
      USER_LOCATION_OPTIONS.find((l) => l.id === locationId) ??
      USER_LOCATION_OPTIONS[0];
    const matches = findLocalStoresForProducts(
      productIdsForLocal,
      user,
      maxMiles
    );
    setLocalMatches(matches);
    setShowLocal(true);
  }

  function startVoice() {
    const SpeechRecognitionAPI =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognition;
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError("Voice isn’t supported in this browser — try Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      const money = transcript.match(/\$?\s*(\d{1,3})\b/);
      if (money) setBudget(money[1]);
      setListening(false);
      void runRecommend(transcript, money?.[1] ?? budget);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    setListening(true);
    setVoiceError(null);
    recognition.start();
  }

  function handleAdd(product: Product) {
    addToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(149,213,178,0.4),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge className="mb-3 gap-1 bg-emerald-800/10 text-emerald-900">
          <Wand2 className="size-3" />
          Ask Leafy · text, voice &amp; vision
        </Badge>
        <h1 className="font-heading text-3xl font-semibold text-primary sm:text-5xl">
          Ask Leafy what to buy
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground sm:text-lg">
          Describe an occasion, speak it, or snap a photo of something you like
          — I&apos;ll recommend similar eco products and nearby makers. Mock
          vision today; Grok Vision / Google Vision later.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "text"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white/80 text-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="size-3.5" />
            Text &amp; voice
          </button>
          <button
            type="button"
            onClick={() => setMode("vision")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "vision"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-white/80 text-foreground hover:bg-muted"
            }`}
          >
            <Camera className="size-3.5" />
            Snap &amp; match
          </button>
        </div>

        {mode === "text" ? (
          <form
            className="mt-6 space-y-4 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void runRecommend();
            }}
          >
            <div>
              <label
                htmlFor="rec-query"
                className="mb-1.5 block text-sm font-medium"
              >
                What are you shopping for?
              </label>
              <div className="relative">
                <textarea
                  id="rec-query"
                  rows={2}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='e.g. "gift for birthday" or "eco kitchen under $50"'
                  className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={startVoice}
                  disabled={listening}
                  className={`absolute top-3 right-3 rounded-xl p-2.5 transition-all ${
                    listening
                      ? "animate-pulse bg-red-100 text-red-600"
                      : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  }`}
                  aria-label="Speak your request"
                  title="Voice input"
                >
                  <Mic className="size-5" />
                </button>
              </div>
              {listening && (
                <p className="mt-1.5 text-sm text-red-600">
                  Listening… say your occasion
                </p>
              )}
              {voiceError && (
                <p className="mt-1.5 text-sm text-amber-800">{voiceError}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-40">
                <label
                  htmlFor="rec-budget"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Budget ($)
                </label>
                <input
                  id="rec-budget"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="min-h-11 flex-1 gap-2"
                disabled={thinking || !query.trim()}
              >
                <Sparkles className="size-4" />
                {thinking ? "Leafy is thinking…" : "Get recommendations"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setQuery(p.query);
                    setBudget(String(p.budget));
                    void runRecommend(p.query, String(p.budget));
                  }}
                  className="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100 sm:text-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm sm:p-6">
            <div>
              <p className="mb-1.5 text-sm font-medium">Upload a photo</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="max-h-56 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 rounded-full bg-cream/95 p-1.5 text-foreground shadow-sm hover:bg-white"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                  {fileName && (
                    <p className="border-t border-border/60 bg-cream/80 px-3 py-2 text-xs text-muted-foreground">
                      {fileName}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-10 text-center transition hover:bg-emerald-50"
                >
                  <ImagePlus className="size-8 text-emerald-800" />
                  <span className="font-medium text-primary">
                    Drop or choose a photo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP · mock labels from the filename for now
                  </span>
                </button>
              )}
              {!previewUrl && fileName && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Using demo name:{" "}
                  <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="vision-note"
                className="mb-1.5 block text-sm font-medium"
              >
                Optional hint
              </label>
              <input
                id="vision-note"
                value={visionNote}
                onChange={(e) => setVisionNote(e.target.value)}
                placeholder="e.g. water bottle, rain jacket, tote…"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {VISION_DEMO_HINTS.map((h) => (
                <button
                  key={h.fileName}
                  type="button"
                  onClick={() => {
                    setFileName(h.fileName);
                    setVisionNote(h.label.toLowerCase());
                    void runVision(h.fileName, h.label.toLowerCase());
                  }}
                  className="rounded-full border border-sky-200 bg-sky-50/80 px-3 py-1.5 text-xs font-medium text-sky-950 hover:bg-sky-100 sm:text-sm"
                >
                  Try “{h.label}”
                </button>
              ))}
            </div>

            {visionError && (
              <p className="text-sm text-amber-800">{visionError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {!previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Choose photo
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                className="min-h-11 flex-1 gap-2 sm:flex-none"
                disabled={thinking || (!fileName && !previewUrl)}
                onClick={() => void runVision()}
              >
                <Camera className="size-4" />
                {thinking ? "Scanning photo…" : "Find similar products"}
              </Button>
            </div>
          </div>
        )}

        {thinking && (
          <div className="mt-8 animate-fb-fade-up rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 px-5 py-6 text-center">
            <Leaf className="mx-auto size-8 animate-fb-float text-primary" />
            <p className="font-heading mt-3 text-lg font-semibold text-primary">
              {mode === "vision"
                ? "Reading your photo…"
                : "Scanning the canopy…"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "vision"
                ? "Mock vision labels → similar eco products"
                : "Matching budget, occasion, and eco scores"}
            </p>
          </div>
        )}

        {!thinking && mode === "vision" && vision && (
          <div className="mt-8 space-y-5 animate-fb-fade-up">
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-cream to-emerald-50/50 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-sky-800 text-white">
                  {vision.engine === "mock" ? "Mock vision" : vision.engine}
                </Badge>
                {vision.categoryHint && (
                  <Badge variant="outline">{vision.categoryHint}</Badge>
                )}
                {vision.labels.map((l) => (
                  <Badge
                    key={l.label}
                    variant="secondary"
                    className="capitalize"
                  >
                    {l.label} · {Math.round(l.confidence * 100)}%
                  </Badge>
                ))}
              </div>
              <p className="font-heading mt-3 text-lg font-semibold text-emerald-950 sm:text-xl">
                {vision.summary}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Source: {vision.sourceName}
              </p>
            </div>

            <PickList
              picks={vision.picks}
              addedId={addedId}
              onAdd={handleAdd}
              reasonLabel="Why it matches"
            />

            <LocalStoresPanel
              showLocal={showLocal}
              locationId={locationId}
              maxMiles={maxMiles}
              localMatches={localMatches}
              disabled={productIdsForLocal.length === 0}
              onLocationChange={setLocationId}
              onMilesChange={setMaxMiles}
              onFind={findLocalStores}
            />

            <p className="text-center text-xs text-muted-foreground">
              Engine: mock vision (filename + hint). Swap{" "}
              <code className="rounded bg-muted px-1">classifyPhotoMock</code>{" "}
              for Grok Vision or Google Vision later.
            </p>
          </div>
        )}

        {!thinking && mode === "text" && result && (
          <div className="mt-8 space-y-5 animate-fb-fade-up">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-800 text-white">
                  {result.engine === "mock" ? "Mock agent" : "Grok"}
                </Badge>
                {result.parsed.budget != null && (
                  <Badge variant="outline">≤ ${result.parsed.budget}</Badge>
                )}
                {result.parsed.isGift && (
                  <Badge variant="secondary">Gift mode</Badge>
                )}
                {result.parsed.themes.map((t) => (
                  <Badge key={t} variant="outline" className="capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="font-heading mt-3 text-lg font-semibold text-emerald-950 sm:text-xl">
                {result.message}
              </p>
            </div>

            <PickList
              picks={result.picks}
              addedId={addedId}
              onAdd={handleAdd}
              reasonLabel="Why Leafy picked it"
            />

            <LocalStoresPanel
              showLocal={showLocal}
              locationId={locationId}
              maxMiles={maxMiles}
              localMatches={localMatches}
              disabled={activePicks.length === 0}
              onLocationChange={setLocationId}
              onMilesChange={setMaxMiles}
              onFind={findLocalStores}
            />

            <p className="text-center text-xs text-muted-foreground">
              Engine: mock scorer on the live marketplace catalog. Hook up Grok
              by swapping{" "}
              <code className="rounded bg-muted px-1">recommendProducts</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PickList({
  picks,
  addedId,
  onAdd,
  reasonLabel,
}: {
  picks: ProductRecommendation[];
  addedId: string | null;
  onAdd: (product: Product) => void;
  reasonLabel: string;
}) {
  return (
    <div className="space-y-4">
      {picks.map((pick, i) => (
        <article
          key={pick.product.id}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/5 sm:size-20">
              <Leaf className="size-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                    Pick #{i + 1}
                  </p>
                  <h2 className="font-heading text-xl font-semibold text-primary">
                    {pick.product.name}
                  </h2>
                </div>
                <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
                  ${pick.product.price.toFixed(2)}
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick.product.description}
              </p>
              {(pick.product.materials || pick.product.fitGuide) && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90">
                  {pick.product.materials
                    ? `Materials: ${pick.product.materials}`
                    : null}
                  {pick.product.materials && pick.product.fitGuide ? " · " : null}
                  {pick.product.fitGuide
                    ? `Fit: ${pick.product.fitGuide}`
                    : null}
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-emerald-900">
                {reasonLabel}: {pick.reason}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{pick.product.category}</Badge>
                <Badge className="bg-emerald-100 text-emerald-800">
                  Eco {pick.product.sustainabilityScore}
                </Badge>
                {pick.matchTags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onAdd(pick.product)}
                >
                  <ShoppingBag className="size-3.5" />
                  {addedId === pick.product.id ? "Added!" : "Add to cart"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/marketplace" />}
                >
                  Browse similar
                </Button>
              </div>
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Also compare on big stores
                </p>
                <ProductPartnerLinks product={pick.product} />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function LocalStoresPanel({
  showLocal,
  locationId,
  maxMiles,
  localMatches,
  disabled,
  onLocationChange,
  onMilesChange,
  onFind,
}: {
  showLocal: boolean;
  locationId: string;
  maxMiles: (typeof DISTANCE_OPTIONS_MI)[number];
  localMatches: LocalStoreMatch[] | null;
  disabled: boolean;
  onLocationChange: (id: string) => void;
  onMilesChange: (mi: (typeof DISTANCE_OPTIONS_MI)[number]) => void;
  onFind: () => void;
}) {
  const primaryProduct =
    localMatches?.[0]?.matchingProducts[0]?.product.id;

  return (
    <div className="rounded-2xl border border-border/70 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
            <Store className="size-5 text-emerald-800" />
            Find local stores
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulated shelf status near you — in stock, limited, or pickup —
            plus partner links when local is thin.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          disabled={disabled}
          onClick={onFind}
        >
          <MapPin className="size-3.5" />
          {showLocal ? "Refresh nearby" : "Find nearby stores"}
        </Button>
      </div>

      <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-amber-950 sm:text-sm">
        {STOCK_SIMULATION_DISCLAIMER}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Your area
          </label>
          <select
            value={locationId}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {USER_LOCATION_OPTIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-36">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Within
          </label>
          <select
            value={maxMiles}
            onChange={(e) =>
              onMilesChange(
                Number(e.target.value) as (typeof DISTANCE_OPTIONS_MI)[number]
              )
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          >
            {DISTANCE_OPTIONS_MI.map((mi) => (
              <option key={mi} value={mi}>
                {mi} mi
              </option>
            ))}
          </select>
        </div>
      </div>

      {showLocal && localMatches && (
        <div className="mt-4 space-y-3">
          {localMatches.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                No makers in range carry these items yet. Try a wider radius,
                another city, or check big stores while we grow local stock
                access.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/local" />}
                >
                  Open Buy Local
                </Button>
                <PartnerOutboundButton
                  platformId="amazon"
                  productName="eco sustainable products"
                />
              </div>
            </div>
          ) : (
            localMatches.map(
              ({ maker, distanceMi, matchingProducts, bestAvailability }) => (
                <div
                  key={maker.id}
                  className="rounded-xl border border-border/70 bg-cream/60 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary">{maker.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {maker.city} · {formatDistance(distanceMi)}
                        {maker.services[0] ? ` · ${maker.services[0]}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <LocalAvailabilityBadge
                        availability={
                          matchingProducts[0]?.availability ?? {
                            status: bestAvailability,
                            etaNote: "Simulated",
                          }
                        }
                      />
                      {maker.shopSlug && (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<Link href={`/shop/${maker.shopSlug}`} />}
                        >
                          Visit shop
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {maker.blurb}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {matchingProducts.map(({ product, availability }) => (
                      <li
                        key={product.id}
                        className="rounded-lg border border-border/50 bg-white/70 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-primary">
                              {product.name}
                            </p>
                            <LocalAvailabilityBadge
                              availability={availability}
                              showNote
                              className="mt-1"
                            />
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-primary">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                            If local is thin — check big stores
                          </p>
                          <ProductPartnerLinks product={product} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-primary"
            nativeButton={false}
            render={
              <Link
                href={`/local?city=${locationId}${
                  primaryProduct ? `&product=${primaryProduct}` : ""
                }`}
              />
            }
          >
            <MapPin className="size-3.5" />
            Open full Buy Local map
          </Button>
        </div>
      )}
    </div>
  );
}

/** Minimal typings for Web Speech API (not in all TS libs). */
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
