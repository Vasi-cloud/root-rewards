"use client";

import {
  ChefHat,
  ChevronDown,
  HeartHandshake,
  MapPin,
  Sparkles,
  Trees,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

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
  { href: "/feedback", label: "Feedback" },
  { href: "/about", label: "About" },
];

const accountNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Overview & account" },
  {
    href: "/membership",
    label: "Membership",
    description: "Impact Member benefits",
  },
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

/** Always visible in the top bar (never folded into More). */
const desktopCoreItems: NavItem[] = [
  { href: "/marketplace", label: "Marketplace" },
  LEAFY_NAV_ITEMS[0], // Buy Local
  {
    href: "/membership",
    label: "Impact Member",
    description: "Cause credit · support the platform",
  },
];

/** Fold into More below 1400px so Get started / avatar never clip. */
const desktopOverflowItems: NavItem[] = [
  LEAFY_NAV_ITEMS[1], // Kitchen
  LEAFY_NAV_ITEMS[2], // Parts
  LEAFY_NAV_ITEMS[3], // Ask
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  compactAsk,
}: {
  item: NavItem;
  pathname: string;
  compactAsk?: boolean;
}) {
  const active = isActivePath(pathname, item.href);
  const featured = Boolean(item.featured);
  const shortAsk = compactAsk && item.href === "/recommend";
  const shortImpact = item.href === "/membership";

  return (
    <Link
      href={item.href}
      title={item.description ?? item.label}
      className={cn(
        "shrink-0 rounded-lg px-1 py-2 text-sm font-medium whitespace-nowrap transition-[color,background-color,transform,box-shadow] duration-200 min-[1400px]:px-1.5 2xl:px-2.5",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : featured
            ? "text-emerald-900 hover:bg-emerald-50 hover:text-emerald-950 active:scale-[0.98]"
            : "text-foreground/80 hover:bg-muted hover:text-primary active:scale-[0.98]"
      )}
    >
      {shortAsk ? (
        <>
          <span className="2xl:hidden">Ask</span>
          <span className="hidden 2xl:inline">Ask Leafy</span>
        </>
      ) : shortImpact ? (
        <>
          <span className="min-[1400px]:hidden">Impact</span>
          <span className="hidden min-[1400px]:inline">Impact Member</span>
        </>
      ) : (
        item.label
      )}
    </Link>
  );
}

function MoreNavMenu({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const anyActive = items.some((item) => isActivePath(pathname, item.href));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0 min-[1400px]:hidden" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
          anyActive || open
            ? "bg-primary/10 text-primary"
            : "text-emerald-900 hover:bg-emerald-50"
        )}
      >
        More
        <ChevronDown
          className={cn(
            "size-3.5 opacity-70 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 z-50 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-border/80 bg-cream py-1 shadow-lg"
        >
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  "flex min-h-11 items-center gap-2 px-3 py-2 text-sm whitespace-nowrap hover:bg-emerald-50",
                  active ? "font-medium text-primary" : "text-foreground/90"
                )}
                onClick={() => setOpen(false)}
              >
                {Icon ? (
                  <Icon className="size-3.5 shrink-0 text-emerald-800" />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
        className={cn("flex min-w-0 items-center gap-0.5", className)}
        aria-label="Primary"
      >
        {desktopCoreItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {/* Full Leafy labels only when there is room (≥1400px) */}
        <div className="hidden items-center gap-0.5 min-[1400px]:flex">
          {desktopOverflowItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              compactAsk
            />
          ))}
        </div>
        <MoreNavMenu items={desktopOverflowItems} pathname={pathname} />
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
                    <Icon className="size-4 shrink-0 opacity-80" />
                  ) : null}
                  {item.label}
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
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {exploreNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted"
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
