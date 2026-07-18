"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  captureReferral,
  ensureMyAffiliateCode,
} from "@/lib/affiliate-storage";

/**
 * Captures ?ref= / ?product= across marketing pages and seeds a local affiliate code.
 * Mount once in the marketing shell (or root) so attribution is site-wide.
 */
export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    ensureMyAffiliateCode();
  }, []);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    const productId = searchParams.get("product") ?? undefined;
    captureReferral({
      code: ref,
      productId,
      landingPath: pathname,
    });
  }, [searchParams, pathname]);

  return null;
}
