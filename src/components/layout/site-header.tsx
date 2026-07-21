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

export function SiteHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-2 overflow-hidden px-3 sm:h-16 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 max-w-[42%] items-center gap-2 font-heading text-base font-semibold text-primary sm:max-w-none sm:text-lg md:text-xl"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-9">
            <Leaf className="size-4 sm:size-5" />
          </span>
          <BrandMark className="truncate" />
        </Link>

        <MainNav
          variant="primary"
          className="hidden min-w-0 flex-1 justify-center overflow-hidden lg:flex"
        />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <div className="hidden items-center gap-1.5 lg:flex">
            <LanguageSelect id="lang-switcher-desktop" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
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
                  className="px-2.5"
                >
                  Dashboard
                </Button>
                <DashboardSignOut className="px-2.5" />
              </>
            ) : (
              <>
                <Button
                  nativeButton={false}
                  render={<Link href="/login" />}
                  variant="outline"
                  size="sm"
                  className="px-2.5"
                >
                  Sign in
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/register" />}
                  size="sm"
                  className="px-2.5"
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile / tablet: icon actions + menu */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-10 p-0 lg:hidden"
            aria-label="Open support chat"
            onClick={() => openSupportChat()}
          >
            <MessageCircle className="size-5" />
          </Button>
          <CartButton className="lg:hidden" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[min(100vw-1.5rem,20rem)] max-w-full flex-col overflow-hidden"
            >
              <SheetHeader className="shrink-0">
                <SheetTitle className="font-heading">
                  Forest Buddies®
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4">
                <MainNav
                  variant="full"
                  className="flex-col items-stretch [&>a]:px-3 [&>a]:py-2.5"
                />
                <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
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
                    className="w-full justify-start gap-2"
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
                    className="w-full justify-start gap-2"
                  >
                    <ShoppingCart className="size-4" />
                    Cart
                    {totalItems > 0 ? ` (${totalItems})` : ""}
                  </Button>
                  <Button
                    nativeButton={false}
                    render={<Link href="/seller" />}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    Become a seller
                  </Button>
                  {user ? (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <Button
                        nativeButton={false}
                        render={<Link href="/dashboard" />}
                        className="w-full min-h-11"
                      >
                        Dashboard
                      </Button>
                      <DashboardSignOut className="w-full min-h-11 justify-center" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                      <Button
                        nativeButton={false}
                        render={<Link href="/login" />}
                        variant="outline"
                        className="w-full min-h-11"
                      >
                        Sign in
                      </Button>
                      <Button
                        nativeButton={false}
                        render={<Link href="/register" />}
                        className="w-full min-h-11"
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
