"use client";

import { PartnerOutboundButton } from "@/components/affiliate/PartnerOutboundButton";
import { getPriceComparison } from "@/lib/price-comparison";
import type { Product } from "@/types";

/**
 * Big-store partner links (Amazon / Target / REI) for a product.
 * Falls back to Amazon search when no competitor row exists.
 */
export function ProductPartnerLinks({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const comparison = getPriceComparison(product);
  const competitors = comparison?.competitors ?? [];
  const partnerStores = competitors.filter((c) =>
    /amazon|target|rei/i.test(c.store)
  );

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {partnerStores.length > 0 ? (
        partnerStores.map((c) => (
          <PartnerOutboundButton
            key={c.store}
            store={c.store}
            productId={product.id}
            productName={product.name}
            listPrice={c.price}
          />
        ))
      ) : (
        <PartnerOutboundButton
          platformId="amazon"
          productId={product.id}
          productName={product.name}
          listPrice={product.price}
        />
      )}
      <span className="text-[11px] text-muted-foreground">
        Partner links · stock not live
      </span>
    </div>
  );
}
