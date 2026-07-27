"use client";

import { Leaf, Menu, MessageCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { MainNav } from "@/components/layout/main-nav";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { SUPPORTED_LANGUAGES, useI18n } from "@/contexts/i18n-context";
import type { Language } from "@/contexts/i18n-context";
import { openSupportChat } from "@/lib/support-agent";

function LanguageSelect({ id }: { id: string }) {
  const { lang, setLang } = useI18n();

  return (
    <select
      id={id}
      value={lang}
      onChange={(e) => setLang(e.target.value as Language)}
      className="h-11 w-full rounded-lg border border-border bg-background px-2 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:h-8 md:w-auto md:text-xs"
      aria-label="Select language"
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.short} — {l.label}
        </option>
      ))}
    </select>
  );
}

function CartButton({ className }: { className?: string }) {
  const { totalItems } = useCart();

  return (
    <Button
      nativeButton={false}
      render={<Link href="/cart" />}
      variant="ghost"
      size="sm"
      className={`relative size-10 shrink-0 p-0 sm:size-11 ${className ?? ""}`}
      aria-label={
        totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"
      }
    >
      <ShoppingCart className="size-4" />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Button>
  );
}

/**
 * Collapse strategy:
 * - < lg: brand + icon actions + menu (mobile)
 * - lg–xl: brand + primary nav (full labels, no clip) + cart + menu
 *   Secondary (Dashboard / Settings / auth / language / Membership) stay in the menu
 * - xl+: brand + primary nav + language + cart + Dashboard / auth + More menu
 */
export function SiteHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-cream/90 shadow-[0_1px_0_0_rgba(27,67,50,0.04)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 font-heading text-base font-semibold text-primary transition-opacity hover:opacity-90 sm:text-lg"
          aria-label="Forest Buddies® home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105 sm:size-9">
            <Leaf className="size-4 sm:size-5" aria-hidden />
          </span>
          <BrandMark />
        </Link>

        <MainNav
          variant="primary"
          className="hidden flex-none justify-center lg:flex"
        />

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {/* Wide desktop account/actions — kept off mid widths to avoid squashing nav */}
          <div className="hidden items-center gap-1.5 xl:flex">
            <LanguageSelect id="lang-switcher-desktop" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              aria-label="Open support chat"
              onClick={() => openSupportChat()}
            >
              <MessageCircle className="size-4" />
            </Button>
            <CartButton />
            {user ? (
              <>
                <Button
                  nativeButton={false}
                  render={<Link href="/dashboard" />}
                  size="sm"
                  variant="outline"
                  className="shrink-0 px-3"
                >
                  Dashboard
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/dashboard/settings" />}
                  size="sm"
                  variant="ghost"
                  className="hidden shrink-0 px-2.5 2xl:inline-flex"
                >
                  Settings
                </Button>
                <DashboardSignOut className="shrink-0 px-2.5" />
              </>
            ) : (
              <>
                <Button
                  nativeButton={false}
                  render={<Link href="/login" />}
                  variant="outline"
                  size="sm"
                  className="shrink-0 px-3"
                >
                  Sign in
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/register" />}
                  size="sm"
                  className="shrink-0 px-3"
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Below xl: chat + cart stay as icons beside the menu */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-10 shrink-0 p-0 xl:hidden"
            aria-label="Open support chat"
            onClick={() => openSupportChat()}
          >
            <MessageCircle className="size-5" />
          </Button>
          <CartButton className="xl:hidden" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white/80 xl:h-9 xl:w-auto xl:gap-1.5 xl:px-3 xl:rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="size-5 xl:size-4" />
              <span className="hidden xl:inline">More</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[min(100vw-0.75rem,22.5rem)] max-w-full flex-col overflow-hidden px-4 sm:px-6"
            >
              <SheetHeader className="shrink-0 space-y-1.5 pb-2 text-left">
                <SheetTitle className="font-heading text-lg text-primary">
                  Forest Buddies®
                </SheetTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Shop kindly · Leafy tools · Local &amp; eco
                </p>
              </SheetHeader>
              <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pb-6">
                <MainNav variant="full" />
                <div className="mt-auto flex flex-col gap-2.5 border-t border-border pt-4">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="lang-switcher-mobile"
                  >
                    Language
                  </label>
                  <LanguageSelect id="lang-switcher-mobile" />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full justify-start gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      openSupportChat();
                    }}
                  >
                    <MessageCircle className="size-4" />
                    Chat with Sprout
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/cart" />}
                    variant="outline"
                    className="min-h-11 w-full justify-start gap-2"
                  >
                    <ShoppingCart className="size-4" />
                    Cart
                    {totalItems > 0 ? ` (${totalItems})` : ""}
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/membership" />}
                    variant="outline"
                    className="min-h-11 w-full justify-start"
                  >
                    Membership
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/seller" />}
                    variant="outline"
                    className="min-h-11 w-full justify-start"
                  >
                    Become a seller
                  </Button>
                  {user ? (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <Button
                        nativeButton={false}
                        render={<Link href="/dashboard" />}
                        className="min-h-11 w-full"
                      >
                        Dashboard
                      </Button>
                      <Button
                        nativeButton={false}
                        render={<Link href="/dashboard/settings" />}
                        variant="outline"
                        className="min-h-11 w-full"
                      >
                        Account settings
                      </Button>
                      <DashboardSignOut className="min-h-11 w-full justify-center" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                      <Button
                        nativeButton={false}
                        render={<Link href="/login" />}
                        variant="outline"
                        className="min-h-11 w-full"
                      >
                        Sign in
                      </Button>
                      <Button
                        nativeButton={false}
                        render={<Link href="/register" />}
                        className="min-h-11 w-full"
                      >
                        Get started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
