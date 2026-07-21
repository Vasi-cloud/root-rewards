import Link from "next/link";

import { TrademarkRegLink } from "@/components/legal/trademark-reg-link";
import { Badge } from "@/components/ui/badge";

/** Canonical registered brand string for prominent display */
export const BRAND_NAME_REGISTERED = "Forest Buddies®";

/** Compact nav / logo wordmark with ® */
export function BrandMark({
  className = "",
  shortOnMobile = true,
}: {
  className?: string;
  shortOnMobile?: boolean;
}) {
  return (
    <span className={className}>
      {shortOnMobile ? (
        <>
          <span className="sm:hidden">Forest®</span>
          <span className="hidden sm:inline">{BRAND_NAME_REGISTERED}</span>
        </>
      ) : (
        BRAND_NAME_REGISTERED
      )}
    </span>
  );
}

/** Small badge for marketplace / shop / product headers */
export function MarketplaceBrandBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={`font-normal text-muted-foreground ${className}`}
    >
      Forest Buddies® Marketplace
    </Badge>
  );
}

/** Subtle footer strip for shop / marketplace surfaces */
export function SubtleTrademarkNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs ${className}`}
    >
      Forest Buddies® Marketplace · UK Registered Trademark (No.{" "}
      <TrademarkRegLink className="underline-offset-2 hover:underline" />
      ).{" "}
      <Link
        href="/trademark"
        className="underline-offset-2 hover:underline"
      >
        Trademark notice
      </Link>
    </p>
  );
}
