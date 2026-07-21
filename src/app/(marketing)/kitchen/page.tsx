"use client";

import {
  CalendarPlus,
  Check,
  ChefHat,
  Clock,
  ExternalLink,
  Leaf,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MarketplaceBrandBadge } from "@/components/brand/brand-mark";
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
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  AISLE_LABELS,
  SAMPLE_RECIPES,
  buildRecipePlan,
  extractIngredientsFromRecipe,
  formatIngredientLabel,
  groupByAisle,
  type RecipePlan,
  type ShoppingIngredient,
} from "@/lib/leafy-kitchen";
import { cn } from "@/lib/utils";

type Phase = "idle" | "extracting" | "ready";

export default function KitchenAssistantPage() {
  const [recipeText, setRecipeText] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ingredients, setIngredients] = useState<ShoppingIngredient[]>([]);
  const [plan, setPlan] = useState<RecipePlan | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [leafyTip, setLeafyTip] = useState(
    "Paste a recipe or pick a sample — I’ll sort your shopping list by aisle."
  );

  const grouped = useMemo(() => groupByAisle(ingredients), [ingredients]);
  const checkedCount = ingredients.filter((i) => i.checked).length;

  function loadSample(id: string) {
    const sample = SAMPLE_RECIPES.find((s) => s.id === id);
    if (!sample) return;
    setSelectedSampleId(id);
    setRecipeText(sample.text);
    setPhase("idle");
    setIngredients([]);
    setPlan(null);
    setPlanOpen(false);
    setLeafyTip(`Nice pick — “${sample.title}” is ready when you are.`);
  }

  async function runExtract() {
    const text = recipeText.trim();
    if (text.length < 12) {
      setLeafyTip(
        "I need a bit more to work with — paste ingredients, or try a sample recipe."
      );
      return;
    }

    setPhase("extracting");
    setPlan(null);
    setPlanOpen(false);
    setLeafyTip("Reading your recipe… sorting quantities and aisles…");

    await new Promise((r) => window.setTimeout(r, 700));

    const parsed = extractIngredientsFromRecipe(text);
    setIngredients(parsed.map((i) => ({ ...i, checked: false })));
    setPhase("ready");
    if (parsed.length === 0) {
      setLeafyTip(
        "Hmm, I couldn’t find clear ingredient lines. Try listing them under “Ingredients:” or pick a sample."
      );
    } else {
      setLeafyTip(
        `Found ${parsed.length} ingredient${parsed.length === 1 ? "" : "s"}. Shop online or check locally — then plan your cook.`
      );
    }
  }

  function toggleChecked(id: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  }

  function openBuyOnline(ing: ShoppingIngredient) {
    const { url } = recordPartnerOutboundClick({
      platformId: "amazon",
      productId: `kitchen-${ing.id}`,
      productName: `${ing.name} organic`,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function planRecipe() {
    if (ingredients.length === 0) return;
    const sample = SAMPLE_RECIPES.find((s) => s.id === selectedSampleId);
    const next = buildRecipePlan({
      recipeText,
      ingredients,
      sampleCookMinutes: sample?.cookMinutes,
    });
    setPlan(next);
    setPlanOpen(true);
    setLeafyTip(next.summary);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.45),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <MarketplaceBrandBadge />
          <Badge className="gap-1 bg-emerald-800/10 font-normal text-emerald-900">
            <ChefHat className="size-3.5" />
            Leafy Kitchen
          </Badge>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Shop &amp; Cook helper
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <h1 className="font-heading max-w-xl text-3xl font-semibold tracking-tight text-primary sm:text-5xl">
              From recipe to basket — with Leafy
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground sm:text-lg">
              Paste a recipe (or try a sample). Leafy builds a smart shopping
              list, then helps you buy online, check local stores, and plan your
              cook time.
            </p>

            {/* Leafy speech bubble */}
            <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm">
                <Leaf className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
                  Leafy says
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {leafyTip}
                </p>
              </div>
            </div>

            <Card className="mt-6 border-border/70 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="size-4 text-primary" />
                  Your recipe
                </CardTitle>
                <CardDescription>
                  Paste ingredients and method, or start from a Forest Buddies
                  sample.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Try a sample
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_RECIPES.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => loadSample(sample.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-left text-sm transition-all duration-200 active:scale-[0.98]",
                          selectedSampleId === sample.id
                            ? "border-emerald-800 bg-emerald-800 text-cream shadow-sm"
                            : "border-emerald-200 bg-emerald-50/70 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100"
                        )}
                      >
                        <span className="font-medium">{sample.title}</span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[11px]",
                            selectedSampleId === sample.id
                              ? "text-cream/80"
                              : "text-emerald-800/70"
                          )}
                        >
                          {sample.tagline}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={recipeText}
                  onChange={(e) => {
                    setRecipeText(e.target.value);
                    setSelectedSampleId(null);
                    if (phase === "ready") {
                      setPhase("idle");
                      setIngredients([]);
                      setPlan(null);
                    }
                  }}
                  rows={12}
                  placeholder={`Paste a recipe here…

Ingredients:
- 1 cup lentils
- 2 tbsp olive oil
…`}
                  className="w-full resize-y rounded-xl border border-input bg-background px-3 py-3 font-mono text-sm leading-relaxed text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label="Recipe text"
                />
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t-0 bg-transparent">
                <Button
                  type="button"
                  className="gap-2 shadow-sm"
                  disabled={phase === "extracting"}
                  onClick={() => void runExtract()}
                >
                  {phase === "extracting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Leafy is reading…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Make shopping list
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!recipeText}
                  onClick={() => {
                    setRecipeText("");
                    setSelectedSampleId(null);
                    setIngredients([]);
                    setPlan(null);
                    setPlanOpen(false);
                    setPhase("idle");
                    setLeafyTip(
                      "Fresh start — paste a recipe or pick a sample when you’re ready."
                    );
                  }}
                >
                  Clear
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Results column */}
          <div className="space-y-4 lg:sticky lg:top-20">
            {phase === "extracting" && (
              <Card className="border-dashed border-emerald-200 bg-emerald-50/40" aria-busy>
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <Loader2 className="size-8 animate-spin text-emerald-800" />
                  <p className="font-heading text-lg font-semibold text-emerald-950">
                    Leafy is sorting your list…
                  </p>
                  <p className="max-w-xs text-sm text-emerald-900/70">
                    Matching quantities, guessing aisles, and prepping Buy Online
                    + Check Local links.
                  </p>
                </CardContent>
              </Card>
            )}

            {phase === "idle" && (
              <Card className="border-dashed border-border/80 bg-card/60">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
                    <ShoppingBag className="size-6" />
                  </span>
                  <p className="font-heading text-lg font-semibold text-primary">
                    Your shopping list will appear here
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Start with a sample recipe for a quick taste of the flow —
                    or paste anything from a blog, Notes app, or handwritten
                    jot.
                  </p>
                </CardContent>
              </Card>
            )}

            {phase === "ready" && ingredients.length === 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="py-10 text-center text-sm text-amber-950">
                  No ingredients detected. Tip: add a line that says{" "}
                  <strong>Ingredients:</strong> then list each item on its own
                  line.
                </CardContent>
              </Card>
            )}

            {phase === "ready" && ingredients.length > 0 && (
              <>
                <Card className="border-border/70 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl">Shopping list</CardTitle>
                        <CardDescription className="mt-1">
                          {checkedCount}/{ingredients.length} checked · grouped
                          by aisle
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-900">
                        {ingredients.length} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {grouped.map(({ aisle, items }) => (
                      <div key={aisle}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                          {AISLE_LABELS[aisle]}
                        </p>
                        <ul className="space-y-2">
                          {items.map((ing) => (
                            <li
                              key={ing.id}
                              className={cn(
                                "rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors",
                                ing.checked && "bg-emerald-50/50 opacity-70"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleChecked(ing.id)}
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                    ing.checked
                                      ? "border-emerald-800 bg-emerald-800 text-cream"
                                      : "border-border bg-background hover:border-emerald-400"
                                  )}
                                  aria-label={
                                    ing.checked
                                      ? `Uncheck ${ing.name}`
                                      : `Check off ${ing.name}`
                                  }
                                >
                                  {ing.checked && (
                                    <Check className="size-3" strokeWidth={3} />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "text-sm font-medium text-foreground",
                                      ing.checked && "line-through"
                                    )}
                                  >
                                    {formatIngredientLabel(ing)}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 gap-1.5 bg-emerald-800 text-cream hover:bg-emerald-700"
                                      onClick={() => openBuyOnline(ing)}
                                    >
                                      <ShoppingBag className="size-3.5" />
                                      Buy Online
                                      <span className="hidden text-[10px] opacity-80 sm:inline">
                                        · {getAmazonStoreLabel()}
                                      </span>
                                      <ExternalLink className="size-3 opacity-70" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-1.5"
                                      nativeButton={false}
                                      render={
                                        <Link
                                          href={`/local?ingredient=${encodeURIComponent(ing.name)}#local-stores`}
                                        />
                                      }
                                    >
                                      <MapPin className="size-3.5" />
                                      Check Local
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-3 border-t bg-muted/30 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      className="gap-2 shadow-sm"
                      onClick={planRecipe}
                    >
                      <CalendarPlus className="size-4" />
                      Plan This Recipe
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Estimates shopping + cooking time, then offers a Google
                      Calendar draft.
                    </p>
                  </CardFooter>
                </Card>

                {planOpen && plan && (
                  <Card className="border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 shadow-md animate-[fb-fade-up_0.4s_ease-out]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-emerald-950">
                        <Clock className="size-4" />
                        Your cook plan
                      </CardTitle>
                      <CardDescription className="text-emerald-900/75">
                        {plan.title}
                        {plan.servingsHint
                          ? ` · Serves ${plan.servingsHint}`
                          : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-emerald-200/80 bg-white/70 px-2 py-3">
                          <p className="text-xs text-muted-foreground">Shop</p>
                          <p className="font-heading text-xl font-semibold text-emerald-950">
                            {plan.shopMinutes}m
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/80 bg-white/70 px-2 py-3">
                          <p className="text-xs text-muted-foreground">Cook</p>
                          <p className="font-heading text-xl font-semibold text-emerald-950">
                            {plan.cookMinutes}m
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/80 bg-white/70 px-2 py-3">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-heading text-xl font-semibold text-emerald-950">
                            {plan.totalMinutes}m
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-emerald-950/90">
                        {plan.summary} Includes a {plan.prepBufferMinutes}-minute
                        buffer for washing up and plating.
                      </p>
                      <p className="rounded-lg border border-dashed border-emerald-300/80 bg-white/50 px-3 py-2 text-xs text-emerald-900/80">
                        Google Calendar: opens a draft event (template link).
                        Full calendar sync &amp; reminders are on the roadmap.
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 border-t-0 bg-transparent">
                      <Button
                        nativeButton={false}
                        render={
                          <a
                            href={plan.calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                        className="gap-2"
                      >
                        <CalendarPlus className="size-4" />
                        Add to Google Calendar
                        <ExternalLink className="size-3.5 opacity-70" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/local" />}
                      >
                        Find ingredients nearby
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Leafy Kitchen is a helper — always check allergens and store
          availability. Affiliate links may earn Forest Buddies a small
          commission.
        </p>
      </div>
    </div>
  );
}
