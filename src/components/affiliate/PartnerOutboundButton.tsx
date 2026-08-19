"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  getAffiliatePlatform,
  isLiveExternalPartner,
  partnerButtonLabel,
  platformIdFromStoreName,
} from "@/lib/affiliate-platforms";
import type { AffiliatePlatformId } from "@/types";

export function PartnerOutboundButton({
  store,
  platformId,
  productId,
  productName,
  amazonAsin,
  amazonAffiliateUrl,
  listPrice,
  className,
  label,
  primary = false,
  showPrice = false,
}: {
  /** Competitor store label from price comparison */
  store?: string;
  platformId?: AffiliatePlatformId;
  productId?: string;
  productName: string;
  amazonAsin?: string | null;
  /** Saved full Amazon Associates URL (preferred for affiliate listings) */
  amazonAffiliateUrl?: string | null;
  listPrice?: number;
  className?: string;
  /** Override button label (e.g. "Amazon UK") */
  label?: string;
  /** Emphasize Amazon as the primary partner */
  primary?: boolean;
  /** Show list price next to the label for easy compare */
  showPrice?: boolean;
}) {
  const id =
    platformId ??
    (store ? platformIdFromStoreName(store) : null) ??
    null;
  if (!id || id === "forest-buddies") return null;
  // Hide non-approved networks (placeholders stay in catalog until toggled live)
  if (!isLiveExternalPartner(id)) return null;

  const platform = getAffiliatePlatform(id);
  const name =
    label ??
    (id === "amazon" ? getAmazonStoreLabel() : partnerButtonLabel(id));
  const priceBit =
    showPrice && listPrice != null
      ? ` · £${listPrice.toFixed(0)}`
      : "";

  function handleClick() {
    const { url } = recordPartnerOutboundClick({
      platformId: id!,
      productId,
      productName,
      amazonAsin,
      amazonAffiliateUrl,
      listPrice,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const tip =
    id === "amazon"
      ? `Amazon Associates link (tag forestbuddies-20). ${platform.attributionNote}`
      : `${platform.attributionNote} ${platform.trackingNote}`;

  return (
    <Button
      type="button"
      size="sm"
      variant={primary ? "default" : "outline"}
      className={`h-auto min-h-8 gap-1 px-2 py-1 text-xs ${
        primary
          ? "bg-emerald-800 text-white hover:bg-emerald-800/90"
          : ""
      } ${className ?? ""}`}
      onClick={handleClick}
      title={tip}
      aria-label={`${name}${priceBit} (opens in a new tab)`}
    >
      {name}
      {priceBit}
      <ExternalLink className="size-3 opacity-70" />
    </Button>
  );
}
