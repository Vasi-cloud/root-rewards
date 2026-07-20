"use client";

import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import {
  getPartnerCompareLinks,
  lowestPartnerListPrice,
} from "@/lib/partner-compare";
import type { Product } from "@/types";

/**
 * Compare & buy strip — Amazon primary, then Target / REI / Etsy / Walmart / ClickBank.
 * Opens partner sites in a new tab with outbound tracking.
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
  const links = getPartnerCompareLinks(product, { amazonOnly });
  const lowest = lowestPartnerListPrice(links);
  const saveVsPartner =
    lowest != null ? Math.max(0, lowest - product.price) : 0;
  const amazon = links.find((l) => l.platformId === "amazon");
  const others = links.filter((l) => l.platformId !== "amazon");

  return (
    <div className={`space-y-1.5 ${className}`}>
      {!compact && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Compare &amp; buy
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Us ${product.price.toFixed(0)}
            {lowest != null && (
              <>
                {" "}
                · partners from ${lowest.toFixed(0)}
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
        {amazon && (
          <PartnerOutboundButton
            platformId="amazon"
            productId={product.id}
            productName={product.name}
            amazonAsin={product.amazonAsin}
            listPrice={amazon.listPrice ?? product.price}
            label={`Shop ${getAmazonStoreLabel()}`}
            primary
            showPrice
          />
        )}
        {!amazonOnly &&
          others.map((link) => (
            <PartnerOutboundButton
              key={link.platformId}
              platformId={link.platformId}
              productId={product.id}
              productName={product.name}
              listPrice={link.listPrice ?? product.price}
              label={link.label}
              showPrice
            />
          ))}
        <span className="text-[11px] text-muted-foreground">
          {compact
            ? "New tab"
            : "Amazon primary · other tags are placeholders · new tab"}
        </span>
      </div>
    </div>
  );
}
