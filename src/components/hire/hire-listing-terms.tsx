"use client";

import { useEffect, useState } from "react";

import { hireListingTermLines } from "@/lib/lea-valley-guest";

export function PublicHireTerms({
  listingId,
  hireTerms,
  showFallback,
}: {
  listingId: string;
  hireTerms?: string;
  showFallback: boolean;
}) {
  const [remote, setRemote] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(
      `/api/hire-listing-terms?listingId=${encodeURIComponent(listingId)}`
    )
      .then((res) => res.json())
      .then((data: { terms?: string }) => {
        if (!cancelled && typeof data.terms === "string") {
          setRemote(data.terms);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const written = hireTerms?.trim() || remote.trim();
  if (!written && !showFallback) return null;
  const lines = hireListingTermLines(written);

  return (
    <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3">
      <p className="text-sm font-semibold text-primary">Listing terms</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
