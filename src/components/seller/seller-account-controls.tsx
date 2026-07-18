"use client";

import {
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Store,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSeller } from "@/contexts/seller-context";

type ConfirmMode = null | "pause" | "cancel";

/**
 * Pause / cancel seller status — Profile & Settings in Seller Hub.
 * Soft approach: listings hidden, catalog & earnings retained; re-apply anytime after cancel.
 */
export function SellerAccountControls() {
  const { seller, pauseSeller, resumeSeller, cancelSeller } = useSeller();
  const [confirm, setConfirm] = useState<ConfirmMode>(null);

  if (!seller) return null;

  const listingCount = seller.products.length;
  const approvedListings = seller.products.filter(
    (p) => p.status === "approved"
  ).length;

  if (seller.status === "paused") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100 text-amber-950">Paused</Badge>
            <p className="font-medium text-amber-950">Your shop is paused</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
            Your public shop and listings are hidden from Marketplace and
            /shop. Product data, earnings history, and payouts stay saved —
            nothing was deleted.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-amber-950/90">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-800" />
              {listingCount} listing{listingCount === 1 ? "" : "s"} retained
              {approvedListings > 0
                ? ` (${approvedListings} were public)`
                : ""}
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-800" />
              Resume anytime — no new application needed
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={resumeSeller}>
              <PlayCircle className="size-3.5" />
              Resume selling
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirm("cancel")}
            >
              Leave seller program instead
            </Button>
          </div>
        </div>
        {confirm === "cancel" && (
          <CancelConfirm
            listingCount={listingCount}
            onConfirm={() => {
              cancelSeller();
              setConfirm(null);
            }}
            onBack={() => setConfirm(null)}
          />
        )}
      </div>
    );
  }

  if (seller.status !== "approved") return null;

  if (confirm === "pause") {
    return (
      <div
        className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-4"
        role="dialog"
        aria-labelledby="pause-seller-title"
      >
        <p
          id="pause-seller-title"
          className="flex items-center gap-2 font-medium text-amber-950"
        >
          <PauseCircle className="size-4 shrink-0" />
          Pause your shop?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your shop page and all listings will be hidden from shoppers right
          away. You can resume anytime without re-applying.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2.5 text-sm">
          <p className="font-medium text-foreground">What happens to listings</p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              Hidden from Marketplace and public shop
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              Catalog, photos, and approval status kept as-is
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
              Earnings &amp; payout history unchanged
            </li>
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-950"
            onClick={() => {
              pauseSeller();
              setConfirm(null);
            }}
          >
            Confirm pause
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
            Never mind
          </Button>
        </div>
      </div>
    );
  }

  if (confirm === "cancel") {
    return (
      <CancelConfirm
        listingCount={listingCount}
        onConfirm={() => {
          cancelSeller();
          setConfirm(null);
        }}
        onBack={() => setConfirm(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seller status
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pause temporarily or leave the seller program. Listings are hidden —
          never hard-deleted — and you can come back later.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setConfirm("pause")}
        >
          <PauseCircle className="size-3.5" />
          Pause selling
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirm("cancel")}
        >
          <Store className="size-3.5" />
          Cancel seller status
        </Button>
      </div>
    </div>
  );
}

function CancelConfirm({
  listingCount,
  onConfirm,
  onBack,
}: {
  listingCount: number;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      role="dialog"
      aria-labelledby="cancel-seller-title"
    >
      <p
        id="cancel-seller-title"
        className="flex items-center gap-2 font-medium text-destructive"
      >
        <AlertTriangle className="size-4 shrink-0" />
        Cancel seller status?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You&apos;ll leave the seller program. Your public shop and listings
        disappear for shoppers. Your catalog ({listingCount} listing
        {listingCount === 1 ? "" : "s"}), earnings, and profile stay saved so
        you can re-apply later.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
        <li className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
          Soft cancel — data retained for legal &amp; re-apply
        </li>
        <li className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
          Re-apply anytime from Become a Seller
        </li>
        <li className="flex gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
          New application needs approval before you sell again
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/5"
          onClick={onConfirm}
        >
          Confirm cancel seller status
        </Button>
        <Button size="sm" variant="ghost" onClick={onBack}>
          Keep selling
        </Button>
      </div>
    </div>
  );
}
