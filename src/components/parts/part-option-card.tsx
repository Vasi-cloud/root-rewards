"use client";

import {
  Check,
  ExternalLink,
  Leaf,
  Loader2,
  ShoppingBag,
  TreePine,
} from "lucide-react";
import { useState } from "react";

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
import { formatCartMoney } from "@/lib/cart-impact";
import {
  CONDITION_LABELS,
  type IdentifiedPart,
  type PartOption,
} from "@/lib/leafy-parts";
import { cn } from "@/lib/utils";

type PartOptionCardProps = {
  option: PartOption;
  identified: IdentifiedPart;
  onAddToCart: (option: PartOption) => void;
  onBuyOnline: (option: PartOption) => void;
  added?: boolean;
};

export function PartOptionCard({
  option,
  identified,
  onAddToCart,
  onBuyOnline,
  added,
}: PartOptionCardProps) {
  const isBestEco = option.condition === "recycled";
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (adding) return;
    setAdding(true);
    onAddToCart(option);
    await new Promise((r) => window.setTimeout(r, 420));
    setAdding(false);
  }

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-border/60 bg-card shadow-sm transition-[box-shadow,transform] duration-200 hover:shadow-md",
        isBestEco &&
          "border-emerald-500 bg-gradient-to-br from-emerald-50/95 via-white to-cream shadow-md ring-2 ring-emerald-400/45"
      )}
    >
      <CardHeader className="gap-2.5 space-y-0 px-3.5 py-3.5 sm:gap-3 sm:p-5 sm:pb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs",
              option.condition === "recycled" &&
                "bg-emerald-800 text-cream hover:bg-emerald-800",
              option.condition === "remanufactured" &&
                "bg-emerald-700 text-cream hover:bg-emerald-700",
              option.condition === "new" &&
                "border border-border bg-muted/80 text-foreground hover:bg-muted"
            )}
          >
            {CONDITION_LABELS[option.condition]}
          </Badge>
          {isBestEco ? (
            <Badge className="gap-1 rounded-md border-0 bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-cream hover:bg-emerald-600 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
              <Leaf className="size-3 sm:size-3.5" />
              Best eco choice
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="rounded-md px-2 py-0.5 text-[11px] font-normal text-muted-foreground sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs"
            >
              {option.badge}
            </Badge>
          )}
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <CardTitle className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
            {option.name}
          </CardTitle>
          <CardDescription className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground sm:min-h-[4.25rem] sm:text-sm">
            {option.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-3 px-3.5 pb-3.5 pt-0 sm:space-y-4 sm:p-5 sm:pt-0">
        <p className="break-all text-[11px] text-muted-foreground sm:text-xs">
          OEM{" "}
          <span className="font-mono font-medium text-foreground">
            {identified.oemNumber}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex flex-col justify-center rounded-xl border border-border/60 bg-background/90 px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px]">
              Price
            </p>
            <p className="font-heading mt-0.5 text-xl font-semibold tabular-nums text-primary sm:text-[1.75rem]">
              {formatCartMoney(option.price)}
            </p>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-2.5 py-3 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-3.5",
              isBestEco
                ? "border-emerald-400/90 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-950 shadow-sm"
                : "border-emerald-200/90 bg-emerald-50/80 text-emerald-950"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream shadow-sm sm:size-11">
              <TreePine className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-800/70 sm:text-[10px]">
                Tree impact
              </p>
              <p className="text-[13px] font-semibold leading-snug sm:text-[0.95rem]">
                <span className="sm:hidden">
                  {option.treesEstimate} tree
                  {option.treesEstimate === 1 ? "" : "s"}
                </span>
                <span className="hidden sm:inline">
                  Plants {option.treesEstimate} tree
                  {option.treesEstimate === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/50 bg-muted/20 px-3.5 py-3.5 sm:flex-row sm:gap-3 sm:p-5">
        <Button
          type="button"
          className={cn(
            "h-11 w-full gap-2 text-[15px] font-semibold transition-all sm:h-12 sm:flex-1 sm:text-base",
            added
              ? "bg-emerald-700 text-cream hover:bg-emerald-700"
              : "bg-emerald-800 text-cream hover:bg-emerald-900"
          )}
          onClick={() => void handleAdd()}
          disabled={adding || added}
          aria-live="polite"
        >
          {adding ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Adding…
            </>
          ) : added ? (
            <>
              <Check className="size-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              Add to Cart
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-1.5 bg-background text-[15px] hover:border-emerald-300 sm:h-12 sm:flex-1 sm:text-base"
          onClick={() => onBuyOnline(option)}
          disabled={adding}
        >
          <span className="truncate">Buy Online · {getAmazonStoreLabel()}</span>
          <ExternalLink className="size-3.5 shrink-0 opacity-70" />
        </Button>
      </CardFooter>
    </Card>
  );
}
