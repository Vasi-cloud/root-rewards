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
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
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
  estimateIngredientLineTotal,
  estimateShopMinutes,
  estimateShoppingListTotal,
  extractIngredientsFromRecipe,
  formatIngredientLabel,
  formatKitchenMoney,
  groupByAisle,
  ingredientToCartProduct,
  kitchenIngredientCartId,
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
  const { cart, addToCart, totalItems, totalPrice } = useCart();
  const resultsRef = useRef<HTMLElement>(null);

  const [recipeText, setRecipeText] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ingredients, setIngredients] = useState<ShoppingIngredient[]>([]);
  const [addingAll, setAddingAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
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

  const listTotalAll = useMemo(
    () => estimateShoppingListTotal(ingredients, { onlyAddable: () => true }),
    [ingredients]
  );

  const addableTotal = useMemo(
    () =>
      estimateShoppingListTotal(ingredients, {
        onlyAddable: (ing) =>
          !ing.checked && !cartIds.has(kitchenIngredientCartId(ing)),
      }),
    [ingredients, cartIds]
  );

  const livePlan = useMemo(() => {
    if (ingredients.length === 0) return null;
    const sample = SAMPLE_RECIPES.find((s) => s.id === selectedSampleId);
    return buildRecipePlan({
      recipeText,
      ingredients,
      sampleCookMinutes: sample?.cookMinutes,
    });
  }, [ingredients, recipeText, selectedSampleId]);

  const timePreview = useMemo(() => {
    if (!livePlan) return null;
    const { shopMinutes: shop, cookMinutes: cook, prepBufferMinutes: buffer, totalMinutes: total } =
      livePlan;
    return {
      shop,
      cook,
      buffer,
      total,
      segments: [
        { key: "shop", label: "Shop", minutes: shop, color: "bg-emerald-600" },
        { key: "cook", label: "Cook", minutes: cook, color: "bg-emerald-800" },
        {
          key: "buffer",
          label: "Buffer",
          minutes: buffer,
          color: "bg-sage",
        },
      ] as const,
    };
  }, [livePlan]);

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
    setLeafyTip("Reading your recipe… sorting quantities and aisles…");

    await new Promise((r) => window.setTimeout(r, 650));

    const parsed = extractIngredientsFromRecipe(text);
    setIngredients(
      parsed.map((i) => ({ ...i, checked: false, cartQty: i.cartQty || 1 }))
    );
    setPhase("ready");
    setRecipeCollapsed(true);
    setConfirmClear(false);

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

  function setCartQty(id: string, next: number) {
    const qty = Math.max(1, Math.min(20, Math.floor(next)));
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cartQty: qty } : i))
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
    await new Promise((r) => window.setTimeout(r, 320));

    const addedIds = new Set<string>();
    let unitTotal = 0;
    let moneyTotal = 0;
    for (const ing of addableIngredients) {
      const product = ingredientToCartProduct(ing);
      if (cartIds.has(product.id) || addedIds.has(product.id)) continue;
      const qty = Math.max(1, ing.cartQty || 1);
      addToCart(product, qty);
      addedIds.add(product.id);
      unitTotal += qty;
      moneyTotal += estimateIngredientLineTotal(ing);
    }

    const lineCount = addedIds.size;
    const moneyLabel = formatKitchenMoney(
      Math.round(moneyTotal * 100) / 100
    );
    if (lineCount > 0) {
      setIngredients((prev) =>
        prev.map((ing) =>
          addedIds.has(kitchenIngredientCartId(ing))
            ? { ...ing, checked: true }
            : ing
        )
      );
      showSuccess(
        `Added ${unitTotal} item${unitTotal === 1 ? "" : "s"} · ${moneyLabel}`,
        `${lineCount} ingredient${lineCount === 1 ? "" : "s"} are in your Forest Buddies cart. Review totals and tree impact next.`,
        {
          accent: "cart",
          action: { label: "View cart & checkout", href: "/cart" },
        }
      );
      setLeafyTip(
        `Nice — ${unitTotal} item${unitTotal === 1 ? "" : "s"} (~${moneyLabel}) added. View cart for trees, or keep using Buy Online per item.`
      );
    } else {
      showSuccess(
        "Already in your cart",
        "Every unchecked item was already in the cart.",
        { accent: "cart" }
      );
    }
    setAddingAll(false);
  }

  function clearList() {
    setIngredients([]);
    setConfirmClear(false);
    setPhase("idle");
    setRecipeCollapsed(false);
    setLeafyTip(
      "List cleared — pick a sample or paste a new recipe when you’re ready."
    );
    showSuccess("Shopping list cleared", "Start fresh whenever you like.");
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
                <Card className="border-emerald-200/80 bg-white shadow-md ring-1 ring-emerald-900/5">
                  <CardHeader className="space-y-4 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                          Step 1
                        </p>
                        <CardTitle className="mt-1 text-xl sm:text-2xl">
                          Shopping list
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {checkedCount}/{ingredients.length} checked · grouped
                          by aisle
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-emerald-800 text-cream">
                          {ingredients.length} items
                        </Badge>
                        {!confirmClear ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmClear(true)}
                          >
                            <Trash2 className="size-3.5" />
                            Clear list
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {/* Estimated cost + hero Add All */}
                    <div className="rounded-2xl border-2 border-emerald-700/25 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/30 p-4 shadow-sm sm:p-5">
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
                            Estimated basket
                          </p>
                          <p className="font-heading mt-1 text-3xl font-semibold tabular-nums text-emerald-950 sm:text-4xl">
                            {formatKitchenMoney(
                              addableTotal > 0 ? addableTotal : listTotalAll
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {addableTotal > 0
                              ? `${addableIngredients.length} ready to add · illustrative prices`
                              : "Illustrative prices · confirm at checkout"}
                          </p>
                        </div>
                        {addableTotal > 0 && addableTotal !== listTotalAll && (
                          <p className="text-right text-xs text-emerald-900/80">
                            Full list
                            <span className="mt-0.5 block font-heading text-lg font-semibold tabular-nums text-emerald-950">
                              {formatKitchenMoney(listTotalAll)}
                            </span>
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="mt-4 h-16 w-full flex-col gap-0.5 whitespace-normal bg-emerald-800 text-base font-semibold text-cream shadow-lg shadow-emerald-900/25 ring-2 ring-emerald-700/20 hover:bg-emerald-900 hover:shadow-xl sm:h-[4.25rem] sm:text-lg"
                        disabled={
                          ingredients.length === 0 ||
                          addableIngredients.length === 0 ||
                          addingAll
                        }
                        onClick={() => void addAllToCart()}
                      >
                        {addingAll ? (
                          <span className="inline-flex items-center gap-2.5">
                            <Loader2 className="size-5 animate-spin" />
                            Adding to cart…
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-2">
                              <ShoppingBag className="size-5" />
                              Add All to Cart
                            </span>
                            {addableTotal > 0 && (
                              <span className="font-heading text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                                {formatKitchenMoney(addableTotal)}
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                      <p className="mt-2 text-center text-[11px] text-emerald-900/70">
                        Adds quantities to your Forest Buddies cart · Buy Online
                        stays available per item
                      </p>
                    </div>

                    {confirmClear && (
                      <div
                        role="alertdialog"
                        aria-labelledby="clear-list-title"
                        className="rounded-xl border border-amber-300/90 bg-amber-50 px-3.5 py-3 text-sm text-amber-950"
                      >
                        <p id="clear-list-title" className="font-medium">
                          Clear this shopping list?
                        </p>
                        <p className="mt-1 text-xs text-amber-900/80">
                          This removes ingredients from Leafy’s list. Items
                          already in your cart stay in the cart.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={clearList}
                          >
                            <Trash2 className="size-3.5" />
                            Yes, clear list
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmClear(false)}
                          >
                            Keep list
                          </Button>
                        </div>
                      </div>
                    )}

                    {totalItems > 0 && (
                      <Button
                        nativeButton={false}
                        render={<Link href="/cart" />}
                        variant="outline"
                        size="lg"
                        className="h-12 w-full gap-2 border-emerald-300/80 text-base font-medium text-emerald-950"
                      >
                        View cart ({totalItems}) ·{" "}
                        {formatKitchenMoney(totalPrice)}
                      </Button>
                    )}
                    {ingredients.length > 0 &&
                      addableIngredients.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">
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
                                      <Check
                                        className="size-3"
                                        strokeWidth={3}
                                      />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1 space-y-2">
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

                                    {/* Qty stepper */}
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-xs">
                                        <button
                                          type="button"
                                          disabled={done || ing.cartQty <= 1}
                                          onClick={() =>
                                            setCartQty(ing.id, ing.cartQty - 1)
                                          }
                                          className="inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                          aria-label={`Decrease quantity for ${ing.name}`}
                                        >
                                          <Minus className="size-3.5" />
                                        </button>
                                        <span className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums">
                                          {ing.cartQty}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={done || ing.cartQty >= 20}
                                          onClick={() =>
                                            setCartQty(ing.id, ing.cartQty + 1)
                                          }
                                          className="inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                          aria-label={`Increase quantity for ${ing.name}`}
                                        >
                                          <Plus className="size-3.5" />
                                        </button>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground">
                                        Qty ·{" "}
                                        {formatKitchenMoney(
                                          estimateIngredientLineTotal(ing)
                                        )}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
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
                      className="h-14 w-full flex-col gap-0.5 whitespace-normal bg-emerald-800 text-base font-semibold text-cream shadow-lg sm:hidden"
                      disabled={
                        ingredients.length === 0 ||
                        addableIngredients.length === 0 ||
                        addingAll
                      }
                      onClick={() => void addAllToCart()}
                    >
                      {addingAll ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-5 animate-spin" />
                          Adding…
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-2">
                            <ShoppingBag className="size-5" />
                            Add All to Cart
                          </span>
                          {addableTotal > 0 && (
                            <span className="font-heading text-lg font-semibold tabular-nums">
                              {formatKitchenMoney(addableTotal)}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="hidden gap-1.5 bg-emerald-800 text-cream shadow-sm hover:bg-emerald-900 sm:inline-flex"
                        disabled={
                          ingredients.length === 0 ||
                          addableIngredients.length === 0 ||
                          addingAll
                        }
                        onClick={() => void addAllToCart()}
                      >
                        <ShoppingBag className="size-3.5" />
                        {addableTotal > 0
                          ? `Add All to Cart (${formatKitchenMoney(addableTotal)})`
                          : "Add All to Cart"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        nativeButton={false}
                        render={<Link href="/cart" />}
                      >
                        {totalItems > 0
                          ? `View cart (${totalItems}) · ${formatKitchenMoney(totalPrice)}`
                          : "View cart"}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        nativeButton={false}
                        render={<a href="#cook-plan" />}
                      >
                        Plan My Cook
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                {/* Plan My Cook — after list */}
                {livePlan && timePreview && (
                  <Card
                    id="cook-plan"
                    className="scroll-mt-24 overflow-hidden border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-cream to-sky-50/40 shadow-md"
                  >
                    <CardHeader className="pb-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
                        Step 2 · Plan My Cook
                      </p>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-xl text-emerald-950 sm:text-2xl">
                        <Clock className="size-5" />
                        ~{timePreview.total} minutes total
                      </CardTitle>
                      <CardDescription className="text-emerald-900/75">
                        {livePlan.title}
                        {livePlan.servingsHint
                          ? ` · Serves ${livePlan.servingsHint}`
                          : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div
                        className="flex h-3 overflow-hidden rounded-full bg-emerald-100"
                        role="img"
                        aria-label={`Shop ${timePreview.shop} minutes, cook ${timePreview.cook} minutes, buffer ${timePreview.buffer} minutes`}
                      >
                        {timePreview.segments.map((seg) => (
                          <div
                            key={seg.key}
                            className={cn("h-full", seg.color)}
                            style={{
                              width: `${(seg.minutes / timePreview.total) * 100}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {timePreview.segments.map((seg) => (
                          <div
                            key={seg.key}
                            className="rounded-xl border border-emerald-200/70 bg-white/80 px-2 py-2.5 text-center"
                          >
                            <p className="text-[11px] text-muted-foreground">
                              {seg.label}
                            </p>
                            <p className="font-heading text-lg font-semibold tabular-nums text-emerald-950">
                              {seg.minutes}
                              <span className="text-xs font-medium">m</span>
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-emerald-950/90">{livePlan.summary}</p>
                      <p className="rounded-lg border border-dashed border-emerald-300/80 bg-white/60 px-3 py-2 text-xs text-emerald-900/80">
                        Google Calendar opens a draft event (template link).
                        Full sync is on the roadmap.
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 border-t-0 bg-transparent">
                      <Button
                        className="gap-2 shadow-md"
                        nativeButton={false}
                        render={
                          <a
                            href={livePlan.calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
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
