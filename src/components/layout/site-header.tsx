"use client";

import {
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { MainNav } from "@/components/layout/main-nav";
import { DashboardSignOut } from "@/components/dashboard/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  formatLanguageOptionLabel,
  SUPPORTED_LANGUAGES,
  useI18n,
  type Language,
} from "@/contexts/i18n-context";
import { buildLoginHref, buildRegisterHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { openSupportChat } from "@/lib/support-agent";

function LanguageSelect({ id }: { id: string }) {
  const { lang, setLang, isLangReady } = useI18n();
  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="h-11 w-full rounded-lg border border-border bg-background px-2 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring xl:h-8 xl:max-w-[9.5rem] xl:text-xs"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {formatLanguageOptionLabel(l)}
          </option>
        ))}
      </select>
      {!isLangReady && selected && id.includes("menu") ? (
        <p className="text-[11px] leading-snug text-amber-800/90">
          {selected.label} coming soon — English for now.
        </p>
      ) : null}
    </div>
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
      className={cn("relative size-10 shrink-0 p-0 sm:size-11", className)}
      aria-label={totalItems > 0 ? `Cart, ${totalItems} items` : "Cart"}
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

/** Account dropdown — Settings + Sign out stay reachable without clipping. */
function AccountMenu() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  if (!user) return null;

  const label =
    profile?.displayName?.trim() ||
    user.email?.split("@")[0] ||
    "Account";
  const initials = label.slice(0, 1).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white/90 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar size="sm" className="size-7">
          {profile?.photoURL ? (
            <AvatarImage src={profile.photoURL} alt="" />
          ) : null}
          <AvatarFallback className="bg-emerald-800 text-[11px] font-semibold text-cream">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border/80 bg-cream py-1 shadow-lg"
        >
          <div className="border-b border-border/60 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {label}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-emerald-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-3.5 text-emerald-800" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-emerald-50"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-3.5 text-emerald-800" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Collapse strategy:
 * - < lg: brand + icons + menu
 * - lg–xl: brand + primary nav (full labels) + Dashboard + menu
 *   Settings / Sign out / language stay in the menu — never clipped
 * - xl+: brand + primary nav + language + cart + Dashboard + account menu + More
 */
export function SiteHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const loginHref = buildLoginHref(pathname);
  const registerHref = buildRegisterHref(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Hide floating chat FAB while the nav drawer is open (it sat above Sign out)
  useEffect(() => {
    document.body.dataset.navDrawerOpen = menuOpen ? "1" : "";
    return () => {
      delete document.body.dataset.navDrawerOpen;
    };
  }, [menuOpen]);

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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* xl+: language · chat · cart · Dashboard · account avatar (last) */}
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
                <AccountMenu />
              </>
            ) : (
              <>
                <Button
                  nativeButton={false}
                  render={<Link href={loginHref} />}
                  variant="outline"
                  size="sm"
                  className="shrink-0 px-3"
                >
                  Sign in
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href={registerHref} />}
                  size="sm"
                  className="shrink-0 px-3"
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Below xl: chat + cart icons */}
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

          {/* Keep Dashboard visible on lg–xl without crowding Sign out into the bar */}
          {user ? (
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              size="sm"
              variant="outline"
              className="hidden shrink-0 px-2.5 lg:inline-flex xl:hidden"
            >
              Dashboard
            </Button>
          ) : (
            <Button
              nativeButton={false}
              render={<Link href={loginHref} />}
              size="sm"
              variant="outline"
              className="hidden shrink-0 px-2.5 lg:inline-flex xl:hidden"
            >
              Sign in
            </Button>
          )}

          {/* Mobile / mid-width menu only — never sits beside the desktop account avatar */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white/80 xl:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-dvh max-h-dvh w-[min(100vw-0.75rem,22.5rem)] max-w-full flex-col gap-0 overflow-hidden p-0"
            >
              {/* Sticky drawer header — brand + close stay visible while body scrolls */}
              <SheetHeader className="shrink-0 space-y-1 border-b border-border/70 bg-cream px-4 py-3.5 pr-14 text-left sm:px-5">
                <SheetTitle className="font-heading text-lg text-primary">
                  Forest Buddies®
                </SheetTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Shop kindly · Leafy tools · Local &amp; eco
                </p>
              </SheetHeader>

              {/* Scrollable body — Settings / Sign out reachable at the bottom */}
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-3 sm:px-5 [-webkit-overflow-scrolling:touch] pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
                <MainNav variant="full" />

                <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-4">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="lang-switcher-menu"
                  >
                    Language
                  </label>
                  <LanguageSelect id="lang-switcher-menu" />
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
                        className="min-h-11 w-full xl:hidden"
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
                        render={<Link href={loginHref} />}
                        variant="outline"
                        className="min-h-11 w-full xl:hidden"
                      >
                        Sign in
                      </Button>
                      <Button
                        nativeButton={false}
                        render={<Link href={registerHref} />}
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
