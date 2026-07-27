"use client";

import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { LanguageComingSoonBanner } from "@/components/layout/language-coming-soon-banner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const dashboardNav = [
  { href: "/dashboard", label: "Overview", short: "Home" },
  { href: "/dashboard/my-forest", label: "My Forest", short: "Forest" },
  { href: "/dashboard/impact", label: "Your impact", short: "Impact" },
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/90 shadow-[0_1px_0_0_rgba(27,67,50,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 font-heading text-base font-semibold text-primary sm:text-lg"
            aria-label="Forest Buddies® home"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105 sm:size-9">
              <Leaf className="size-4 sm:size-5" aria-hidden />
            </span>
            <BrandMark />
          </Link>
          <nav
            className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 px-2 text-sm lg:flex"
            aria-label="Dashboard"
          >
            {dashboardNav.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-2.5 py-2 whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5">
            <DashboardSignOut className="min-h-10 px-2.5 text-xs sm:min-h-9 sm:text-sm" />
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Dashboard sections"
        >
          {dashboardNav.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-foreground/80 hover:bg-muted hover:text-primary"
                )}
              >
                {item.short}
              </Link>
            );
          })}
        </nav>
      </header>
      <LanguageComingSoonBanner />
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
                      "block rounded-xl px-3 py-2.5 transition-colors",
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
