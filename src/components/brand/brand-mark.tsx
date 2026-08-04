import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Canonical registered brand string for prominent display */
export const BRAND_NAME_REGISTERED = "Forest Buddies®";

/** Full name without ® — only when the bar is extremely narrow */
export const BRAND_NAME_COMPACT = "Forest Buddies";

/**
 * @deprecated Prefer BRAND_NAME_COMPACT / BRAND_NAME_REGISTERED.
 * Kept so older imports still compile; no longer used in the header.
 */
export const BRAND_NAME_SHORT = BRAND_NAME_COMPACT;

/**
 * Nav wordmark with ®.
 * Defaults to the full “Forest Buddies®”. Only one label is visible at a time —
 * never truncate a dual-label wrapper (that caused incomplete marks).
 *
 * @param compactOnNarrow — when true (default), may omit ® below ~340px;
 *   otherwise always “Forest Buddies®”. Never shortens to “Forest®”.
 */
export function BrandMark({
  className = "",
  compactOnNarrow = true,
  /** @deprecated Use compactOnNarrow. Kept so older call sites still compile. */
  shortOnMobile,
}: {
  className?: string;
  compactOnNarrow?: boolean;
  shortOnMobile?: boolean;
}) {
  const allowCompact =
    typeof shortOnMobile === "boolean" ? shortOnMobile : compactOnNarrow;

  if (!allowCompact) {
    return (
      <span className={cn("whitespace-nowrap", className)}>
        {BRAND_NAME_REGISTERED}
      </span>
    );
  }

  return (
    <span className={cn("whitespace-nowrap", className)}>
      {/* Full name; drop ® only on extremely narrow phones */}
      <span className="hidden max-[339px]:inline">{BRAND_NAME_COMPACT}</span>
      <span className="inline max-[339px]:hidden">
        {BRAND_NAME_REGISTERED}
      </span>
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
