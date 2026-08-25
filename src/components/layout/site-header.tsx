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
import { VoiceNavControl } from "@/components/voice/voice-nav-control";

const TAP = "min-h-11 min-w-11";

function LanguageSelect({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const { lang, setLang, isLangReady } = useI18n();
  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === lang);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="h-11 w-full rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:h-11 lg:max-w-[10.5rem] lg:text-xs xl:max-w-[11.5rem] xl:text-sm"
        aria-label="Select language"
        title={selected ? formatLanguageOptionLabel(selected) : "Language"}
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
      className={cn(
        "relative shrink-0 p-0",
        TAP,
        className
      )}
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

/** Account dropdown — Settings + Sign out. */
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
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-white/90 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          TAP
        )}
      >
        <Avatar size="sm" className="size-8">
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
            className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-emerald-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-3.5 text-emerald-800" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-emerald-50"
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
 * Header layout (V2-clear pattern):
 * - < lg: brand (full name) · mic · cart · Sign in/Account · menu
 * - lg+: brand · primary nav (full labels, never clipped) · language · mic · cart · auth
 * - Get started / language / chat stay out of the mobile top bar when crowded
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

  useEffect(() => {
    document.body.dataset.navDrawerOpen = menuOpen ? "1" : "";
    return () => {
      delete document.body.dataset.navDrawerOpen;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream shadow-[0_1px_0_0_rgba(27,67,50,0.06)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        {/* Left: mark + full Forest Buddies® — never truncated / overlapped */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-1.5 font-heading font-semibold text-primary transition-opacity hover:opacity-90 sm:gap-2"
          aria-label="Forest Buddies® home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Leaf className="size-4 sm:size-5" aria-hidden />
          </span>
          <BrandMark
            compactOnNarrow={false}
            className="whitespace-nowrap text-sm leading-none tracking-tight sm:text-base md:text-lg"
          />
        </Link>

        {/* Desktop primary nav — only when utilities are also desktop (lg+) */}
        <MainNav
          variant="primary"
          className="mx-1 hidden flex-1 justify-center lg:flex"
        />

        {/* Desktop utilities (lg+): language · mic · chat · cart · auth */}
        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex xl:gap-1.5">
          <LanguageSelect id="lang-switcher-desktop" />
          <VoiceNavControl variant="icon" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("shrink-0 p-0", TAP)}
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
                className={cn("shrink-0 whitespace-nowrap px-3", TAP)}
              >
                Dashboard
              </Button>
              <AccountMenu />
            </>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5 pl-0.5">
              <Button
                nativeButton={false}
                render={<Link href={loginHref} />}
                variant="outline"
                size="sm"
                className={cn("shrink-0 whitespace-nowrap px-3", TAP)}
              >
                Sign in
              </Button>
              <Button
                nativeButton={false}
                render={<Link href={registerHref} />}
                size="sm"
                className={cn("shrink-0 whitespace-nowrap px-3", TAP)}
              >
                Get started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile / tablet (< lg): mic · cart · Sign in/Account · menu */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:hidden">
          <VoiceNavControl variant="icon" className={TAP} />
          <CartButton />
          {user ? (
            <AccountMenu />
          ) : (
            <Button
              nativeButton={false}
              render={<Link href={loginHref} />}
              size="sm"
              variant="outline"
              className={cn(
                "inline-flex shrink-0 items-center overflow-visible px-2.5 text-xs whitespace-nowrap sm:px-3 sm:text-sm",
                TAP
              )}
            >
              Sign in
            </Button>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-white",
                TAP
              )}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-dvh max-h-dvh w-[min(100vw-0.75rem,22.5rem)] max-w-full flex-col gap-0 overflow-hidden p-0"
            >
              <SheetHeader className="shrink-0 space-y-1 border-b border-border/70 bg-cream px-4 py-3.5 pr-14 text-left sm:px-5">
                <SheetTitle className="font-heading text-lg text-primary">
                  Forest Buddies®
                </SheetTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Shop, fund causes, and grow the wild together.
                </p>
              </SheetHeader>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-3 sm:px-5 [-webkit-overflow-scrolling:touch] pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
                {!user ? (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={loginHref}
                          onClick={() => setMenuOpen(false)}
                        />
                      }
                      variant="outline"
                      className="min-h-11 w-full"
                    >
                      Sign in
                    </Button>
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={registerHref}
                          onClick={() => setMenuOpen(false)}
                        />
                      }
                      className="min-h-11 w-full whitespace-nowrap"
                    >
                      Get started
                    </Button>
                  </div>
                ) : null}

                <div className="mb-5">
                  <VoiceNavControl
                    variant="menu"
                    onAfterNavigate={() => setMenuOpen(false)}
                  />
                </div>

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
                  {user ? (
                    <div className="grid grid-cols-1 gap-2 pt-1">
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
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
