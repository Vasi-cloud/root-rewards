"use client";

import { ExternalLink, Leaf, ShoppingBag, TreePine } from "lucide-react";

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
        "overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md",
        isBestEco &&
          "border-emerald-500/90 bg-gradient-to-br from-emerald-50 via-card to-cream ring-2 ring-emerald-300/70"
      )}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "font-medium",
              option.condition === "recycled" &&
                "bg-emerald-800 text-cream hover:bg-emerald-800",
              option.condition === "remanufactured" &&
                "bg-emerald-700/90 text-cream hover:bg-emerald-700",
              option.condition === "new" &&
                "bg-muted text-foreground hover:bg-muted"
            )}
          >
            {CONDITION_LABELS[option.condition]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 font-normal",
              isBestEco
                ? "border-emerald-400 bg-white/80 text-emerald-900"
                : "text-muted-foreground"
            )}
          >
            {isBestEco && <Leaf className="size-3" />}
            {option.badge}
          </Badge>
        </div>
        <div>
          <CardTitle className="font-heading text-lg leading-snug sm:text-xl">
            {option.name}
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm leading-relaxed">
            {option.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <p className="text-xs text-muted-foreground">
          OEM ref{" "}
          <span className="font-mono text-foreground">
            {identified.oemNumber}
          </span>
        </p>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estimated price
            </p>
            <p className="font-heading text-2xl font-semibold tabular-nums text-primary">
              {formatCartMoney(option.price)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-950">
          <TreePine className="size-5 shrink-0 text-emerald-800" />
          <p className="font-medium leading-snug">
            This order will plant {option.treesEstimate} tree
            {option.treesEstimate === 1 ? "" : "s"}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t bg-background/40 sm:flex-row">
        <Button
          type="button"
          className="h-11 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:flex-1"
          onClick={() => onAddToCart(option)}
          disabled={added}
        >
          <ShoppingBag className="size-4" />
          {added ? "Added to cart" : "Add to Cart"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-1.5 sm:flex-1"
          onClick={() => onBuyOnline(option)}
        >
          Buy Online · {getAmazonStoreLabel()}
          <ExternalLink className="size-3.5 opacity-70" />
        </Button>
      </CardFooter>
    </Card>
  );
}
