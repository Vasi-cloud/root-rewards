"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAmazonStoreLabel } from "@/lib/amazon-affiliate";
import { recordPartnerOutboundClick } from "@/lib/affiliate-storage";
import {
  getAffiliatePlatform,
  platformIdFromStoreName,
} from "@/lib/affiliate-platforms";
import type { AffiliatePlatformId } from "@/types";

export function PartnerOutboundButton({
  store,
  platformId,
  productId,
  productName,
  amazonAsin,
  listPrice,
  className,
  label,
}: {
  /** Competitor store label from price comparison */
  store?: string;
  platformId?: AffiliatePlatformId;
  productId?: string;
  productName: string;
  amazonAsin?: string | null;
  listPrice?: number;
  className?: string;
  /** Override button label (e.g. "Amazon UK") */
  label?: string;
}) {
  const id =
    platformId ??
    (store ? platformIdFromStoreName(store) : null) ??
    null;
  if (!id || id === "forest-buddies") return null;

  const platform = getAffiliatePlatform(id);
  const buttonLabel =
    label ??
    (id === "amazon"
      ? getAmazonStoreLabel()
      : `Via ${platform.name.split(" ")[0]}`);

  function handleClick() {
    const { url } = recordPartnerOutboundClick({
      platformId: id!,
      productId,
      productName,
      amazonAsin,
      listPrice,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={`h-auto min-h-8 gap-1 px-2 py-1 text-xs ${className ?? ""}`}
      onClick={handleClick}
      title={`${platform.attributionNote} ${platform.trackingNote}`}
    >
      {buttonLabel.startsWith("Via ") ? buttonLabel : `Via ${buttonLabel}`}
      <ExternalLink className="size-3 opacity-70" />
    </Button>
  );
}
