"use client";

import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const dashboardNav = [
  { href: "/dashboard", label: "Overview", short: "Home" },
  { href: "/membership", label: "Membership", short: "Plan" },
  { href: "/dashboard/settings", label: "Account settings", short: "Settings" },
  { href: "/seller", label: "Become a seller", short: "Sell" },
  { href: "/marketplace", label: "Marketplace", short: "Shop" },
  { href: "/affiliates", label: "Affiliate tools", short: "Affiliate" },
];

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-cream">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-sm font-semibold text-primary sm:text-base"
            aria-label="Forest Buddies® home"
          >
            <Leaf className="size-4 shrink-0" />
            <BrandMark />
          </Link>
          <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-sm lg:flex">
            {dashboardNav.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap transition-colors",
                    active
                      ? "font-medium text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5">
            <DashboardSignOut className="min-h-9 px-2.5 text-xs sm:text-sm" />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1.5 px-3 pb-3 lg:hidden">
          {dashboardNav.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground/80 hover:bg-muted hover:text-primary"
                )}
              >
                {item.short}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 gap-8 px-3 py-6 sm:px-6 sm:py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dashboard
          </p>
          <ul className="space-y-1 text-sm">
            {dashboardNav.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-2 transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Separator className="my-4" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LogOut className="size-3.5 shrink-0" />
            <DashboardSignOut variant="link" />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
