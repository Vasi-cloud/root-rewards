import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Canonical registered brand string for prominent display */
export const BRAND_NAME_REGISTERED = "Forest Buddies®";

/** Compact registered short form for narrow headers */
export const BRAND_NAME_SHORT = "Forest®";

/**
 * Nav wordmark with ®.
 * Mobile: leaf + “Forest®”. Desktop (sm+): “Forest Buddies®”.
 * Only one label is visible at a time — never truncate a dual-label wrapper
 * (that caused “FBFB®” / incomplete marks on small screens).
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
      <span className={cn("whitespace-nowrap", className)}>
        {BRAND_NAME_REGISTERED}
      </span>
    );
  }

  return (
    <span className={cn("whitespace-nowrap", className)}>
      <span className="inline sm:hidden">{BRAND_NAME_SHORT}</span>
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
      className={cn(
        "border-transparent bg-muted/40 font-normal text-muted-foreground",
        className
      )}
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
      className={cn(
        "text-center text-[9px] leading-snug tracking-wide text-muted-foreground/45 sm:text-[10px]",
        className
      )}
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
      className={cn(
        "text-center text-[10px] text-primary-foreground/40 sm:text-[11px]",
        className
      )}
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
    pathname.startsWith("/local/") ||
    pathname === "/kitchen" ||
    pathname.startsWith("/kitchen/") ||
    pathname === "/assistant" ||
    pathname.startsWith("/assistant/") ||
    pathname === "/parts" ||
    pathname.startsWith("/parts/") ||
    pathname === "/leafy-parts" ||
    pathname.startsWith("/leafy-parts/")
  );
}
