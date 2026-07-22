"use client";

import { Check, ExternalLink, Leaf, ShoppingBag, TreePine } from "lucide-react";

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

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60 bg-card shadow-sm",
        isBestEco &&
          "border-emerald-500 bg-gradient-to-br from-emerald-50/95 via-white to-cream shadow-md ring-2 ring-emerald-400/50"
      )}
    >
      <CardHeader className="gap-3 space-y-0 p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold",
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
            <Badge className="gap-1 rounded-lg border-0 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-cream hover:bg-emerald-600">
              <Leaf className="size-3.5" />
              Best eco choice
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="rounded-lg px-2.5 py-1 text-xs font-normal text-muted-foreground"
            >
              {option.badge}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <CardTitle className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
            {option.name}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {option.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        <p className="text-xs text-muted-foreground">
          OEM{" "}
          <span className="font-mono font-medium text-foreground">
            {identified.oemNumber}
          </span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col justify-center rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Price
            </p>
            <p className="font-heading mt-0.5 text-2xl font-semibold tabular-nums text-primary sm:text-3xl">
              {formatCartMoney(option.price)}
            </p>
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-[1.2] items-center gap-3 rounded-2xl border px-4 py-3",
              isBestEco
                ? "border-emerald-400/80 bg-emerald-100/80 text-emerald-950"
                : "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-cream">
              <TreePine className="size-5" />
            </span>
            <p className="text-sm font-semibold leading-snug sm:text-base">
              This order will plant {option.treesEstimate} tree
              {option.treesEstimate === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2.5 border-t border-border/50 bg-muted/20 p-4 sm:flex-row sm:p-5">
        <Button
          type="button"
          className="h-12 w-full gap-2 bg-emerald-800 text-base font-semibold text-cream hover:bg-emerald-900 sm:flex-1"
          onClick={() => onAddToCart(option)}
        >
          {added ? (
            <>
              <Check className="size-4" />
              Added — add again?
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
          className="h-12 w-full gap-1.5 bg-background text-base sm:flex-1"
          onClick={() => onBuyOnline(option)}
        >
          Buy Online · {getAmazonStoreLabel()}
          <ExternalLink className="size-3.5 opacity-70" />
        </Button>
      </CardFooter>
    </Card>
  );
}
