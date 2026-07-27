"use client";

import {
  ChefHat,
  MapPin,
  Sparkles,
  Trees,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const HUB_LINKS: Array<{
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}> = [
  { href: "/local", label: "Buy Local", short: "Local", icon: MapPin },
  { href: "/kitchen", label: "Leafy Kitchen", short: "Kitchen", icon: ChefHat },
  { href: "/parts", label: "Leafy Parts", short: "Parts", icon: Wrench },
  { href: "/recommend", label: "Ask Leafy", short: "Ask", icon: Sparkles },
  {
    href: "/dashboard/my-forest",
    label: "My Forest",
    short: "Forest",
    icon: Trees,
  },
];

/**
 * Compact cross-links between Leafy tools + My Forest.
 * Polish-only — no feature logic.
 */
export function LeafyHubLinks({
  className,
  omitHref,
  dense = false,
}: {
  className?: string;
  /** Hide the current page’s own link */
  omitHref?: string;
  dense?: boolean;
}) {
  const items = HUB_LINKS.filter((item) => item.href !== omitHref);

  return (
    <nav
      aria-label="Leafy tools"
      className={cn(
        "flex flex-wrap gap-1.5 sm:gap-2",
        dense ? "justify-start" : "justify-center sm:justify-start",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white/90 px-3 text-xs font-medium text-emerald-950 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] sm:min-h-9 sm:text-sm",
              dense && "min-h-10 px-2.5 sm:min-h-8"
            )}
          >
            <Icon className="size-3.5 shrink-0 text-emerald-800" aria-hidden />
            <span className="sm:hidden">{item.short}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
