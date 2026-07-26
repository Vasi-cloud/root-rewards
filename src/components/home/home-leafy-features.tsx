"use client";

import {
  ArrowRight,
  ChefHat,
  MapPin,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HomeLeafyFeature = {
  href: string;
  title: string;
  benefit: string;
  cta: string;
  icon: LucideIcon;
  accent: string;
};

export const HOME_LEAFY_FEATURES: HomeLeafyFeature[] = [
  {
    href: "/kitchen",
    title: "Leafy Kitchen",
    benefit:
      "Paste a recipe, get an aisle-sorted list, and shop local or online in minutes.",
    cta: "Plan a cook",
    icon: ChefHat,
    accent: "from-emerald-800/10 via-emerald-50 to-cream",
  },
  {
    href: "/parts",
    title: "Leafy Parts Finder",
    benefit:
      "Identify car and bike parts, compare options, and try local recyclers first.",
    cta: "Find a part",
    icon: Wrench,
    accent: "from-sky-800/10 via-sky-50/80 to-cream",
  },
  {
    href: "/local",
    title: "Buy Local",
    benefit:
      "Find nearby stores and makers for ingredients or parts — then confirm in person.",
    cta: "Shop nearby",
    icon: MapPin,
    accent: "from-lime-800/10 via-lime-50/70 to-cream",
  },
  {
    href: "/recommend",
    title: "Ask Leafy",
    benefit:
      "Snap a product or ask a question — get eco matches and friendly next steps.",
    cta: "Ask Leafy",
    icon: Sparkles,
    accent: "from-teal-800/10 via-teal-50/70 to-cream",
  },
];

type HomeLeafyFeaturesProps = {
  className?: string;
};

export function HomeLeafyFeatures({ className }: HomeLeafyFeaturesProps) {
  return (
    <section
      id="leafy-tools"
      className={cn(
        "relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-cream via-sage/15 to-cream px-4 py-14 sm:scroll-mt-24 sm:px-6 sm:py-20",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage to-transparent"
        aria-hidden
      />
      <div className="mx-auto w-full max-w-5xl sm:max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/70">
          Start here
        </p>
        <h2 className="font-heading mt-2 max-w-2xl text-2xl font-semibold text-primary sm:text-4xl">
          Meet your Leafy helpers
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Four simple tools to shop kinder — cook, find parts, buy nearby, or ask
          Leafy. Pick one and go.
        </p>

        <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
          {HOME_LEAFY_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.href}
                className="animate-fb-fade-up"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <article
                  className={cn(
                    "flex h-full flex-col rounded-2xl border border-emerald-200/70 bg-gradient-to-br p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5",
                    feature.accent
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-cream shadow-sm sm:size-12">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-lg font-semibold text-emerald-950 sm:text-xl">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-emerald-950/75">
                        {feature.benefit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-1 sm:mt-5">
                    <Button
                      nativeButton={false}
                      render={<Link href={feature.href} />}
                      className="h-12 w-full gap-2 bg-emerald-800 text-cream hover:bg-emerald-900 sm:h-10 sm:w-auto"
                    >
                      {feature.cta}
                      <ArrowRight className="size-4 opacity-90" />
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
