"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  listPrice,
  className,
}: {
  /** Competitor store label from price comparison */
  store?: string;
  platformId?: AffiliatePlatformId;
  productId?: string;
  productName: string;
  listPrice?: number;
  className?: string;
}) {
  const id =
    platformId ??
    (store ? platformIdFromStoreName(store) : null) ??
    null;
  if (!id || id === "forest-buddies") return null;

  const platform = getAffiliatePlatform(id);

  function handleClick() {
    const { url } = recordPartnerOutboundClick({
      platformId: id!,
      productId,
      productName,
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
      Via {platform.name.split(" ")[0]}
      <ExternalLink className="size-3 opacity-70" />
    </Button>
  );
}
