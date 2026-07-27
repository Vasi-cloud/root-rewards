"use client";

import {
  ArrowRight,
  ChefHat,
  MapPin,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  {
    href: "/local",
    label: "Buy Local",
    hint: "Check nearby stores & makers",
    icon: MapPin,
  },
  {
    href: "/kitchen",
    label: "Leafy Kitchen",
    hint: "Turn a recipe into a shopping list",
    icon: ChefHat,
  },
  {
    href: "/parts",
    label: "Leafy Parts",
    hint: "Find car & bike parts",
    icon: Wrench,
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    hint: "Browse more eco finds",
    icon: ShoppingBag,
  },
] as const;

type AskLeafyNextStepsProps = {
  className?: string;
  /** Optional focus — e.g. local after a photo match */
  highlightHref?: string;
};

export function AskLeafyNextSteps({
  className,
  highlightHref,
}: AskLeafyNextStepsProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-cream to-white px-3.5 py-4 sm:px-5 sm:py-5",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
        Next steps
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep going with another Leafy tool — or shop the marketplace.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {NEXT_STEPS.map((step) => {
          const Icon = step.icon;
          const highlight = highlightHref === step.href;
          return (
            <li key={step.href}>
              <Button
                nativeButton={false}
                render={<Link href={step.href} />}
                variant={highlight ? "default" : "outline"}
                className={cn(
                  "h-auto min-h-12 w-full justify-start gap-3 px-3 py-2.5 text-left whitespace-normal sm:min-h-11",
                  highlight
                    ? "bg-emerald-800 text-cream hover:bg-emerald-900"
                    : "border-emerald-200/90 bg-white/90 text-emerald-950 hover:bg-emerald-50"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    highlight
                      ? "bg-cream/15 text-cream"
                      : "bg-emerald-800/90 text-cream"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    {step.label}
                    <ArrowRight className="size-3.5 opacity-70" />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-snug",
                      highlight ? "text-cream/80" : "text-muted-foreground"
                    )}
                  >
                    {step.hint}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AskLeafyDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-xl border border-dashed border-amber-200/90 bg-amber-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-amber-950/90 sm:text-xs",
        className
      )}
      role="note"
    >
      Leafy offers shopping guidance and estimates — not medical, legal, or
      professional advice. Product matches and local stock are illustrative;
      always confirm details with sellers and packaging.
    </p>
  );
}
