"use client";

import Link from "next/link";
import { Leaf, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { AccountMenu } from "@/components/layout/account-menu";
import { LanguageComingSoonBanner } from "@/components/layout/language-coming-soon-banner";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useSeller } from "@/contexts/seller-context";
import { isAdminUser } from "@/lib/admin";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground/80 hover:bg-muted hover:text-primary"
      )}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const { seller } = useSeller();
  const isAdmin = isAdminUser(user?.email);

  const sellerLabel =
    seller?.status === "approved" || seller?.status === "paused"
      ? "Seller shop"
      : "Become a seller";

  const dashboardNav = useMemo((): NavItem[] => {
    return [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/impact", label: "Your impact" },
      { href: "/dashboard/my-forest", label: "My Forest" },
      { href: "/membership", label: "Membership" },
      { href: "/dashboard/settings", label: "Account settings" },
      { href: "/seller", label: sellerLabel },
    ];
  }, [sellerLabel]);

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-cream">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/90 shadow-[0_1px_0_0_rgba(27,67,50,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
          <Link
            href="/marketplace"
            className="group flex min-w-0 shrink items-center gap-2 font-heading text-base font-semibold text-primary sm:text-lg"
            aria-label="Back to Marketplace"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105 sm:size-9">
              <Leaf className="size-4 sm:size-5" aria-hidden />
            </span>
            <span className="min-w-0 truncate">
              <BrandMark />
            </span>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              Marketplace
            </span>
          </Link>
          <AccountMenu />
        </div>
      </header>
      <LanguageComingSoonBanner />
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-6 px-3 py-6 sm:px-6 sm:py-8 md:flex-row md:gap-8">
        <aside className="w-full shrink-0 md:w-48">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dashboard
          </p>
          <ul className="space-y-1">
            {dashboardNav.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  href={item.href}
                  label={item.label}
                  active={navActive(pathname, item.href)}
                />
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <>
              <Separator className="my-4" />
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-amber-100 font-medium text-amber-950"
                    : "text-amber-900/80 hover:bg-amber-50"
                )}
              >
                <Shield className="size-3.5 shrink-0" />
                Admin
              </Link>
            </>
          ) : null}
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
