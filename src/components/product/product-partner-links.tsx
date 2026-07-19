"use client";

import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { getPriceComparison } from "@/lib/price-comparison";
import type { Product } from "@/types";

/**
 * Big-store partner links — always includes Amazon (UK by default).
 * Adds Target / REI when price-comparison rows exist.
 */
export function ProductPartnerLinks({
  product,
  className = "",
  amazonOnly = false,
}: {
  product: Product;
  className?: string;
  /** Show only the Amazon affiliate button */
  amazonOnly?: boolean;
}) {
  const comparison = getPriceComparison(product);
  const competitors = comparison?.competitors ?? [];
  const otherPartners = amazonOnly
    ? []
    : competitors.filter((c) => /target|rei/i.test(c.store));
  const amazonComp = competitors.find((c) => /amazon/i.test(c.store));

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <PartnerOutboundButton
        platformId="amazon"
        productId={product.id}
        productName={product.name}
        amazonAsin={product.amazonAsin}
        listPrice={amazonComp?.price ?? product.price}
        label={getAmazonStoreLabel()}
      />
      {otherPartners.map((c) => (
        <PartnerOutboundButton
          key={c.store}
          store={c.store}
          productId={product.id}
          productName={product.name}
          listPrice={c.price}
        />
      ))}
      <span className="text-[11px] text-muted-foreground">
        Partner links · stock not live
      </span>
    </div>
  );
}
