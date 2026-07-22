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
import { formatCartMoney } from "@/lib/cart-impact";
import {
  CONDITION_LABELS,
  type IdentifiedPart,
  type PartOption,
} from "@/lib/leafy-parts";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
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
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md",
        option.highlight &&
          "border-emerald-400/80 bg-gradient-to-br from-emerald-50/90 via-card to-cream ring-1 ring-emerald-200/80"
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
          {option.highlight && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-300 bg-white/70 font-normal text-emerald-900"
            >
              <Leaf className="size-3" />
              {option.badge}
            </Badge>
          )}
          {!option.highlight && (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {option.badge}
            </Badge>
          )}
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
          <span className="font-mono text-foreground">{identified.oemNumber}</span>
          {" · "}
          Eco score {option.sustainabilityScore}/100
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
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
            <TreePine className="mt-0.5 size-4 shrink-0 text-emerald-800" />
            <p>
              Ordering this part will plant{" "}
              <span className="font-semibold">
                {option.treesEstimate} tree
                {option.treesEstimate === 1 ? "" : "s"}
              </span>
            </p>
          </div>
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
