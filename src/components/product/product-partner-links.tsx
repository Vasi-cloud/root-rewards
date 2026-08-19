"use client";

import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { isAffiliateProduct } from "@/lib/commerce-type";
import { LIVE_EXTERNAL_PARTNER_IDS } from "@/lib/affiliate-platforms";
import {
  getPartnerCompareLinks,
  lowestPartnerListPrice,
} from "@/lib/partner-compare";
import type { Product } from "@/types";

/**
 * Live affiliate CTAs only (see LIVE_EXTERNAL_PARTNER_IDS).
 * Amazon is approved today; other networks stay off until toggled live.
 * Pure Amazon affiliate listings open the saved Associates URL.
 */
export function ProductPartnerLinks({
  product,
  className = "",
  compact = false,
}: {
  product: Product;
  className?: string;
  /** Tighter layout for dense cards */
  compact?: boolean;
}) {
  const affiliateListing = isAffiliateProduct(product);

  // Dedicated Amazon affiliate SKU — only Shop Amazon with saved URL
  if (affiliateListing && product.amazonAffiliateUrl?.trim()) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <PartnerOutboundButton
            platformId="amazon"
            productId={product.id}
            productName={product.name}
            amazonAsin={product.amazonAsin}
            amazonAffiliateUrl={product.amazonAffiliateUrl}
            listPrice={product.price}
            label={`Shop ${getAmazonStoreLabel()}`}
            primary
          />
        </div>
        {!compact && (
          <p className="text-[11px] text-muted-foreground">
            Amazon Associates · opens in a new tab
          </p>
        )}
      </div>
    );
  }

  const links = getPartnerCompareLinks(product);
  if (links.length === 0) return null;

  const lowest = lowestPartnerListPrice(links);
  const saveVsPartner =
    lowest != null ? Math.max(0, lowest - product.price) : 0;
  const amazon = links.find((l) => l.platformId === "amazon");
  const others = links.filter((l) => l.platformId !== "amazon");
  const amazonOnlyLive =
    LIVE_EXTERNAL_PARTNER_IDS.length === 1 &&
    LIVE_EXTERNAL_PARTNER_IDS[0] === "amazon";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {!compact && !amazonOnlyLive && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Compare &amp; buy
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Us £{product.price.toFixed(0)}
            {lowest != null && (
              <>
                {" "}
                · partners from £{lowest.toFixed(0)}
                {saveVsPartner > 0 && (
                  <span className="font-medium text-emerald-800">
                    {" "}
                    · save £{saveVsPartner.toFixed(0)} here
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
            amazonAffiliateUrl={product.amazonAffiliateUrl}
            listPrice={amazon.listPrice ?? product.price}
            label={`Shop ${getAmazonStoreLabel()}`}
            primary
            showPrice={!amazonOnlyLive}
          />
        )}
        {others.map((link) => (
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
      </div>
      {amazonOnlyLive ? (
        <p className="text-[11px] text-muted-foreground">
          Amazon primary · other retailers coming soon
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Opens in a new tab
        </p>
      )}
    </div>
  );
}
