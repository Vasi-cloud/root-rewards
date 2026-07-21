import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Badge } from "@/components/ui/badge";

/** Canonical registered brand string for prominent display */
export const BRAND_NAME_REGISTERED = "Forest Buddies®";

/**
 * Nav wordmark with ®.
 * Mobile: "FB®" (clean, no overflow). sm+: "Forest Buddies®".
 */
export function BrandMark({
  className = "",
  shortOnMobile = true,
}: {
  className?: string;
  shortOnMobile?: boolean;
}) {
  if (!shortOnMobile) {
    return (
      <span className={`whitespace-nowrap ${className}`}>
        {BRAND_NAME_REGISTERED}
      </span>
    );
  }

  return (
    <span className={`whitespace-nowrap tracking-tight ${className}`}>
      <span className="sm:hidden">FB®</span>
      <span className="hidden sm:inline">{BRAND_NAME_REGISTERED}</span>
    </span>
  );
}

/** Quiet badge for marketplace / shop / product headers */
export function MarketplaceBrandBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={`border-transparent bg-muted/40 font-normal text-muted-foreground ${className}`}
    >
      Forest Buddies® Marketplace
    </Badge>
  );
}

/**
 * Subtle strip for shop surfaces only
 * (marketplace, shop, cart, local — not home / about / legal / seller).
 */
export function SubtleTrademarkNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`text-center text-[9px] leading-snug tracking-wide text-muted-foreground/45 sm:text-[10px] ${className}`}
    >
      Forest Buddies® Marketplace · UK Registered Trademark (No.{" "}
      <TrademarkRegLink className="text-muted-foreground/50 underline-offset-2 hover:underline" />
      )
    </p>
  );
}

/** Minimal footer copyright for marketing / legal / home / seller */
export function MinimalTrademarkFooter({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`text-center text-[10px] text-primary-foreground/40 sm:text-[11px] ${className}`}
    >
      © {new Date().getFullYear()} Forest Buddies® • UK Registered Trademark
    </p>
  );
}

/** Shop-related routes that get the full trademark strip */
export function shouldShowShopTrademarkStrip(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/seller" || pathname.startsWith("/seller/")) return false;

  return (
    pathname === "/marketplace" ||
    pathname.startsWith("/marketplace/") ||
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/local" ||
    pathname.startsWith("/local/")
  );
}
