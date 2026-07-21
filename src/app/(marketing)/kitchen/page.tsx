"use client";

import {
  CalendarPlus,
  Check,
  ChefHat,
  ChevronDown,
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
import { useEffect, useMemo, useRef, useState } from "react";

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
import { useAppToast } from "@/components/ui/app-toast";
import { useCart } from "@/contexts/cart-context";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  AISLE_LABELS,
  SAMPLE_RECIPES,
  buildRecipePlan,
  estimateShopMinutes,
  extractIngredientsFromRecipe,
  formatIngredientLabel,
  groupByAisle,
  ingredientToCartProduct,
  kitchenIngredientCartId,
  type RecipePlan,
  type ShoppingIngredient,
} from "@/lib/leafy-kitchen";
import { cn } from "@/lib/utils";

type Phase = "idle" | "extracting" | "ready";

function peekCookMinutes(text: string, sampleId: string | null): number {
  const sample = SAMPLE_RECIPES.find((s) => s.id === sampleId);
  if (sample) return sample.cookMinutes;
  const m = text.match(/(\d+)\s*min/i);
  return m ? Number(m[1]) : 25;
}

export default function KitchenAssistantPage() {
  const { showSuccess } = useAppToast();
  const { cart, addToCart } = useCart();
  const resultsRef = useRef<HTMLElement>(null);

  const [recipeText, setRecipeText] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ingredients, setIngredients] = useState<ShoppingIngredient[]>([]);
  const [plan, setPlan] = useState<RecipePlan | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [recipeCollapsed, setRecipeCollapsed] = useState(false);
  const [leafyTip, setLeafyTip] = useState(
    "Paste a recipe or pick a sample — I’ll sort your shopping list by aisle."
  );

  const cartIds = useMemo(() => new Set(cart.map((item) => item.id)), [cart]);

  const grouped = useMemo(() => groupByAisle(ingredients), [ingredients]);
  const checkedCount = ingredients.filter((i) => i.checked).length;

  const addableIngredients = useMemo(
    () =>
      ingredients.filter(
        (ing) => !ing.checked && !cartIds.has(kitchenIngredientCartId(ing))
      ),
    [ingredients, cartIds]
  );

  const timePreview = useMemo(() => {
    if (ingredients.length === 0) return null;
    const shop = estimateShopMinutes(ingredients.length);
    const cook = peekCookMinutes(recipeText, selectedSampleId);
    const buffer = 10;
    return {
      shop,
      cook,
      buffer,
      total: shop + cook + buffer,
    };
  }, [ingredients, recipeText, selectedSampleId]);

  useEffect(() => {
    if (phase === "ready" && ingredients.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase, ingredients.length]);

  async function runExtract(textOverride?: string, sampleId?: string | null) {
    const text = (textOverride ?? recipeText).trim();
    const sid = sampleId !== undefined ? sampleId : selectedSampleId;
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

    await new Promise((r) => window.setTimeout(r, 650));

    const parsed = extractIngredientsFromRecipe(text);
    setIngredients(parsed.map((i) => ({ ...i, checked: false })));
    setPhase("ready");
    setRecipeCollapsed(true);

    if (parsed.length === 0) {
      setLeafyTip(
        "Hmm, I couldn’t find clear ingredient lines. Try listing them under “Ingredients:” or pick a sample."
      );
    } else {
      const shop = estimateShopMinutes(parsed.length);
      const cook = peekCookMinutes(text, sid);
      setLeafyTip(
        `Found ${parsed.length} ingredients · about ${shop + cook + 10} min end-to-end. Shop, check local, then plan your cook.`
      );
      showSuccess(
        "Shopping list ready",
        `${parsed.length} ingredients sorted by aisle.`
      );
    }
  }

  function loadSample(id: string) {
    const sample = SAMPLE_RECIPES.find((s) => s.id === id);
    if (!sample) return;
    setSelectedSampleId(id);
    setRecipeText(sample.text);
    setLeafyTip(`Nice pick — building a list for “${sample.title}”…`);
    void runExtract(sample.text, id);
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

  async function addAllToCart() {
    if (addableIngredients.length === 0) return;
    setAddingAll(true);
    await new Promise((r) => window.setTimeout(r, 280));

    const addedIds = new Set<string>();
    for (const ing of addableIngredients) {
      const product = ingredientToCartProduct(ing);
      if (cartIds.has(product.id) || addedIds.has(product.id)) continue;
      addToCart(product);
      addedIds.add(product.id);
    }

    const count = addedIds.size;
    if (count > 0) {
      setIngredients((prev) =>
        prev.map((ing) =>
          addedIds.has(kitchenIngredientCartId(ing))
            ? { ...ing, checked: true }
            : ing
        )
      );
      showSuccess(
        count === 1 ? "1 item added to cart" : `${count} items added to cart`,
        "Open your cart anytime from the header."
      );
      setLeafyTip(
        `Added ${count} ingredient${count === 1 ? "" : "s"} to your Forest Buddies cart. Checked items are already covered.`
      );
    } else {
      showSuccess(
        "Already in your cart",
        "Every unchecked item was already in the cart."
      );
    }
    setAddingAll(false);
  }

  async function planRecipe() {
    if (ingredients.length === 0) return;
    setPlanning(true);
    await new Promise((r) => window.setTimeout(r, 400));
    const sample = SAMPLE_RECIPES.find((s) => s.id === selectedSampleId);
    const next = buildRecipePlan({
      recipeText,
      ingredients,
      sampleCookMinutes: sample?.cookMinutes,
    });
    setPlan(next);
    setPlanOpen(true);
    setPlanning(false);
    setLeafyTip(next.summary);
    showSuccess(
      "Cook plan ready",
      `About ${next.totalMinutes} minutes · shop ${next.shopMinutes}m + cook ${next.cookMinutes}m.`
    );
    window.setTimeout(() => {
      document
        .getElementById("cook-plan")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  const showResults =
    phase === "extracting" ||
    phase === "ready" ||
    (phase === "idle" && !recipeText);

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(149,213,178,0.45),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
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

        <h1 className="font-heading max-w-2xl text-3xl font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
          From recipe to basket — with Leafy
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">
          Pick a sample or paste a recipe. Leafy builds your shopping list,
          then helps you buy online, check local stores, and plan cook time.
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
              {leafyTip}
            </p>
          </div>
        </div>

        {/* Sample chips — always visible */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Start with a sample
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {SAMPLE_RECIPES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={phase === "extracting"}
                onClick={() => loadSample(sample.id)}
                className={cn(
                  "min-w-[11rem] shrink-0 rounded-2xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 active:scale-[0.98] sm:min-w-0",
                  selectedSampleId === sample.id && phase !== "idle"
                    ? "border-emerald-800 bg-emerald-800 text-cream shadow-md"
                    : "border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-sm"
                )}
              >
                <span className="font-medium">{sample.title}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px]",
                    selectedSampleId === sample.id && phase !== "idle"
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

        <div
          className={cn(
            "mt-8 grid gap-6 lg:gap-8",
            phase === "ready" && ingredients.length > 0
              ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
              : "lg:grid-cols-2"
          )}
        >
          {/* Recipe input */}
          <Card className="border-border/70 bg-white/95 shadow-sm">
            <CardHeader className="pb-2">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left lg:pointer-events-none"
                onClick={() => setRecipeCollapsed((c) => !c)}
              >
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="size-4 text-primary" />
                  Your recipe
                </CardTitle>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform lg:hidden",
                    !recipeCollapsed && "rotate-180"
                  )}
                />
              </button>
              <CardDescription className={cn(recipeCollapsed && "hidden lg:block")}>
                Paste ingredients and method, or use a sample above.
              </CardDescription>
            </CardHeader>
            <CardContent
              className={cn(
                "space-y-4",
                recipeCollapsed && "hidden lg:block"
              )}
            >
              <textarea
                value={recipeText}
                onChange={(e) => {
                  setRecipeText(e.target.value);
                  setSelectedSampleId(null);
                  if (phase === "ready") {
                    setPhase("idle");
                    setIngredients([]);
                    setPlan(null);
                    setPlanOpen(false);
                    setRecipeCollapsed(false);
                  }
                }}
                rows={phase === "ready" ? 8 : 11}
                placeholder={`Paste a recipe here…

Ingredients:
- 1 cup lentils
- 2 tbsp olive oil
…`}
                className="w-full resize-y rounded-xl border border-input bg-background px-3 py-3 font-mono text-sm leading-relaxed text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label="Recipe text"
              />
            </CardContent>
            <CardFooter
              className={cn(
                "flex flex-wrap gap-2 border-t-0 bg-transparent",
                recipeCollapsed && "hidden lg:flex"
              )}
            >
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
                disabled={!recipeText || phase === "extracting"}
                onClick={() => {
                  setRecipeText("");
                  setSelectedSampleId(null);
                  setIngredients([]);
                  setPlan(null);
                  setPlanOpen(false);
                  setPhase("idle");
                  setRecipeCollapsed(false);
                  setLeafyTip(
                    "Fresh start — paste a recipe or pick a sample when you’re ready."
                  );
                }}
              >
                Clear
              </Button>
            </CardFooter>
          </Card>

          {/* Results */}
          <section
            ref={resultsRef}
            id="shopping-list"
            className="scroll-mt-24 space-y-4"
          >
            {phase === "extracting" && (
              <Card
                className="border-dashed border-emerald-200 bg-emerald-50/50"
                aria-busy
              >
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <Loader2 className="size-9 animate-spin text-emerald-800" />
                  <p className="font-heading text-lg font-semibold text-emerald-950">
                    Leafy is sorting your list…
                  </p>
                  <div className="mt-2 w-full max-w-xs space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-xl bg-emerald-200/50"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {phase === "idle" && showResults && (
              <Card className="border-dashed border-border/80 bg-card/70">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
                    <ShoppingBag className="size-6" />
                  </span>
                  <p className="font-heading text-lg font-semibold text-primary">
                    Your shopping list will appear here
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Tap a sample above for an instant list — or paste your own
                    recipe and hit Make shopping list.
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
                {/* Time preview strip */}
                {timePreview && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cream px-4 py-3 text-sm text-emerald-950 shadow-sm">
                    <Clock className="size-4 shrink-0 text-emerald-800" />
                    <span className="font-medium">
                      ~{timePreview.total} min total
                    </span>
                    <span className="text-emerald-800/70">
                      · {timePreview.shop}m shop · {timePreview.cook}m cook ·{" "}
                      {timePreview.buffer}m buffer
                    </span>
                  </div>
                )}

                <Card className="border-emerald-200/80 bg-white shadow-md ring-1 ring-emerald-900/5">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                          Step 2
                        </p>
                        <CardTitle className="mt-1 text-xl sm:text-2xl">
                          Shopping list
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {checkedCount}/{ingredients.length} checked · grouped
                          by aisle
                          {addableIngredients.length > 0
                            ? ` · ${addableIngredients.length} ready for cart`
                            : ""}
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-800 text-cream">
                        {ingredients.length} items
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="mt-4 h-11 w-full gap-2 bg-emerald-800 text-cream shadow-md hover:bg-emerald-700 hover:shadow-lg"
                      disabled={
                        ingredients.length === 0 ||
                        addableIngredients.length === 0 ||
                        addingAll
                      }
                      onClick={() => void addAllToCart()}
                    >
                      {addingAll ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Adding to cart…
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="size-4" />
                          Add All to Cart
                          {addableIngredients.length > 0 && (
                            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                              {addableIngredients.length}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    {ingredients.length > 0 &&
                      addableIngredients.length === 0 && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Everything on this list is already checked or in your
                          cart.
                        </p>
                      )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {grouped.map(({ aisle, items }) => (
                      <div key={aisle}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                          {AISLE_LABELS[aisle]}
                        </p>
                        <ul className="space-y-2">
                          {items.map((ing) => {
                            const inCart = cartIds.has(
                              kitchenIngredientCartId(ing)
                            );
                            const done = ing.checked || inCart;
                            return (
                            <li
                              key={ing.id}
                              className={cn(
                                "rounded-xl border border-border/60 bg-muted/15 p-3 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm",
                                done && "bg-emerald-50/50 opacity-75"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleChecked(ing.id)}
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                    done
                                      ? "border-emerald-800 bg-emerald-800 text-cream"
                                      : "border-border bg-background hover:border-emerald-400"
                                  )}
                                  aria-label={
                                    ing.checked
                                      ? `Uncheck ${ing.name}`
                                      : `Check off ${ing.name}`
                                  }
                                >
                                  {done && (
                                    <Check className="size-3" strokeWidth={3} />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p
                                      className={cn(
                                        "text-sm font-medium text-foreground",
                                        done && "line-through"
                                      )}
                                    >
                                      {formatIngredientLabel(ing)}
                                    </p>
                                    {inCart && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-emerald-100 text-[10px] font-medium text-emerald-900"
                                      >
                                        In cart
                                      </Badge>
                                    )}
                                  </div>
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
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-3 border-t bg-emerald-50/40">
                    <Button
                      type="button"
                      size="lg"
                      className="h-11 w-full gap-2 bg-emerald-800 text-cream shadow-md hover:bg-emerald-700 sm:hidden"
                      disabled={
                        ingredients.length === 0 ||
                        addableIngredients.length === 0 ||
                        addingAll
                      }
                      onClick={() => void addAllToCart()}
                    >
                      {addingAll ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Adding…
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="size-4" />
                          Add All to Cart
                          {addableIngredients.length > 0 && (
                            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
                              {addableIngredients.length}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Button
                        type="button"
                        size="lg"
                        className="h-11 w-full gap-2 shadow-md sm:w-auto"
                        disabled={planning}
                        onClick={() => void planRecipe()}
                      >
                        {planning ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Planning…
                          </>
                        ) : (
                          <>
                            <CalendarPlus className="size-4" />
                            Plan This Recipe
                            {timePreview && (
                              <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                                ~{timePreview.total}m
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                      {timePreview && (
                        <p className="mt-2 text-xs text-emerald-900/75">
                          Estimate: {timePreview.shop}m shopping +{" "}
                          {timePreview.cook}m cooking + {timePreview.buffer}m
                          buffer
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden gap-1.5 sm:inline-flex"
                        disabled={
                          ingredients.length === 0 ||
                          addableIngredients.length === 0 ||
                          addingAll
                        }
                        onClick={() => void addAllToCart()}
                      >
                        <ShoppingBag className="size-3.5" />
                        Add All to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        nativeButton={false}
                        render={<Link href="/cart" />}
                      >
                        View cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        nativeButton={false}
                        render={<Link href="/local" />}
                      >
                        Browse Buy Local
                      </Button>
                    </div>
                    </div>
                  </CardFooter>
                </Card>

                {planOpen && plan && (
                  <Card
                    id="cook-plan"
                    className="scroll-mt-24 border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/50 shadow-lg animate-[fb-fade-up_0.4s_ease-out]"
                  >
                    <CardHeader>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                        Step 3 · Cook plan
                      </p>
                      <CardTitle className="flex items-center gap-2 text-xl text-emerald-950">
                        <Clock className="size-5" />
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="text-emerald-900/75">
                        {plan.servingsHint
                          ? `Serves ${plan.servingsHint} · `
                          : ""}
                        {plan.ingredientCount} ingredients on your list
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(
                          [
                            ["Shop", plan.shopMinutes, "Gather ingredients"],
                            ["Cook", plan.cookMinutes, "Active kitchen time"],
                            ["Buffer", plan.prepBufferMinutes, "Plate & tidy"],
                            ["Total", plan.totalMinutes, "End to end"],
                          ] as const
                        ).map(([label, mins, hint]) => (
                          <div
                            key={label}
                            className={cn(
                              "rounded-xl border px-2 py-3 text-center",
                              label === "Total"
                                ? "border-emerald-800/30 bg-emerald-800 text-cream"
                                : "border-emerald-200/80 bg-white/80"
                            )}
                          >
                            <p
                              className={cn(
                                "text-[11px]",
                                label === "Total"
                                  ? "text-cream/75"
                                  : "text-muted-foreground"
                              )}
                            >
                              {label}
                            </p>
                            <p
                              className={cn(
                                "font-heading text-2xl font-semibold tabular-nums",
                                label === "Total"
                                  ? "text-cream"
                                  : "text-emerald-950"
                              )}
                            >
                              {mins}
                              <span className="text-sm font-medium">m</span>
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-[10px] leading-tight",
                                label === "Total"
                                  ? "text-cream/65"
                                  : "text-muted-foreground"
                              )}
                            >
                              {hint}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-emerald-950/90">
                        {plan.summary}
                      </p>
                      <p className="rounded-lg border border-dashed border-emerald-300/80 bg-white/60 px-3 py-2 text-xs text-emerald-900/80">
                        Google Calendar opens a draft event. Full sync &amp;
                        reminders are on the roadmap.
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
          </section>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground sm:mt-12">
          Leafy Kitchen is a helper — always check allergens and store
          availability. Affiliate links may earn Forest Buddies a small
          commission.
        </p>
      </div>
    </div>
  );
}
