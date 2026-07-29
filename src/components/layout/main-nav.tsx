"use client";

import {
  ChefHat,
  HeartHandshake,
  MapPin,
  Sparkles,
  Trees,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  featured?: boolean;
  description?: string;
  icon?: LucideIcon;
};

/** Primary Leafy tools — homepage, desktop bar, and mobile menu */
export const LEAFY_NAV_ITEMS: NavItem[] = [
  {
    href: "/local",
    label: "Buy Local",
    featured: true,
    description: "Nearby stores & makers",
    icon: MapPin,
  },
  {
    href: "/kitchen",
    label: "Leafy Kitchen",
    featured: true,
    description: "Recipe → shopping list",
    icon: ChefHat,
  },
  {
    href: "/parts",
    label: "Leafy Parts",
    featured: true,
    description: "Car & bike parts finder",
    icon: Wrench,
  },
  {
    href: "/recommend",
    label: "Ask Leafy",
    featured: true,
    description: "Snap, search & shop smarter",
    icon: Sparkles,
  },
];

const exploreNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seller", label: "Sell" },
  { href: "/affiliates", label: "Affiliates" },
  { href: "/membership", label: "Membership" },
  { href: "/feedback", label: "Feedback" },
  { href: "/about", label: "About" },
];

const accountNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Overview & membership" },
  {
    href: "/dashboard/my-forest",
    label: "My Forest",
    description: "Saved recipes, parts & places",
    icon: Trees,
  },
  {
    href: "/dashboard/impact",
    label: "Your impact",
    description: "Trees, CO₂ & causes",
  },
  {
    href: "/donate",
    label: "Donate",
    description: "Support a cause · no purchase needed",
    icon: HeartHandshake,
  },
];

/**
 * Top-bar priority links — never truncated.
 * Secondary items (Membership, About, account) live in the overflow menu.
 */
const desktopPrimaryItems: NavItem[] = [
  { href: "/marketplace", label: "Marketplace" },
  ...LEAFY_NAV_ITEMS,
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function MainNav({
  className,
  variant = "full",
}: {
  className?: string;
  /** `primary` = short desktop bar; `full` = sheet / complete list */
  variant?: "full" | "primary";
}) {
  const pathname = usePathname();

  if (variant === "primary") {
    return (
      <nav
        className={cn(
          "flex min-w-0 items-center justify-center gap-1 overflow-x-auto xl:gap-1.5 2xl:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
        aria-label="Primary"
      >
        {desktopPrimaryItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const featured = Boolean(item.featured);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.description}
              className={cn(
                // shrink-0 + whitespace-nowrap: never clip labels like “Leafy Kitchen”
                "shrink-0 rounded-lg px-2 py-2 text-sm font-medium whitespace-nowrap transition-[color,background-color,transform,box-shadow] duration-200 xl:px-2.5 2xl:px-3.5",
                active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : featured
                    ? "text-emerald-900 hover:bg-emerald-50 hover:text-emerald-950 active:scale-[0.98]"
                    : "text-foreground/80 hover:bg-muted hover:text-primary active:scale-[0.98]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn("flex flex-col gap-6", className)}
      aria-label="Main menu"
    >
      <div>
        <p className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800/70">
          <HeartHandshake className="size-3.5" aria-hidden />
          Leafy tools
        </p>
        <ul className="mt-2.5 space-y-2">
          {LEAFY_NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-3.5 py-3 transition-all active:scale-[0.99]",
                    active
                      ? "border-emerald-700/40 bg-emerald-800 text-cream shadow-sm"
                      : "border-emerald-200/80 bg-emerald-50/50 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50"
                  )}
                >
                  {Icon && (
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-cream/15 text-cream"
                          : "bg-emerald-800/90 text-cream"
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold leading-tight">
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        className={cn(
                          "mt-0.5 block text-xs leading-snug",
                          active ? "text-cream/80" : "text-emerald-900/70"
                        )}
                      >
                        {item.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Your Forest
        </p>
        <ul className="mt-2 space-y-1">
          {accountNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-12 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/85 hover:bg-muted hover:text-primary"
                  )}
                >
                  {Icon ? (
                    <Icon className="size-4 shrink-0 text-emerald-800" aria-hidden />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block leading-tight">{item.label}</span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Explore
        </p>
        <ul className="mt-2 space-y-0.5">
          {exploreNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-12 items-center rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/85 hover:bg-muted hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
