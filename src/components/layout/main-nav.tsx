"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Full nav — used in mobile sheet and large desktops */
const navItems = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seller", label: "Sell" },
  { href: "/local", label: "Buy Local" },
  { href: "/recommend", label: "Ask Leafy" },
  { href: "/affiliates", label: "Affiliates" },
  { href: "/membership", label: "Membership" },
  { href: "/feedback", label: "Feedback" },
  { href: "/about", label: "About" },
];

/** Compact top-bar links so the header never needs horizontal scroll */
const desktopPrimaryItems = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seller", label: "Sell" },
  { href: "/recommend", label: "Ask Leafy" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
];

export function MainNav({
  className,
  variant = "full",
}: {
  className?: string;
  /** `primary` = short desktop bar; `full` = sheet / complete list */
  variant?: "full" | "primary";
}) {
  const pathname = usePathname();
  const items = variant === "primary" ? desktopPrimaryItems : navItems;

  return (
    <nav className={cn("flex items-center gap-0.5", className)}>
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:bg-muted hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
