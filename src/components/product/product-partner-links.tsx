"use client";

import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import {
  getPartnerCompareLinks,
  lowestPartnerListPrice,
} from "@/lib/partner-compare";
import type { Product } from "@/types";

/**
 * Partner compare strip — Amazon first, then Target / REI / Etsy / Walmart.
 */
export function ProductPartnerLinks({
  product,
  className = "",
  amazonOnly = false,
  compact = false,
}: {
  product: Product;
  className?: string;
  /** Show only the Amazon affiliate button */
  amazonOnly?: boolean;
  /** Tighter layout for dense cards */
  compact?: boolean;
}) {
  const links = getPartnerCompareLinks(product, {
    maxSecondary: amazonOnly ? 0 : 3,
  });
  const lowest = lowestPartnerListPrice(links);
  const saveVsPartner =
    lowest != null ? Math.max(0, lowest - product.price) : 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {!compact && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Compare prices
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Us ${product.price.toFixed(0)}
            {lowest != null && (
              <>
                {" "}
                · elsewhere from ${lowest.toFixed(0)}
                {saveVsPartner > 0 && (
                  <span className="font-medium text-emerald-800">
                    {" "}
                    · save ${saveVsPartner.toFixed(0)} here
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {links.map((link) => (
          <PartnerOutboundButton
            key={link.platformId}
            platformId={link.platformId}
            productId={product.id}
            productName={product.name}
            amazonAsin={product.amazonAsin}
            listPrice={link.listPrice ?? product.price}
            label={link.label}
            primary={link.primary}
            showPrice={link.listPrice != null}
          />
        ))}
        <span className="text-[11px] text-muted-foreground">
          {compact ? "Partner links" : "Opens partner site · stock not live"}
        </span>
      </div>
    </div>
  );
}
