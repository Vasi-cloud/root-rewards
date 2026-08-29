"use client";

import { Leaf } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** True for local public paths or direct https image URLs (e.g. m.media-amazon.com). */
export function isRenderableProductImageUrl(
  url: string | null | undefined
): boolean {
  const s = String(url ?? "").trim();
  if (!s) return false;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Marketplace card / detail image: https (or local) imageUrl, leaf placeholder on miss/error.
 */
export function MarketplaceProductImage({
  imageUrl,
  name,
  className,
  size = "card",
  service = false,
}: {
  imageUrl?: string | null;
  name: string;
  className?: string;
  size?: "card" | "detail";
  service?: boolean;
}) {
  const src = isRenderableProductImageUrl(imageUrl) ? imageUrl!.trim() : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const box =
    size === "detail"
      ? "size-16 sm:size-20 rounded-2xl"
      : "mb-3 size-14 sm:mb-4 sm:size-16 rounded-2xl";

  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        box,
        service ? "bg-sky-100" : "bg-primary/5",
        className
      )}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={name}
          fill
          className="object-cover"
          sizes={size === "detail" ? "80px" : "64px"}
          unoptimized={src!.startsWith("https://")}
          onError={() => setFailed(true)}
        />
      ) : (
        <Leaf
          className={cn(
            size === "detail" ? "size-8 sm:size-9" : "size-7 sm:size-8",
            service ? "text-sky-800" : "text-primary"
          )}
        />
      )}
    </div>
  );
}
